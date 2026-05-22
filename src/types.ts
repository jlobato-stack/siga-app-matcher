export const QUESTION_IDS = [
  "q1_diagnosed_depression",
  "q2_suicidal_ideation",
  "q3_suicidal_intent_now",
  "q4_mania_screen",
  "q5_psychosis_screen",
  "q6_age_group",
  "q7_perinatal_stage",
  "q8_source_group",
  "q9_medical_condition",
  "q10_diagnosis_type",
  "q11_course",
  "q12_help_style",
  "q13_linked_to",
] as const;

export type QuestionId = (typeof QUESTION_IDS)[number];
export type AnswerValue = string | number;
export type QuestionnaireAnswers = Partial<Record<QuestionId, AnswerValue>>;

export interface QuestionOption {
  key: string;
  value: AnswerValue;
  label: string;
}

export interface QuestionDefinition {
  id: QuestionId;
  title: string;
  options: QuestionOption[];
  helperText?: string;
}

export type DiagnosisStatus =
  | "unconfirmed"
  | "confirmed_major"
  | "confirmed_persistent"
  | "confirmed_depressive_symptoms"
  | "unknown";

export type ConfidenceLabel = "high" | "moderate" | "low";

export interface TreatmentRegistryEntry {
  rawLabel: string;
  cleanedSubtypeId: string;
  cleanedSubtypeName: string;
  displayGroupId: string;
  displayGroupName: string;
  scoreKey?: string;
}

export interface TreatmentBaseScoreEntry {
  baseEvidence: number;
  baseConfidence: number;
  fragilityPenalty: number;
}

export interface TreatmentSubgroupWeightEntry {
  weight_age?: Record<string, number>;
  weight_perinatal?: Record<string, number>;
  weight_sourceGroup?: Record<string, number>;
  weight_medicalCondition?: Record<string, number>;
  weight_diagnosisStatus?: Record<string, number>;
  weight_course?: Record<string, number>;
}

export interface TreatmentContextAdjustmentEntry {
  contextCap?: number;
  helpStyleWeight?: Record<string, number>;
  linkedToWeight?: Record<string, number>;
}

export interface DisplayGroupMetadataEntry {
  displayName: string;
  description: string;
  shortSummary: string;
}

export interface HardStopRule {
  id: string;
  questionId: QuestionId;
  operator: "eq" | "gte";
  value: AnswerValue;
}

export interface HardStopRules {
  pageTitle: string;
  hardStops: HardStopRule[];
  cautionFlags: HardStopRule[];
}

export interface ConfidenceBand {
  label: ConfidenceLabel;
  min: number;
}

export interface ScoringConfig {
  diagnosticPenalties: Record<"unconfirmed" | "unknown", number>;
  cautionPenalties: Record<string, number>;
  missingDataPenalty: {
    penaltyPerUnknown: number;
    maxMissingPenalty: number;
    manyUnknownAnswersThreshold: number;
  };
  confidenceBands: ConfidenceBand[];
  tieThreshold: number;
  contextCap: number;
}

export interface ExplanationTemplates {
  explanations: Record<string, string>;
  cautions: Record<string, string>;
}

export interface AppCopy {
  appTitle: string;
  intro: string;
  startButtonLabel: string;
  resumeButtonLabel: string;
  saveAndReturnLabel: string;
  exitButtonLabel: string;
  backButtonLabel: string;
  nextButtonLabel: string;
  resultsHeading: string;
  resultsSubheading: string;
  resultsNote: string;
  deliveryPlaceholder: string;
  providerPlaceholder: string;
  crisisIntro: string;
  crisisBestNextStep: string;
  crisisEmergency: string;
  crisisCountryChooserLabel: string;
  crisisProfessionalCareHeading: string;
  crisisChecklistHeading: string;
  questionnaireSavedNotice: string;
}

export interface CrisisSupportResourceLink {
  id: string;
  name: string;
  label: string;
  url: string;
  cost: string;
  availability: string;
  priority: number;
  notes: string[];
}

export interface CrisisProfessionalCareOption {
  id: string;
  title: string;
  description: string;
  kind: "public" | "primary_care" | "licensed_specialist" | "private_urgent";
  cost: string;
  availability: string;
}

export interface CrisisSupportResources {
  global: CrisisSupportResourceLink[];
  US: CrisisSupportResourceLink[];
  UK: CrisisSupportResourceLink[];
  IE: CrisisSupportResourceLink[];
  countryLabels: Record<string, string>;
  professionalCareOptions: CrisisProfessionalCareOption[];
  nextStepsChecklist: string[];
  extensionPoints: {
    providerMarketplace: boolean;
    countrySpecificPrivateOptions: boolean;
    locationAwareRouting: boolean;
  };
}

export interface QuestionnaireEnumMap {
  [key: string]: AnswerValue[];
}

export type ProviderType =
  | "clinic"
  | "directory"
  | "program"
  | "platform"
  | "professional-body"
  | "research-center";

export type ProviderFormat =
  | "in-person"
  | "online"
  | "telephone"
  | "hybrid"
  | "research";

export type ProviderDeliveryCategory =
  | "in-person"
  | "online"
  | "web-based"
  | "ai";

export interface ProviderRecord {
  id: string;
  level1: string;
  level2: string;
  level3: string;
  matchLevel: 1 | 2 | 3;
  matchedTo: string;
  providerName: string;
  providerType: ProviderType;
  url: string;
  regions: string[];
  countries: string[];
  formats: ProviderFormat[];
  deliveryCategory?: ProviderDeliveryCategory;
  notes?: string;
}

export interface TreatmentDurationBenchmark {
  therapyType: string;
  targetClinicalDurationWeeks: string;
  hoursPerWeek: string;
  totalEstimatedHours: string;
  establishedClinicalBenchmark: string;
  referenceGuidelinesAndManuals: string;
  decision: string;
  finalRationaleAndCalculationEvidence: string;
}

export interface LegalDocumentSource {
  label: string;
  url: string;
}

export interface LegalDocumentSection {
  heading: string;
  body: string[];
}

export interface LegalDocument {
  id: string;
  path: string;
  title: string;
  shortTitle: string;
  lastUpdated: string;
  summary: string;
  sections: LegalDocumentSection[];
  sources: LegalDocumentSource[];
}

export interface AppData {
  treatmentsColumnYRaw: string[];
  treatmentRegistry: TreatmentRegistryEntry[];
  treatmentBaseScores: Record<string, TreatmentBaseScoreEntry>;
  treatmentSubgroupWeights: Record<string, TreatmentSubgroupWeightEntry>;
  treatmentContextAdjustments: Record<string, TreatmentContextAdjustmentEntry>;
  questionnaireEnums: QuestionnaireEnumMap;
  hardStopRules: HardStopRules;
  explanationTemplates: ExplanationTemplates;
  scoringConfig: ScoringConfig;
  displayGroupMetadata: Record<string, DisplayGroupMetadataEntry>;
  appCopy: AppCopy;
  crisisSupportResources: CrisisSupportResources;
  providers: ProviderRecord[];
  treatmentDurationBenchmarks: TreatmentDurationBenchmark[];
  legalDocumentsUk: LegalDocument[];
}

export interface RankedTreatmentMatch {
  id: string;
  displayName: string;
  description: string;
  score: number;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  contributingSubtypeIds: string[];
  explanation: string[];
  cautions: string[];
}

export interface RankedMatcherResult {
  kind: "ranked";
  diagnosisPrompt: boolean;
  ranked: RankedTreatmentMatch[];
  alternatives: RankedTreatmentMatch[];
  nextSteps: {
    set2DeliveryRefinementAvailable: true;
    providerMarketplaceAvailable: true;
  };
}

export interface ContactSpecialistResult {
  kind: "contact_specialist_now";
}

export type MatcherResult = RankedMatcherResult | ContactSpecialistResult;

export interface PersistedDraft {
  answers: QuestionnaireAnswers;
  savedAt: string;
}
