import { shouldAskQuestion10 } from "../questionnaire";
import type {
  AppData,
  AnswerValue,
  ConfidenceBand,
  ConfidenceLabel,
  DiagnosisStatus,
  HardStopRule,
  MatcherResult,
  QuestionnaireAnswers,
  RankedMatcherResult,
  RankedTreatmentMatch,
  TreatmentContextAdjustmentEntry,
  TreatmentSubgroupWeightEntry,
} from "../types";

function isRuleMatch(rule: HardStopRule, answers: QuestionnaireAnswers): boolean {
  const answer = answers[rule.questionId];

  if (answer === undefined) {
    return false;
  }

  if (rule.operator === "eq") {
    return answer === rule.value;
  }

  if (typeof answer === "number" && typeof rule.value === "number") {
    return answer >= rule.value;
  }

  return false;
}

export function validateAnswers(
  answers: QuestionnaireAnswers,
  enums: AppData["questionnaireEnums"],
): void {
  for (const [questionId, answer] of Object.entries(answers)) {
    const allowedValues = enums[questionId];

    if (!allowedValues) {
      throw new Error(`Unknown questionnaire field: ${questionId}`);
    }

    const valid = allowedValues.some((candidate) => candidate === answer);
    if (!valid) {
      throw new Error(
        `Invalid enum value for ${questionId}: ${String(answer)}`,
      );
    }
  }

  const q4 = answers.q4_mania_screen;
  if (q4 !== undefined && !["no", "maybe", "yes"].includes(String(q4))) {
    throw new Error("q4_mania_screen must be exactly no / maybe / yes");
  }

  const q5 = answers.q5_psychosis_screen;
  if (q5 !== undefined && !["no", "maybe", "yes"].includes(String(q5))) {
    throw new Error("q5_psychosis_screen must be exactly no / maybe / yes");
  }
}

export function deriveDiagnosisStatus(
  answers: QuestionnaireAnswers,
): DiagnosisStatus {
  const q1 = answers.q1_diagnosed_depression;
  const q10 = answers.q10_diagnosis_type;

  if (q1 === "no") {
    return "unconfirmed";
  }

  if (q1 === "yes" || q1 === "not_sure" || q1 === "prefer_not") {
    if (q10 === "major_depression") {
      return "confirmed_major";
    }

    if (q10 === "persistent_chronic") {
      return "confirmed_persistent";
    }

    if (q10 === "depressive_symptoms_only") {
      return "confirmed_depressive_symptoms";
    }

    return "unknown";
  }

  return "unknown";
}

export function getActiveCautionFlags(
  appData: AppData,
  answers: QuestionnaireAnswers,
): string[] {
  return appData.hardStopRules.cautionFlags
    .filter((rule) => isRuleMatch(rule, answers))
    .map((rule) => rule.id);
}

export function isHardStop(
  appData: AppData,
  answers: QuestionnaireAnswers,
): boolean {
  return appData.hardStopRules.hardStops.some((rule) =>
    isRuleMatch(rule, answers),
  );
}

function sumWeight(
  weightMap: Record<string, number> | undefined,
  value: AnswerValue | undefined,
): number {
  if (value === undefined || !weightMap) {
    return 0;
  }

  return weightMap[String(value)] ?? 0;
}

function getUnknownCount(answers: QuestionnaireAnswers): number {
  let unknownCount = 0;

  if (
    answers.q1_diagnosed_depression === "not_sure" ||
    answers.q1_diagnosed_depression === "prefer_not"
  ) {
    unknownCount += 1;
  }

  if (answers.q6_age_group === "unknown") {
    unknownCount += 1;
  }

  if (answers.q7_perinatal_stage === "unknown") {
    unknownCount += 1;
  }

  if (answers.q8_source_group === "unknown") {
    unknownCount += 1;
  }

  if (answers.q9_medical_condition === "unknown") {
    unknownCount += 1;
  }

  if (shouldAskQuestion10(answers)) {
    if (
      answers.q10_diagnosis_type === undefined ||
      answers.q10_diagnosis_type === "not_sure" ||
      answers.q10_diagnosis_type === "prefer_not"
    ) {
      unknownCount += 1;
    }
  }

  if (answers.q11_course === "unknown") {
    unknownCount += 1;
  }

  if (answers.q12_help_style === "not_sure") {
    unknownCount += 1;
  }

  if (answers.q13_linked_to === "not_sure") {
    unknownCount += 1;
  }

  return unknownCount;
}

function getConfidenceLabel(
  confidence: number,
  bands: ConfidenceBand[],
): ConfidenceLabel {
  const sortedBands = [...bands].sort((left, right) => right.min - left.min);
  const matchedBand = sortedBands.find((band) => confidence >= band.min);
  return matchedBand?.label ?? "low";
}

function getObservedSubgroupMatch(
  weights: TreatmentSubgroupWeightEntry,
  answers: QuestionnaireAnswers,
  diagnosisStatus: DiagnosisStatus,
): number {
  return (
    sumWeight(weights.weight_age, answers.q6_age_group) +
    sumWeight(weights.weight_perinatal, answers.q7_perinatal_stage) +
    sumWeight(weights.weight_sourceGroup, answers.q8_source_group) +
    sumWeight(weights.weight_medicalCondition, answers.q9_medical_condition) +
    sumWeight(weights.weight_diagnosisStatus, diagnosisStatus) +
    sumWeight(weights.weight_course, answers.q11_course)
  );
}

function getContextScore(
  adjustments: TreatmentContextAdjustmentEntry,
  answers: QuestionnaireAnswers,
  defaultContextCap: number,
): number {
  const contextCap = adjustments.contextCap ?? defaultContextCap;
  const helpStyleScore = sumWeight(
    adjustments.helpStyleWeight,
    answers.q12_help_style,
  );
  const linkedToScore = sumWeight(
    adjustments.linkedToWeight,
    answers.q13_linked_to,
  );

  return Math.min(contextCap, helpStyleScore + linkedToScore);
}

function getSafetyCautionPenalty(
  cautionFlags: string[],
  cautionPenalties: Record<string, number>,
): number {
  return cautionFlags.reduce(
    (total, cautionFlag) => total + (cautionPenalties[cautionFlag] ?? 0),
    0,
  );
}

function buildExplanationBullets(
  appData: AppData,
  treatmentId: string,
  answers: QuestionnaireAnswers,
): string[] {
  const subgroupWeights = appData.treatmentSubgroupWeights[treatmentId];
  const contextWeights = appData.treatmentContextAdjustments[treatmentId];
  const templates = appData.explanationTemplates.explanations;
  const explanationIds: string[] = [];

  if (
    (answers.q7_perinatal_stage === "pregnant" ||
      answers.q7_perinatal_stage === "postpartum") &&
    sumWeight(
      subgroupWeights.weight_perinatal,
      answers.q7_perinatal_stage,
    ) > 0
  ) {
    explanationIds.push("perinatal");
  }

  if (
    answers.q9_medical_condition !== "none" &&
    answers.q9_medical_condition !== "unknown" &&
    sumWeight(
      subgroupWeights.weight_medicalCondition,
      answers.q9_medical_condition,
    ) > 0
  ) {
    explanationIds.push("medical_comorbidity");
  }

  if (
    (answers.q11_course === "recurrent" ||
      answers.q11_course === "chronic_hard_to_recover") &&
    sumWeight(subgroupWeights.weight_course, answers.q11_course) > 0
  ) {
    explanationIds.push("recurrent_course");
  }

  if (
    (answers.q12_help_style === "activation" ||
      answers.q13_linked_to === "low_motivation_inactivity") &&
    (sumWeight(contextWeights.helpStyleWeight, answers.q12_help_style) > 0 ||
      sumWeight(contextWeights.linkedToWeight, answers.q13_linked_to) > 0)
  ) {
    explanationIds.push("activation");
  }

  if (
    (answers.q12_help_style === "relationship_focused" ||
      answers.q13_linked_to === "relationships_loneliness") &&
    (sumWeight(contextWeights.helpStyleWeight, answers.q12_help_style) > 0 ||
      sumWeight(contextWeights.linkedToWeight, answers.q13_linked_to) > 0)
  ) {
    explanationIds.push("relationship_focused");
  }

  if (
    (answers.q12_help_style === "health_condition_coping" ||
      answers.q13_linked_to === "physical_health") &&
    (sumWeight(contextWeights.helpStyleWeight, answers.q12_help_style) > 0 ||
      sumWeight(contextWeights.linkedToWeight, answers.q13_linked_to) > 0)
  ) {
    explanationIds.push("health_condition_coping");
  }

  const bullets = [...new Set(explanationIds)]
    .slice(0, 3)
    .map((id) => templates[id])
    .filter(Boolean);

  return bullets.length > 0 ? bullets : [templates.default];
}

function buildCautionBullets(
  appData: AppData,
  diagnosisStatus: DiagnosisStatus,
  cautionFlags: string[],
  unknownCount: number,
): string[] {
  const cautions: string[] = [];
  const templates = appData.explanationTemplates.cautions;

  if (diagnosisStatus === "unconfirmed") {
    cautions.push(templates.unconfirmed_diagnosis);
  }

  if (diagnosisStatus === "unknown") {
    cautions.push(templates.unknown_diagnosis);
  }

  cautionFlags.forEach((flag) => {
    const template = templates[flag];
    if (template) {
      cautions.push(template);
    }
  });

  if (
    unknownCount >=
    appData.scoringConfig.missingDataPenalty.manyUnknownAnswersThreshold
  ) {
    cautions.push(templates.many_unknown_answers);
  }

  return [...new Set(cautions)];
}

function getContributingSubtypeIds(
  appData: AppData,
  treatmentId: string,
): string[] {
  return [
    ...new Set(
      appData.treatmentRegistry
        .filter((entry) => entry.displayGroupId === treatmentId)
        .map((entry) => entry.cleanedSubtypeId),
    ),
  ];
}

export function getMatchResult(
  appData: AppData,
  answers: QuestionnaireAnswers,
): MatcherResult {
  validateAnswers(answers, appData.questionnaireEnums);

  if (isHardStop(appData, answers)) {
    return { kind: "contact_specialist_now" };
  }

  const diagnosisStatus = deriveDiagnosisStatus(answers);
  const cautionFlags = getActiveCautionFlags(appData, answers);
  const unknownCount = getUnknownCount(answers);
  const diagnosticPenalty =
    diagnosisStatus === "unconfirmed" || diagnosisStatus === "unknown"
      ? appData.scoringConfig.diagnosticPenalties[diagnosisStatus]
      : 0;
  const safetyCautionPenalty = getSafetyCautionPenalty(
    cautionFlags,
    appData.scoringConfig.cautionPenalties,
  );
  const missingDataPenalty = Math.min(
    appData.scoringConfig.missingDataPenalty.maxMissingPenalty,
    unknownCount * appData.scoringConfig.missingDataPenalty.penaltyPerUnknown,
  );

  const scoredTreatments: RankedTreatmentMatch[] = Object.keys(
    appData.displayGroupMetadata,
  ).map((displayGroupId) => {
    const baseScore = appData.treatmentBaseScores[displayGroupId];
    const subgroupWeights = appData.treatmentSubgroupWeights[displayGroupId];
    const contextAdjustments =
      appData.treatmentContextAdjustments[displayGroupId];
    const metadata = appData.displayGroupMetadata[displayGroupId];
    const observedSubgroupMatch = getObservedSubgroupMatch(
      subgroupWeights,
      answers,
      diagnosisStatus,
    );
    const contextScore = getContextScore(
      contextAdjustments,
      answers,
      appData.scoringConfig.contextCap,
    );
    const score =
      baseScore.baseEvidence +
      observedSubgroupMatch +
      contextScore -
      baseScore.fragilityPenalty;
    const confidence = Math.max(
      0,
      Math.min(
        100,
        baseScore.baseConfidence -
          diagnosticPenalty -
          safetyCautionPenalty -
          missingDataPenalty,
      ),
    );

    return {
      id: displayGroupId,
      displayName: metadata.displayName,
      description: metadata.description,
      score,
      confidence,
      confidenceLabel: getConfidenceLabel(
        confidence,
        appData.scoringConfig.confidenceBands,
      ),
      contributingSubtypeIds: getContributingSubtypeIds(appData, displayGroupId),
      explanation: buildExplanationBullets(appData, displayGroupId, answers),
      cautions: buildCautionBullets(
        appData,
        diagnosisStatus,
        cautionFlags,
        unknownCount,
      ),
    };
  });

  const sorted = [...scoredTreatments].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return right.confidence - left.confidence;
  });

  const topScore = sorted[0]?.score ?? 0;
  const tieThreshold = appData.scoringConfig.tieThreshold;
  const ranked = [sorted[0]].filter(Boolean) as RankedTreatmentMatch[];

  if (sorted[1] && topScore - sorted[1].score <= tieThreshold) {
    ranked.push(sorted[1]);
  }

  if (sorted[2] && topScore - sorted[2].score <= tieThreshold) {
    ranked.push(sorted[2]);
  }

  const result: RankedMatcherResult = {
    kind: "ranked",
    diagnosisPrompt: answers.q1_diagnosed_depression === "no",
    ranked,
    alternatives: ranked.length === 1 ? sorted.slice(1, 3) : [],
    nextSteps: {
      set2DeliveryRefinementAvailable: true,
      providerMarketplaceAvailable: true,
    },
  };

  return result;
}
