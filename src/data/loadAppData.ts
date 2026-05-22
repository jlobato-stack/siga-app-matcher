import type {
  AppData,
  DisplayGroupMetadataEntry,
  TreatmentRegistryEntry,
} from "../types";

const REQUIRED_FILES = [
  "treatments_column_y_raw.json",
  "treatment_registry.json",
  "treatment_base_scores.json",
  "treatment_subgroup_weights.json",
  "treatment_context_adjustments.json",
  "questionnaire_enums.json",
  "hard_stop_rules.json",
  "explanation_templates.json",
  "scoring_config.json",
  "display_group_metadata.json",
  "app_copy.json",
  "crisis_support_resources.json",
  "providers.json",
  "treatment_duration_benchmarks.json",
  "legal_documents_uk.json",
] as const;

const REQUIRED_DISPLAY_GROUPS: Record<string, string> = {
  cbt: "Cognitive Behavioral Therapy (CBT)",
  cbt_health_tailored: "Health-Tailored CBT",
  behavioral_activation: "Behavioral Activation",
  ipt: "Interpersonal Therapy (IPT)",
  mindfulness_relapse_focused: "Mindfulness-Based / Relapse-Focused Therapy",
  problem_solving: "Problem-Solving Therapy",
  supportive_therapy: "Supportive Therapy",
  life_review: "Life Review Therapy",
  psychodynamic: "Psychodynamic Therapy",
  act: "Acceptance and Commitment Therapy (ACT)",
  other_third_wave: "Other Third-Wave Cognitive Therapies",
  combined_multi_component: "Combined / Multi-Component Interventions",
  psychoeducational_guided_self_help:
    "Psychoeducational or Guided Self-Help Variants",
  other_psychological: "Other Psychological Treatments",
};

async function loadJson<T>(
  fileName: string,
  fetcher: typeof fetch,
): Promise<T> {
  const response = await fetcher(`${import.meta.env.BASE_URL}data/${fileName}`);

  if (!response.ok) {
    throw new Error(`Missing required file: ${fileName}`);
  }

  return (await response.json()) as T;
}

function assertNonEmptyArray(
  value: unknown,
  fileName: string,
): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Required file is empty or invalid: ${fileName}`);
  }
}

function assertNonEmptyObject(
  value: unknown,
  fileName: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Object.keys(value).length === 0) {
    throw new Error(`Required file is empty or invalid: ${fileName}`);
  }
}

function validateRegistryEntry(
  entry: TreatmentRegistryEntry,
  index: number,
): void {
  const requiredFields: Array<keyof TreatmentRegistryEntry> = [
    "rawLabel",
    "cleanedSubtypeId",
    "cleanedSubtypeName",
    "displayGroupId",
    "displayGroupName",
  ];

  for (const field of requiredFields) {
    if (!entry[field]) {
      throw new Error(
        `Invalid registry entry at index ${index}: missing ${field}`,
      );
    }
  }

  if (entry.scoreKey && entry.scoreKey !== entry.displayGroupId) {
    throw new Error(
      `Invalid registry entry at index ${index}: scoreKey must equal displayGroupId for this MVP`,
    );
  }
}

function validateMetadata(
  displayGroupId: string,
  metadata: DisplayGroupMetadataEntry | undefined,
): void {
  if (!metadata) {
    throw new Error(
      `Missing display_group_metadata.json entry for displayGroupId "${displayGroupId}"`,
    );
  }

  if (!metadata.displayName || !metadata.description || !metadata.shortSummary) {
    throw new Error(
      `Incomplete display_group_metadata.json entry for displayGroupId "${displayGroupId}"`,
    );
  }
}

export async function loadAppData(
  fetcher: typeof fetch = fetch,
): Promise<AppData> {
  const [
    treatmentsColumnYRaw,
    treatmentRegistry,
    treatmentBaseScores,
    treatmentSubgroupWeights,
    treatmentContextAdjustments,
    questionnaireEnums,
    hardStopRules,
    explanationTemplates,
    scoringConfig,
    displayGroupMetadata,
    appCopy,
    crisisSupportResources,
    providers,
    treatmentDurationBenchmarks,
    legalDocumentsUk,
  ] = await Promise.all(
    REQUIRED_FILES.map((fileName) => loadJson(fileName, fetcher)),
  );

  assertNonEmptyArray(treatmentsColumnYRaw, "treatments_column_y_raw.json");
  assertNonEmptyArray(treatmentRegistry, "treatment_registry.json");
  assertNonEmptyObject(treatmentBaseScores, "treatment_base_scores.json");
  assertNonEmptyObject(
    treatmentSubgroupWeights,
    "treatment_subgroup_weights.json",
  );
  assertNonEmptyObject(
    treatmentContextAdjustments,
    "treatment_context_adjustments.json",
  );
  assertNonEmptyObject(questionnaireEnums, "questionnaire_enums.json");
  assertNonEmptyObject(hardStopRules, "hard_stop_rules.json");
  assertNonEmptyObject(explanationTemplates, "explanation_templates.json");
  assertNonEmptyObject(scoringConfig, "scoring_config.json");
  assertNonEmptyObject(displayGroupMetadata, "display_group_metadata.json");
  assertNonEmptyObject(appCopy, "app_copy.json");
  assertNonEmptyObject(crisisSupportResources, "crisis_support_resources.json");
  assertNonEmptyArray(providers, "providers.json");
  assertNonEmptyArray(
    treatmentDurationBenchmarks,
    "treatment_duration_benchmarks.json",
  );
  assertNonEmptyArray(legalDocumentsUk, "legal_documents_uk.json");

  const rawLabels = new Set(treatmentsColumnYRaw as string[]);
  const registryEntries = treatmentRegistry as TreatmentRegistryEntry[];

  registryEntries.forEach(validateRegistryEntry);

  const registryRawLabels = new Set(
    registryEntries.map((entry) => entry.rawLabel),
  );
  if (
    rawLabels.size !== registryRawLabels.size ||
    [...rawLabels].some((label) => !registryRawLabels.has(label))
  ) {
    throw new Error(
      "treatment_registry.json must contain the full non-empty registry derived from treatments_column_y_raw.json",
    );
  }

  const displayGroupIds = new Set(
    registryEntries.map((entry) => entry.displayGroupId),
  );

  for (const [id, expectedName] of Object.entries(REQUIRED_DISPLAY_GROUPS)) {
    if (!displayGroupIds.has(id)) {
      throw new Error(
        `Missing required displayGroupId "${id}" in treatment_registry.json`,
      );
    }

    const metadataEntry = (
      displayGroupMetadata as Record<string, DisplayGroupMetadataEntry>
    )[id];
    validateMetadata(id, metadataEntry);

    if (metadataEntry.displayName !== expectedName) {
      throw new Error(
        `display_group_metadata.json entry "${id}" must use the exact display name "${expectedName}"`,
      );
    }
  }

  for (const displayGroupId of displayGroupIds) {
    if (!(displayGroupId in (treatmentBaseScores as Record<string, unknown>))) {
      throw new Error(
        `Missing treatment_base_scores.json entry for displayGroupId "${displayGroupId}"`,
      );
    }

    if (
      !(displayGroupId in (treatmentSubgroupWeights as Record<string, unknown>))
    ) {
      throw new Error(
        `Missing treatment_subgroup_weights.json entry for displayGroupId "${displayGroupId}"`,
      );
    }

    if (
      !(displayGroupId in (treatmentContextAdjustments as Record<string, unknown>))
    ) {
      throw new Error(
        `Missing treatment_context_adjustments.json entry for displayGroupId "${displayGroupId}"`,
      );
    }

    validateMetadata(
      displayGroupId,
      (displayGroupMetadata as Record<string, DisplayGroupMetadataEntry>)[
        displayGroupId
      ],
    );
  }

  return {
    treatmentsColumnYRaw: treatmentsColumnYRaw as string[],
    treatmentRegistry: registryEntries.map((entry) => ({
      ...entry,
      scoreKey: entry.displayGroupId,
    })),
    treatmentBaseScores: treatmentBaseScores as AppData["treatmentBaseScores"],
    treatmentSubgroupWeights:
      treatmentSubgroupWeights as AppData["treatmentSubgroupWeights"],
    treatmentContextAdjustments:
      treatmentContextAdjustments as AppData["treatmentContextAdjustments"],
    questionnaireEnums: questionnaireEnums as AppData["questionnaireEnums"],
    hardStopRules: hardStopRules as unknown as AppData["hardStopRules"],
    explanationTemplates:
      explanationTemplates as unknown as AppData["explanationTemplates"],
    scoringConfig: scoringConfig as unknown as AppData["scoringConfig"],
    displayGroupMetadata:
      displayGroupMetadata as AppData["displayGroupMetadata"],
    appCopy: appCopy as unknown as AppData["appCopy"],
    crisisSupportResources:
      crisisSupportResources as unknown as AppData["crisisSupportResources"],
    providers: providers as AppData["providers"],
    treatmentDurationBenchmarks:
      treatmentDurationBenchmarks as AppData["treatmentDurationBenchmarks"],
    legalDocumentsUk: legalDocumentsUk as AppData["legalDocumentsUk"],
  };
}
