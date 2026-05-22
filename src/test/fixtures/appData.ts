import appCopy from "../../../public/data/app_copy.json";
import crisisSupportResources from "../../../public/data/crisis_support_resources.json";
import displayGroupMetadata from "../../../public/data/display_group_metadata.json";
import explanationTemplates from "../../../public/data/explanation_templates.json";
import hardStopRules from "../../../public/data/hard_stop_rules.json";
import legalDocumentsUk from "../../../public/data/legal_documents_uk.json";
import providers from "../../../public/data/providers.json";
import questionnaireEnums from "../../../public/data/questionnaire_enums.json";
import scoringConfig from "../../../public/data/scoring_config.json";
import treatmentDurationBenchmarks from "../../../public/data/treatment_duration_benchmarks.json";
import treatmentBaseScores from "../../../public/data/treatment_base_scores.json";
import treatmentContextAdjustments from "../../../public/data/treatment_context_adjustments.json";
import treatmentRegistry from "../../../public/data/treatment_registry.json";
import treatmentSubgroupWeights from "../../../public/data/treatment_subgroup_weights.json";
import treatmentsColumnYRaw from "../../../public/data/treatments_column_y_raw.json";
import type { AppData } from "../../types";

export const baseAppData: AppData = {
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
} as AppData;

export function makeAppData(): AppData {
  return structuredClone(baseAppData);
}
