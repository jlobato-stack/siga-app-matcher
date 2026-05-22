import { type FormEvent, useEffect, useMemo, useState } from "react";
import { getMatchResult } from "./engine/scoring";
import { getVisibleQuestions, QUESTION_DEFINITIONS } from "./questionnaire";
import { clearDraft, loadDraft, saveDraft } from "./storage";
import {
  DISPLAY_GROUP_FAMILY_FALLBACK,
  DISPLAY_GROUP_PRIMARY_RAW_LABEL,
  TREATMENT_DETAILS_BY_RAW_LABEL,
} from "./treatmentDetails";
import { trackUsageEvent } from "./usageTracking";
import type {
  AppData,
  CrisisProfessionalCareOption,
  CrisisSupportResourceLink,
  LegalDocument,
  MatcherResult,
  PersistedDraft,
  ProviderDeliveryCategory,
  ProviderFormat,
  ProviderRecord,
  QuestionDefinition,
  QuestionnaireAnswers,
  RankedTreatmentMatch,
  TreatmentDurationBenchmark,
  TreatmentRegistryEntry,
} from "./types";

type Screen =
  | "home"
  | "questionnaire"
  | "diagnostic_signpost"
  | "results"
  | "budget"
  | "about"
  | "legal"
  | "crisis";

type AuthProvider = "email";
type AuthMode = "sign_in" | "sign_up";

interface AuthProfile {
  email: string;
  preferredName: string;
  authProvider: AuthProvider;
  emailVerified: boolean;
  age: number;
  signedInAt: string;
}

interface LocalAccountRecord {
  email: string;
  preferredName: string;
  age: number;
  legalAgreements: Record<string, string>;
  createdAt: string;
}

const MATCH_SCORE_EXPLANATION =
  "The app works out a score from your answers. It adds points when your answers fit a treatment well, and removes points where the evidence is weaker. Highest means one of the strongest fits in this app. Low means a weaker fit. This is not a diagnosis and it does not guarantee the treatment will work for you.";

const CONTACT_SPECIALIST_PATH = "/contact-specialist-now";
const BUDGET_PATH = "/plan-your-budget";
const ABOUT_PATH = "/about";
const SIGN_IN_PATH = "/sign-in";
const SIGN_UP_PATH = "/sign-up";
const HOME_PATH = "/";
const AUTH_PROFILE_STORAGE_KEY =
  "depression-treatment-matcher-auth-profile";
const LOCAL_ACCOUNTS_STORAGE_KEY =
  "depression-treatment-matcher-local-accounts";
const DEMO_ACCOUNT_EMAIL = "demo@siga.local";
const DEMO_ACCOUNT_NAME = "Investor Demo";
const BLOCKED_EMAILS_STORAGE_KEY =
  "depression-treatment-matcher-under-18-email-blocks";
const LEGAL_AGREEMENT_STORAGE_KEY =
  "depression-treatment-matcher-uk-legal-agreements";
const LEGAL_PATHS = new Set([
  "/privacy-policy-uk",
  "/terms-of-service-uk",
  "/disclaimer-uk",
]);

const DIAGNOSTIC_SIGNPOST = {
  title: "Find out which type of depression you have",
  disclaimer:
    "Medical Disclaimer: These online tools are intended for screening purposes only and do not constitute a clinical diagnosis. If you are experiencing a mental health crisis, please reach out to a professional immediately. If you are in the US, you can dial or text 988 for the Suicide & Crisis Lifeline.",
  selfAssessmentTools: [
    {
      id: "online-depression-test",
      name: "Online Depression Test",
      audience: "Adults",
      type: "Online Self-Assessments",
      description:
        "Free online depression screening based on the PHQ-9 format.",
      url: "https://screening.mhanational.org/screening-tools/depression/",
      source: "Mental Health America",
    },
    {
      id: "online-postpartum-depression-test",
      name: "Online Postpartum Depression Test",
      audience: "Pregnancy / Postpartum",
      type: "Online Self-Assessments",
      description:
        "Free online screening for new and expecting parents with postpartum or perinatal depression symptoms.",
      url: "https://screening.mhanational.org/screening-tools/postpartum-depression/",
      source: "Mental Health America",
    },
    {
      id: "online-youth-mental-health-test",
      name: "Online Youth Mental Health Test",
      audience: "Ages 11 to 17",
      type: "Online Self-Assessments",
      description:
        "Free online youth screening. It is broader than depression only, but includes mood-related symptoms relevant to depression.",
      url: "https://screening.mhanational.org/screening-tools/youth/",
      source: "Mental Health America",
    },
  ],
  professionalSupport: [
    {
      id: "find-psychiatrist",
      name: "Find a Psychiatrist",
      url: "https://finder.psychiatry.org/s/",
      source: "American Psychiatric Association",
    },
    {
      id: "find-psychologist",
      name: "Find a Psychologist",
      url: "https://locator.apa.org/",
      source: "American Psychological Association",
    },
  ],
} as const;

const ONLINE_DEPRESSION_TEST = DIAGNOSTIC_SIGNPOST.selfAssessmentTools.find(
  (tool) => tool.id === "online-depression-test",
);

function renderCautionItem(item: string) {
  const unconfirmedDiagnosisCaution =
    "Confidence is lower because depression has not been clinically confirmed.";

  if (item !== unconfirmedDiagnosisCaution || !ONLINE_DEPRESSION_TEST) {
    return item;
  }

  return (
    <>
      {item}{" "}
      <span>
        (Use this{" "}
        <a
          className="inline-link"
          href={ONLINE_DEPRESSION_TEST.url}
          target="_blank"
          rel="noreferrer"
        >
          LINK
        </a>{" "}
        for diagnosing your condition)
      </span>
    </>
  );
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function loadAuthProfile(storage: Storage | null): AuthProfile | null {
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(AUTH_PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthProfile>;
    if (
      parsed.email &&
      parsed.preferredName &&
      parsed.emailVerified &&
      typeof parsed.age === "number" &&
      parsed.age >= 18
    ) {
      return parsed as AuthProfile;
    }
  } catch {
    storage.removeItem(AUTH_PROFILE_STORAGE_KEY);
  }

  return null;
}

function saveAuthProfile(
  storage: Storage | null,
  authProfile: AuthProfile,
): void {
  if (storage) {
    storage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(authProfile));
  }
}

function clearAuthProfile(storage: Storage | null): void {
  if (storage) {
    storage.removeItem(AUTH_PROFILE_STORAGE_KEY);
  }
}

function loadLocalAccounts(storage: Storage | null): Record<string, LocalAccountRecord> {
  if (!storage) {
    return {};
  }

  const raw = storage.getItem(LOCAL_ACCOUNTS_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, LocalAccountRecord>)
      : {};
  } catch {
    storage.removeItem(LOCAL_ACCOUNTS_STORAGE_KEY);
    return {};
  }
}

function saveLocalAccounts(
  storage: Storage | null,
  accounts: Record<string, LocalAccountRecord>,
): void {
  if (storage) {
    storage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  }
}

function loadBlockedEmails(storage: Storage | null): Record<string, string> {
  if (!storage) {
    return {};
  }

  const raw = storage.getItem(BLOCKED_EMAILS_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    storage.removeItem(BLOCKED_EMAILS_STORAGE_KEY);
    return {};
  }
}

function saveBlockedEmails(
  storage: Storage | null,
  blockedEmails: Record<string, string>,
): void {
  if (storage) {
    storage.setItem(BLOCKED_EMAILS_STORAGE_KEY, JSON.stringify(blockedEmails));
  }
}

function clearBlockedEmails(storage: Storage | null): void {
  if (storage) {
    storage.removeItem(BLOCKED_EMAILS_STORAGE_KEY);
  }
}

function getAuthModeForPath(path: string): AuthMode | null {
  if (path === SIGN_IN_PATH) {
    return "sign_in";
  }

  if (path === SIGN_UP_PATH) {
    return "sign_up";
  }

  return null;
}

function loadLegalAgreements(storage: Storage | null): Record<string, string> {
  if (!storage) {
    return {};
  }

  const raw = storage.getItem(LEGAL_AGREEMENT_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    storage.removeItem(LEGAL_AGREEMENT_STORAGE_KEY);
    return {};
  }
}

function saveLegalAgreements(
  storage: Storage | null,
  agreements: Record<string, string>,
): void {
  if (storage) {
    storage.setItem(LEGAL_AGREEMENT_STORAGE_KEY, JSON.stringify(agreements));
  }
}

function getCurrentPath(): string {
  if (typeof window === "undefined") {
    return HOME_PATH;
  }

  return window.location.pathname || HOME_PATH;
}

function getScreenForPath(path: string): Screen {
  if (path === CONTACT_SPECIALIST_PATH) {
    return "crisis";
  }

  if (path === BUDGET_PATH) {
    return "budget";
  }

  if (path === ABOUT_PATH) {
    return "about";
  }

  if (LEGAL_PATHS.has(path)) {
    return "legal";
  }

  return "home";
}

function getLegalDocumentForPath(
  appData: AppData,
  path: string,
): LegalDocument | null {
  return appData.legalDocumentsUk.find((document) => document.path === path) ?? null;
}

function pushPath(path: string): void {
  if (typeof window !== "undefined" && window.location.pathname !== path) {
    window.history.pushState({}, "", path);
  }
}

function replacePath(path: string): void {
  if (typeof window !== "undefined" && window.location.pathname !== path) {
    window.history.replaceState({}, "", path);
  }
}

function getPathForScreen(screen: Screen): string {
  if (screen === "crisis") {
    return CONTACT_SPECIALIST_PATH;
  }

  if (screen === "budget") {
    return BUDGET_PATH;
  }

  if (screen === "about") {
    return ABOUT_PATH;
  }

  return HOME_PATH;
}

function inferCountryCode(): string | null {
  const locale = navigator.language.toLowerCase();

  if (locale.startsWith("en-us")) {
    return "US";
  }

  if (locale.startsWith("en-gb")) {
    return "UK";
  }

  if (locale.startsWith("en-ie")) {
    return "IE";
  }

  return null;
}

function getFirstIncompleteQuestionIndex(
  answers: QuestionnaireAnswers,
  visibleQuestions: QuestionDefinition[],
): number {
  const nextIndex = visibleQuestions.findIndex(
    (question) => answers[question.id] === undefined,
  );

  return nextIndex >= 0 ? nextIndex : Math.max(visibleQuestions.length - 1, 0);
}

function copyAnswersWithoutSkippedFields(
  answers: QuestionnaireAnswers,
): QuestionnaireAnswers {
  const nextAnswers = { ...answers };

  if (!["yes", "not_sure"].includes(String(nextAnswers.q1_diagnosed_depression))) {
    delete nextAnswers.q10_diagnosis_type;
  }

  return nextAnswers;
}

function CrisisSupportCard({
  item,
}: {
  item: CrisisSupportResourceLink;
}) {
  return (
    <article className="resource-card resource-card-support">
      <p className="eyebrow">Immediate help</p>
      <h3>{item.label}</h3>
      <p className="resource-meta">
        {item.cost} | {item.availability}
      </p>
      <ul className="resource-list">
        {item.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <a
        className="button button-primary resource-action"
        href={item.url}
        target="_blank"
        rel="noreferrer"
      >
        Open support option
      </a>
    </article>
  );
}

function ProfessionalCareCard({
  item,
}: {
  item: CrisisProfessionalCareOption;
}) {
  return (
    <article className="resource-card">
      <p className="eyebrow">{item.kind.replaceAll("_", " ")}</p>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <p className="resource-meta">
        {item.cost} | {item.availability}
      </p>
    </article>
  );
}

type ProviderSummary = {
  id: string;
  providerName: string;
  providerType: ProviderRecord["providerType"];
  url: string;
  countries: string[];
  formats: ProviderFormat[];
  deliveryCategory: ProviderDeliveryCategory;
  highestMatchLevel: 1 | 2 | 3;
  matchedTo: string[];
  supportedTreatments: string[];
  notes?: string;
};

type ProviderGroup = {
  category: ProviderDeliveryCategory;
  heading: string;
  providers: ProviderSummary[];
};

const PROVIDER_GROUP_ORDER: ProviderDeliveryCategory[] = [
  "in-person",
  "online",
  "web-based",
  "ai",
];

const PROVIDER_GROUP_LABELS: Record<ProviderDeliveryCategory, string> = {
  "in-person": "In-person treatments",
  online: "Online treatments",
  "web-based": "Web-based treatments",
  ai: "AI treatments",
};

const AI_PROVIDER_NAMES = new Set([
  "Headspace with Ebb",
  "Woebot Health",
  "Wysa",
  "Youper",
]);

function formatProviderType(providerType: ProviderRecord["providerType"]) {
  return providerType.replaceAll("-", " ");
}

function formatProviderFormats(formats: ProviderFormat[]) {
  return formats.join(", ");
}

function getProviderDeliveryCategory(
  provider: ProviderRecord,
): ProviderDeliveryCategory {
  if (provider.deliveryCategory) {
    return provider.deliveryCategory;
  }

  if (AI_PROVIDER_NAMES.has(provider.providerName)) {
    return "ai";
  }

  if (provider.formats.includes("in-person")) {
    return "in-person";
  }

  if (
    provider.providerType === "platform" ||
    provider.providerType === "program"
  ) {
    return "web-based";
  }

  if (
    provider.formats.includes("online") ||
    provider.formats.includes("telephone") ||
    provider.formats.includes("hybrid")
  ) {
    return "online";
  }

  return "in-person";
}

function getProviderMatchLabel(matchLevel: 1 | 2 | 3) {
  if (matchLevel === 3) {
    return "Best Treatment Match";
  }

  if (matchLevel === 2) {
    return "Excellent Treatment Match";
  }

  return "Good Treatment Match";
}

function getProviderMatchExplanation(matchLevel: 1 | 2 | 3) {
  if (matchLevel === 3) {
    return "This provider supports the exact treatment shown here.";
  }

  if (matchLevel === 2) {
    return "This provider matches the same treatment subfamily, but not the exact lowest-level treatment label.";
  }

  return "This provider matches the broader treatment family rather than the specific treatment subtype.";
}

function getMatchLevelLabel(score: number) {
  if (score >= 90) {
    return "Highest Match Level";
  }

  if (score >= 80) {
    return "Very High Match Level";
  }

  if (score >= 60) {
    return "High Match Level";
  }

  if (score >= 40) {
    return "Moderate Match Level";
  }

  return "Low Match Level";
}

function getProviderSummaries(
  appData: AppData,
  treatmentId: string,
): ProviderSummary[] {
  const rawLabels = new Set(
    appData.treatmentRegistry
      .filter((entry) => entry.displayGroupId === treatmentId)
      .map((entry) => entry.rawLabel),
  );

  const matches = appData.providers.filter((provider) => rawLabels.has(provider.level3));
  const grouped = new Map<string, ProviderSummary>();

  matches.forEach((provider) => {
    const key = provider.providerName;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        id: provider.id,
        providerName: provider.providerName,
        providerType: provider.providerType,
        url: provider.url,
        countries: [...provider.countries],
        formats: [...provider.formats],
        deliveryCategory: getProviderDeliveryCategory(provider),
        highestMatchLevel: provider.matchLevel,
        matchedTo: [provider.matchedTo],
        supportedTreatments: [provider.level3],
        notes: provider.notes,
      });
      return;
    }

    const nextHighestMatchLevel = Math.max(
      existing.highestMatchLevel,
      provider.matchLevel,
    ) as 1 | 2 | 3;
    if (provider.matchLevel > existing.highestMatchLevel) {
      existing.url = provider.url;
    }
    existing.highestMatchLevel = nextHighestMatchLevel;
    existing.deliveryCategory =
      PROVIDER_GROUP_ORDER.indexOf(getProviderDeliveryCategory(provider)) <
      PROVIDER_GROUP_ORDER.indexOf(existing.deliveryCategory)
        ? getProviderDeliveryCategory(provider)
        : existing.deliveryCategory;
    existing.matchedTo = [...new Set([...existing.matchedTo, provider.matchedTo])];
    existing.supportedTreatments = [
      ...new Set([...existing.supportedTreatments, provider.level3]),
    ];
    existing.countries = [...new Set([...existing.countries, ...provider.countries])];
    existing.formats = [...new Set([...existing.formats, ...provider.formats])];
    if (!existing.notes && provider.notes) {
      existing.notes = provider.notes;
    }
  });

  return [...grouped.values()].sort((left, right) => {
    if (right.highestMatchLevel !== left.highestMatchLevel) {
      return right.highestMatchLevel - left.highestMatchLevel;
    }

    return left.providerName.localeCompare(right.providerName);
  });
}

function getProviderGroups(providers: ProviderSummary[]): ProviderGroup[] {
  const grouped = new Map<ProviderDeliveryCategory, ProviderSummary[]>();

  providers.forEach((provider) => {
    const existing = grouped.get(provider.deliveryCategory) ?? [];
    existing.push(provider);
    grouped.set(provider.deliveryCategory, existing);
  });

  return PROVIDER_GROUP_ORDER.flatMap((category) => {
    const groupProviders = grouped.get(category);

    if (!groupProviders || groupProviders.length === 0) {
      return [];
    }

    return [
      {
        category,
        heading: PROVIDER_GROUP_LABELS[category],
        providers: groupProviders,
      },
    ];
  });
}

function getRawTreatmentEntries(
  appData: AppData,
  treatmentId: string,
): TreatmentRegistryEntry[] {
  return appData.treatmentRegistry.filter(
    (entry) => entry.displayGroupId === treatmentId,
  );
}

function getExactTreatmentDetail(
  appData: AppData,
  treatmentId: string,
) {
  const exactRawLabel = DISPLAY_GROUP_PRIMARY_RAW_LABEL[treatmentId];

  if (exactRawLabel) {
    const exactDetails = TREATMENT_DETAILS_BY_RAW_LABEL[exactRawLabel];
    if (exactDetails) {
      return {
        rawLabel: exactRawLabel,
        details: exactDetails,
      };
    }
  }

  const familyFallback = DISPLAY_GROUP_FAMILY_FALLBACK[treatmentId];
  if (familyFallback) {
    const familyDetails = TREATMENT_DETAILS_BY_RAW_LABEL[familyFallback.sourceRawLabel];
    if (familyDetails) {
      return {
        rawLabel: familyFallback.sourceRawLabel,
        details: {
          title: familyFallback.familyTitle,
          description: `${familyFallback.intro}\n\n${familyDetails.description}`,
          references: familyDetails.references,
        },
      };
    }
  }

  const entries = getRawTreatmentEntries(appData, treatmentId);
  if (entries.length === 1) {
    const onlyRawLabel = entries[0].rawLabel;
    const onlyDetails = TREATMENT_DETAILS_BY_RAW_LABEL[onlyRawLabel];
    if (onlyDetails) {
      return {
        rawLabel: onlyRawLabel,
        details: onlyDetails,
      };
    }
  }

  return null;
}

function getBudgetBenchmark(
  appData: AppData,
  treatmentId: string,
): TreatmentDurationBenchmark | null {
  const findBenchmark = (therapyType: string | undefined) =>
    therapyType
      ? appData.treatmentDurationBenchmarks.find(
          (benchmark) => benchmark.therapyType === therapyType,
        ) ?? null
      : null;

  const exactRawLabel = DISPLAY_GROUP_PRIMARY_RAW_LABEL[treatmentId];
  const exactBenchmark = findBenchmark(exactRawLabel);
  if (exactBenchmark) {
    return exactBenchmark;
  }

  const familyFallback = DISPLAY_GROUP_FAMILY_FALLBACK[treatmentId];
  const familyBenchmark = findBenchmark(familyFallback?.sourceRawLabel);
  if (familyBenchmark) {
    return familyBenchmark;
  }

  const entries = appData.treatmentRegistry.filter(
    (entry) => entry.displayGroupId === treatmentId,
  );
  if (entries.length === 1) {
    return findBenchmark(entries[0].rawLabel);
  }

  return null;
}

function MatchCard({
  appData,
  match,
}: {
  appData: AppData;
  match: RankedTreatmentMatch;
}) {
  const [showTreatmentDetails, setShowTreatmentDetails] = useState(false);
  const [showMatchLevelHelp, setShowMatchLevelHelp] = useState(false);
  const providers = useMemo(
    () => getProviderSummaries(appData, match.id),
    [appData, match.id],
  );
  const treatmentDetail = useMemo(
    () => getExactTreatmentDetail(appData, match.id),
    [appData, match.id],
  );
  const providerGroups = useMemo(
    () => getProviderGroups(providers),
    [providers],
  );
  const matchLevelLabel = getMatchLevelLabel(match.score);

  return (
    <article className="match-card">
      <div className="match-header">
        <div>
          <h3>{match.displayName}</h3>
          <p>{match.description}</p>
        </div>
        <span className="match-level-anchor">
          <button
            type="button"
            className="match-level-pill match-level-tooltip"
            data-tooltip={MATCH_SCORE_EXPLANATION}
            aria-label="What does this match level mean?"
            aria-expanded={showMatchLevelHelp}
            aria-haspopup="dialog"
            onClick={() => setShowMatchLevelHelp((value) => !value)}
          >
            {matchLevelLabel}
          </button>
          {showMatchLevelHelp ? (
            <div className="match-level-panel" role="dialog" aria-label="Match level explanation">
              {MATCH_SCORE_EXPLANATION}
            </div>
          ) : null}
        </span>
      </div>
      <div className="list-block">
        <h4>Why it matched</h4>
        <ul>
          {match.explanation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="list-block">
        <h4>Cautions</h4>
        <ul>
          {match.cautions.map((item) => (
            <li key={item}>{renderCautionItem(item)}</li>
          ))}
        </ul>
      </div>
      {treatmentDetail ? (
        <div className="list-block treatment-detail-block">
          <button
            type="button"
            className="button button-secondary details-toggle"
            aria-expanded={showTreatmentDetails}
            aria-controls={`treatment-details-${match.id}`}
            onClick={() => setShowTreatmentDetails((value) => !value)}
          >
            {showTreatmentDetails
              ? "Hide treatment details"
              : "Find out more about the treatment"}
          </button>
          {showTreatmentDetails ? (
            <div
              className="treatment-details-panel"
              id={`treatment-details-${match.id}`}
            >
              <article className="treatment-detail-card">
                <h4>{treatmentDetail.details.title}</h4>
                <p className="treatment-detail-copy">
                  {treatmentDetail.details.description}
                </p>
                {treatmentDetail.details.references.length > 0 ? (
                  <ul className="treatment-link-list">
                    {treatmentDetail.details.references.map((reference) => (
                      <li key={`${treatmentDetail.rawLabel}-${reference.url}`}>
                        <a
                          className="inline-link"
                          href={reference.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {reference.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            </div>
          ) : null}
        </div>
      ) : null}
      {providers.length > 0 ? (
        <div className="list-block provider-block">
          <h4>Providers</h4>
          <div className="provider-group-stack">
            {providerGroups.map((group) => (
              <section className="provider-group" key={group.category}>
                <h5 className="provider-group-heading">{group.heading}</h5>
                <div className="provider-list">
                  {group.providers.map((provider) => (
                    <article className="provider-card" key={provider.id}>
                      <div className="provider-card-header">
                        <a
                          className="provider-link"
                          href={provider.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {provider.providerName}
                        </a>
                        <span
                          className="provider-badge provider-badge-tooltip"
                          data-tooltip={getProviderMatchExplanation(
                            provider.highestMatchLevel,
                          )}
                          title={getProviderMatchExplanation(
                            provider.highestMatchLevel,
                          )}
                          aria-label={`${getProviderMatchLabel(provider.highestMatchLevel)}. ${getProviderMatchExplanation(provider.highestMatchLevel)}`}
                          tabIndex={0}
                        >
                          {getProviderMatchLabel(provider.highestMatchLevel)}
                        </span>
                      </div>
                      <p className="provider-meta">
                        {formatProviderType(provider.providerType)} |{" "}
                        {provider.countries.join(", ")}
                      </p>
                      <p className="provider-meta">
                        Formats: {formatProviderFormats(provider.formats)}
                      </p>
                      <p className="provider-meta">
                        Supports: {provider.supportedTreatments.join("; ")}
                      </p>
                      {provider.notes ? (
                        <p className="provider-notes">{provider.notes}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function DiagnosticSignpostView({
  onBack,
  onRestart,
  onContinue,
  onExit,
}: {
  onBack: () => void;
  onRestart: () => void;
  onContinue: () => void;
  onExit: () => void;
}) {
  return (
    <main className="app-shell diagnostic-shell">
      <div className="diagnostic-stage">
        <header className="utility-bar">
          <button
            type="button"
            className="utility-button utility-button-back"
            onClick={onBack}
          >
            Back
          </button>
          <div className="utility-actions">
            <button
              type="button"
              className="utility-button"
              onClick={onRestart}
            >
              Restart
            </button>
            <button
              type="button"
              className="utility-button"
              onClick={onExit}
            >
              Exit
            </button>
          </div>
        </header>

        <section className="diagnostic-panel">
          <h1 className="diagnostic-title">{DIAGNOSTIC_SIGNPOST.title}</h1>

          <div className="diagnostic-section">
            <h2 className="diagnostic-section-heading">Online Self-Assessments</h2>
            <div className="diagnostic-card-list">
              {DIAGNOSTIC_SIGNPOST.selfAssessmentTools.map((tool) => (
                <article className="diagnostic-tool-card" key={tool.id}>
                  <div className="diagnostic-tool-main">
                    <div className="diagnostic-tool-title-row">
                      <h3>{tool.name}</h3>
                      <span className="audience-pill">{tool.audience}</span>
                    </div>
                    <p>{tool.description}</p>
                    <p className="diagnostic-source">Source: {tool.source}</p>
                  </div>
                  <a
                    className="diagnostic-open-link"
                    href={tool.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="diagnostic-section">
            <h2 className="diagnostic-section-heading">Find a Professional</h2>
            <div className="diagnostic-professional-grid">
              {DIAGNOSTIC_SIGNPOST.professionalSupport.map((resource) => (
                <article className="diagnostic-professional-card" key={resource.id}>
                  <h3>{resource.name}</h3>
                  <p className="diagnostic-source">Source: {resource.source}</p>
                  <a
                    className="diagnostic-open-link diagnostic-open-link-inline"
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="diagnostic-disclaimer">
            <p>{DIAGNOSTIC_SIGNPOST.disclaimer}</p>
          </div>

          <footer className="diagnostic-footer">
            <button
              type="button"
              className="button button-secondary diagnostic-footer-button"
              onClick={onContinue}
            >
              SKIP
            </button>
            <button
              type="button"
              className="button button-primary diagnostic-footer-button"
              onClick={onContinue}
            >
              Continue
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}

function BudgetPlanningView({
  appData,
  matches,
  onBack,
  onRestart,
}: {
  appData: AppData;
  matches: RankedTreatmentMatch[];
  onBack: () => void;
  onRestart: () => void;
}) {
  return (
    <main className="app-shell">
      <section className="frame-card">
        <header className="question-header budget-header">
          <div>
            <p className="eyebrow">Budget planning</p>
            <h1>Plan your budget</h1>
            <p className="hero-copy">
              Use this page to estimate the time each treatment may take. This
              first version focuses on time, not money.
            </p>
          </div>
          <div className="toolbar">
            <button
              type="button"
              className="button button-secondary"
              onClick={onBack}
            >
              Back to results
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={onRestart}
            >
              Restart
            </button>
          </div>
        </header>

        <div className="budget-grid">
          {matches.map((match) => {
            const benchmark = getBudgetBenchmark(appData, match.id);

            return (
              <article className="budget-card" key={match.id}>
                <div className="budget-card-header">
                  <h2>{match.displayName}</h2>
                  <span className="match-level-pill budget-match-pill">
                    {getMatchLevelLabel(match.score)}
                  </span>
                </div>

                {benchmark ? (
                  <div className="budget-detail-list">
                    <p>
                      <strong>Target duration:</strong>{" "}
                      {benchmark.targetClinicalDurationWeeks}
                    </p>
                    <p>
                      <strong>Hours per week:</strong> {benchmark.hoursPerWeek}
                    </p>
                    <p>
                      <strong>Total estimated hours:</strong>{" "}
                      {benchmark.totalEstimatedHours}
                    </p>
                    <p>
                      <strong>Clinical benchmark:</strong>{" "}
                      {benchmark.establishedClinicalBenchmark}
                    </p>
                    <p>
                      <strong>Reference:</strong>{" "}
                      {benchmark.referenceGuidelinesAndManuals}
                    </p>
                  </div>
                ) : (
                  <p className="budget-missing-copy">
                    We do not have a time-planning benchmark for this treatment
                    yet.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function AboutView({
  appData,
  onBack,
}: {
  appData: AppData;
  onBack: () => void;
}) {
  return (
    <main className="app-shell">
      <section className="frame-card about-card">
        <header className="question-header legal-header">
          <div>
            <p className="eyebrow">ABOUT THIS APP</p>
            <h1>How the matcher works</h1>
            <p className="hero-copy">
              This page explains the method at a high level using the current
              question set, scoring rules, treatment families, explanation
              templates, and benchmark data already stored in the app.
            </p>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={onBack}
          >
            Back
          </button>
        </header>

        <div className="legal-document">
          <section className="legal-section">
            <h2>What the app is trying to do</h2>
            <p>
              The app is designed to help clinicians, patients, health
              insurers, and health systems identify treatments that may be more
              likely to work for each patient.
            </p>
            <p>
              The matcher compares a user&apos;s measured profile with the
              treatment families stored in the app. It then ranks the families
              that fit best and explains the match in plain English.
            </p>
            <p>The app currently groups treatments into these families:</p>
            <ul>
              <li>
                Cognitive Behavioral Therapy (CBT): A structured treatment
                focused on patterns of thought, emotion, and behavior.
              </li>
              <li>
                Health-Tailored CBT: CBT adapted for people managing depression
                alongside a long-term physical health condition.
              </li>
              <li>
                Behavioral Activation: A practical treatment focused on
                rebuilding routines, activity, and contact with rewarding
                experiences.
              </li>
              <li>
                Interpersonal Therapy (IPT): A treatment focused on
                relationships, role changes, conflict, grief, and loneliness.
              </li>
              <li>
                Mindfulness-Based / Relapse-Focused Therapy: A relapse-focused
                approach that helps people notice mood patterns and respond
                differently to them.
              </li>
              <li>
                Problem-Solving Therapy: A structured treatment focused on
                breaking problems into manageable steps and decisions.
              </li>
              <li>
                Supportive Therapy: A lower-intensity supportive approach
                focused on validation, guidance, and coping.
              </li>
              <li>
                Life Review Therapy: A reflective treatment often used with
                older adults to integrate memories, identity, and meaning.
              </li>
              <li>
                Psychodynamic Therapy: A treatment focused on recurring
                emotional patterns, relationships, and internal conflicts.
              </li>
              <li>
                Acceptance and Commitment Therapy (ACT): A therapy that combines
                values-based action with acceptance and psychological
                flexibility skills.
              </li>
              <li>
                Other Third-Wave Cognitive Therapies: Related skills-based
                cognitive therapies beyond CBT and ACT.
              </li>
              <li>
                Combined / Multi-Component Interventions: Programs that combine
                several psychological elements rather than one single treatment
                model.
              </li>
              <li>
                Psychoeducational or Guided Self-Help Variants: Lower-intensity
                structured materials or guided self-help based approaches.
              </li>
              <li>
                Other Psychological Treatments: Other psychological
                interventions that do not fit a single main display group.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>How the ranking is calculated</h2>
            <p>
              For each treatment family, the app starts with a base evidence
              score from the current scoring table.
            </p>
            <p>
              It then adds subgroup match points based on age group, perinatal
              stage, source group, long-term physical health condition,
              diagnosis status, and course over time.
            </p>
            <p>
              It also adds context points from the current help-style answer and
              the answer about what the depression seems most tied to.
            </p>
            <p>The context score is capped at 10 points in the current config.</p>
            <p>
              Finally, the app subtracts the fragility penalty stored for that
              treatment family.
            </p>
            <p className="about-formula">
              Match score formula: base evidence + subgroup match + context
              score - fragility penalty
            </p>
            <p>
              If the top scores are very close, the app can show more than one
              leading result. The current tie threshold is 3 points.
            </p>
          </section>

          <section className="legal-section">
            <h2>How cautions are handled</h2>
            <p>
              The app has separate caution rules for high suicidal ideation,
              possible mania, possible psychosis, unclear diagnosis, and many
              unknown answers.
            </p>
            <p>
              In the current scoring config, the internal confidence penalties
              are:
            </p>
            <ul>
              <li>Unconfirmed diagnosis: 10</li>
              <li>Unknown diagnosis: 7</li>
              <li>High suicidal ideation: 14</li>
              <li>Possible mania: 8</li>
              <li>Possible psychosis: 10</li>
              <li>Missing-answer penalty: 3 per unknown answer, capped at 15</li>
            </ul>
            <p>The current confidence bands stored in the app are:</p>
            <ul>
              <li>high: 75 and above</li>
              <li>moderate: 55 and above</li>
              <li>low: 0 and above</li>
            </ul>
            <p>
              The current results page hides the confidence number to avoid
              confusion (for example, a 90% match may mislead into believing
              they have 90% of chances of recovering), but the confidence system
              still exists in the method.
            </p>
          </section>

          <section className="legal-section">
            <h2>How the time planning page works (under work)</h2>
            <p>
              The budget page uses the stored treatment benchmark table. Each
              row includes a therapy type, target clinical duration, hours per
              week, total estimated hours, an established clinical benchmark, a
              reference, a decision field, and a rationale field.
            </p>
            <p>
              Example from the current table: Acceptance and commitment therapy
              has a target duration of 8 to 12 weeks, 1 hour per week, and 8 to
              12 hrs total estimated hours.
            </p>
          </section>

          <section className="legal-section">
            <h2>Important limits</h2>
            <p>{MATCH_SCORE_EXPLANATION}</p>
            <p>
              The hard-stop flow also takes priority. In the current app,
              certain answers route the user straight to the urgent support page
              instead of continuing with treatment matching.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

function SignInView({
  appTitle,
  blockedEmails,
  legalDocuments,
  legalAgreements,
  onAgreeToLegalDocument,
  onOpenAbout,
  onOpenLegalDocument,
  onUseDemoAccount,
  onSignIn,
  onSignUp,
}: {
  appTitle: string;
  blockedEmails: Record<string, string>;
  legalDocuments: LegalDocument[];
  legalAgreements: Record<string, string>;
  onAgreeToLegalDocument: (document: LegalDocument) => void;
  onOpenAbout: () => void;
  onOpenLegalDocument: (path: string) => void;
  onUseDemoAccount: () => void;
  onSignIn: (email: string, preferredName: string) => void;
  onSignUp: (details: {
    email: string;
    preferredName: string;
  }) => void;
}) {
  const [email, setEmail] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode | null>(() =>
    getAuthModeForPath(getCurrentPath()),
  );
  const [error, setError] = useState<string | null>(null);
  const modeLabel = authMode === "sign_up" ? "Sign up" : "Sign in";
  const hasAgreedToAllDocuments = legalDocuments.every(
    (document) => legalAgreements[document.id] === document.lastUpdated,
  );

  useEffect(() => {
    const handlePopState = () => {
      setAuthMode(getAuthModeForPath(getCurrentPath()));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleChooseAuthMode(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setError(null);
    pushPath(nextMode === "sign_in" ? SIGN_IN_PATH : SIGN_UP_PATH);
  }

  function resetErrors() {
    setError(null);
  }

  function handleSignInSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = preferredName.trim();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (!normalizedName) {
      setError("Enter your preferred name.");
      return;
    }

    if (blockedEmails[normalizedEmail]) {
      setError("This email cannot use the app until the account holder is 18.");
      return;
    }

    try {
      onSignIn(normalizedEmail, normalizedName);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Sign in failed.");
    }
  }

  function handleSignUpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = preferredName.trim();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (!normalizedName) {
      setError("Enter your preferred name.");
      return;
    }

    try {
      onSignUp({
        email: normalizedEmail,
        preferredName: normalizedName,
      });
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : "Sign up failed.");
    }
  }

  return (
    <main className="app-shell home-shell">
      <section className="frame-card auth-card">
        <div className="hero-brand-block auth-brand-block">
          <p className="siga-logo">{appTitle}</p>
        </div>
        <h1>
          {authMode ? `${modeLabel} to use SIGA Treatment Matcher` : "Choose a demo access option"}
        </h1>
        <p className="hero-copy auth-copy">
          Demo accounts stay on this device. Email verification is not required for this demo version.
        </p>

        {!authMode ? (
          <div className="auth-choice-actions" aria-label="Choose account action">
            <button
              type="button"
              className="button button-primary button-home-primary"
              onClick={() => handleChooseAuthMode("sign_in")}
            >
              Sign in
            </button>
            <button
              type="button"
              className="button button-secondary auth-choice-secondary"
              onClick={() => handleChooseAuthMode("sign_up")}
            >
              Sign up
            </button>
            <button
              type="button"
              className="button button-secondary auth-choice-secondary"
              onClick={onUseDemoAccount}
            >
              Open demo account
            </button>
          </div>
        ) : (
          <>
            <form
              className="auth-form"
              onSubmit={authMode === "sign_in" ? handleSignInSubmit : handleSignUpSubmit}
            >
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    resetErrors();
                  }}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                <span>Preferred name</span>
                <input
                  type="text"
                  value={preferredName}
                  onChange={(event) => {
                    setPreferredName(event.target.value);
                    resetErrors();
                  }}
                  autoComplete="given-name"
                  required
                />
              </label>

              <button type="submit" className="button button-primary">
                {authMode === "sign_in" ? "Continue" : "Create account"}
              </button>
            </form>

            <button
              type="button"
              className="legal-link-button auth-switch-button"
              onClick={() =>
                handleChooseAuthMode(
                  authMode === "sign_in" ? "sign_up" : "sign_in",
                )
              }
            >
              {authMode === "sign_in"
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </>
        )}

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <div className="auth-legal-links">
          <button
            type="button"
            className="legal-link-button"
            onClick={onOpenAbout}
          >
            About
          </button>
          <button
            type="button"
            className="legal-link-button"
            onClick={() => onOpenLegalDocument("/privacy-policy-uk")}
          >
            Privacy policy
          </button>
          <button
            type="button"
            className="legal-link-button"
            onClick={() => onOpenLegalDocument("/terms-of-service-uk")}
          >
            Terms of service
          </button>
          <button
            type="button"
            className="legal-link-button"
            onClick={() => onOpenLegalDocument("/disclaimer-uk")}
          >
            Disclaimer
          </button>
        </div>
      </section>
    </main>
  );
}

function LegalLinks({
  documents,
  onOpen,
}: {
  documents: LegalDocument[];
  onOpen: (path: string) => void;
}) {
  return (
    <nav className="legal-links" aria-label="Legal documents for UK users">
      {documents.map((document) => (
        <button
          type="button"
          className="legal-link-button"
          key={document.id}
          onClick={() => onOpen(document.path)}
        >
          {document.shortTitle}
        </button>
      ))}
    </nav>
  );
}

function LegalAgreementPanel({
  documents,
  agreements,
  onAgree,
  onOpen,
}: {
  documents: LegalDocument[];
  agreements: Record<string, string>;
  onAgree: (document: LegalDocument) => void;
  onOpen: (path: string) => void;
}) {
  return (
    <section className="legal-agreement-panel" aria-label="Required agreements">
      <p className="legal-agreement-title">Before using the matcher</p>
      <p className="legal-agreement-copy">
        Please read and agree to these UK documents. You can use the app after
        all three are marked agreed. Click an agreed item again to revoke it.
      </p>
      <div className="legal-agreement-list">
        {documents.map((document) => {
          const isAgreed = agreements[document.id] === document.lastUpdated;

          return (
            <div className="legal-agreement-row" key={document.id}>
              <div>
                <strong>{document.shortTitle}</strong>
                <span>{isAgreed ? "Agreed" : "Not agreed yet"}</span>
              </div>
              <div className="legal-agreement-actions">
                <button
                  type="button"
                  className="button button-secondary legal-read-button"
                  onClick={() => onOpen(document.path)}
                >
                  Read
                </button>
                <button
                  type="button"
                  className={
                    isAgreed
                      ? "button legal-agree-button legal-agree-button-active"
                      : "button legal-agree-button"
                  }
                  onClick={() => onAgree(document)}
                  aria-pressed={isAgreed}
                  aria-label={
                    isAgreed
                      ? `Agreed for ${document.shortTitle}. Click to revoke.`
                      : `Agree to ${document.shortTitle}`
                  }
                >
                  {isAgreed ? "Agreed" : "I agree"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LegalDocumentView({
  document,
  documents,
  isAgreed,
  onBack,
  onExit,
  onAgree,
  onOpen,
}: {
  document: LegalDocument;
  documents: LegalDocument[];
  isAgreed: boolean;
  onBack: () => void;
  onExit: () => void;
  onAgree: (document: LegalDocument) => void;
  onOpen: (path: string) => void;
}) {
  return (
    <main className="app-shell">
      <section className="frame-card legal-card">
        <header className="question-header legal-header">
          <div>
            <p className="eyebrow">UK legal information</p>
            <h1>{document.title}</h1>
            <p className="hero-copy">{document.summary}</p>
            <p className="legal-updated">Last updated: {document.lastUpdated}</p>
          </div>
          <div className="legal-header-actions">
            <button
              type="button"
              className={
                isAgreed
                  ? "button legal-agree-button legal-agree-button-active"
                  : "button legal-agree-button"
              }
              onClick={() => onAgree(document)}
              aria-pressed={isAgreed}
              aria-label={
                isAgreed
                  ? `Agreed for ${document.shortTitle}. Click to revoke.`
                  : `Agree to ${document.shortTitle}`
              }
            >
              {isAgreed ? "Agreed" : "I agree"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={onBack}
            >
              Back
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={onExit}
            >
              Exit
            </button>
          </div>
        </header>

        <div className="legal-document">
          {document.sections.map((section) => (
            <section className="legal-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}

          <section className="legal-section legal-sources">
            <h2>Guidance used</h2>
            <ul>
              {document.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <LegalLinks documents={documents} onOpen={onOpen} />
      </section>
    </main>
  );
}

function QuestionView({
  appData,
  currentQuestion,
  currentIndex,
  totalQuestions,
  currentValue,
  onAnswer,
  onBack,
  onExit,
  onSaveAndReturn,
  showBack,
}: {
  appData: AppData;
  currentQuestion: QuestionDefinition;
  currentIndex: number;
  totalQuestions: number;
  currentValue: QuestionnaireAnswers[keyof QuestionnaireAnswers];
  onAnswer: (value: string | number) => void;
  onBack: () => void;
  onExit: () => void;
  onSaveAndReturn: () => void;
  showBack: boolean;
}) {
  return (
    <main className="app-shell">
      <section className="frame-card">
        <header className="question-header">
          <div>
            <p className="eyebrow">
              Question {currentIndex + 1} of {totalQuestions}
            </p>
            <div
              className="progress-track"
              aria-hidden="true"
              role="presentation"
            >
              <div
                className="progress-fill"
                style={{
                  width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="toolbar">
            <button
              type="button"
              className="button button-secondary"
              onClick={onSaveAndReturn}
            >
              {appData.appCopy.saveAndReturnLabel}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={onExit}
            >
              {appData.appCopy.exitButtonLabel}
            </button>
          </div>
        </header>

        <fieldset className="question-fieldset">
          <legend>{currentQuestion.title}</legend>
          <div className="answer-grid">
            {currentQuestion.options.map((option) => {
              const checked = currentValue === option.value;

              return (
                <label className="answer-card" key={option.key}>
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    checked={checked}
                    onChange={() => onAnswer(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <footer className="question-footer">
          {showBack ? (
            <button
              type="button"
              className="button button-secondary"
              onClick={onBack}
            >
              {appData.appCopy.backButtonLabel}
            </button>
          ) : (
            <div />
          )}
        </footer>
      </section>
    </main>
  );
}

export function MatcherApp({
  appData,
  storage = getStorage(),
}: {
  appData: AppData;
  storage?: Storage | null;
}) {
  const [draftSnapshot, setDraftSnapshot] = useState<PersistedDraft | null>(
    () => (storage ? loadDraft(storage) : null),
  );
  const [screen, setScreen] = useState<Screen>(() =>
    getScreenForPath(getCurrentPath()),
  );
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(
    draftSnapshot?.answers ?? {},
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<MatcherResult | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(() =>
    loadAuthProfile(storage),
  );
  const [localAccounts, setLocalAccounts] = useState<Record<string, LocalAccountRecord>>(
    () => loadLocalAccounts(storage),
  );
  const [blockedEmails, setBlockedEmails] = useState<Record<string, string>>(
    () => loadBlockedEmails(storage),
  );
  const [legalAgreements, setLegalAgreements] = useState<Record<string, string>>({});
  const [returnScreenAfterAbout, setReturnScreenAfterAbout] =
    useState<Screen>("home");
  const [returnScreenAfterLegal, setReturnScreenAfterLegal] =
    useState<Screen>("home");
  const [currentLegalPath, setCurrentLegalPath] = useState<string>(() =>
    LEGAL_PATHS.has(getCurrentPath()) ? getCurrentPath() : "/privacy-policy-uk",
  );
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(
    inferCountryCode(),
  );

  const visibleQuestions = useMemo(
    () => getVisibleQuestions(answers),
    [answers],
  );
  const hasAcceptedLegalDocuments = appData.legalDocumentsUk.every(
    (document) => legalAgreements[document.id] === document.lastUpdated,
  );
  const currentQuestion = visibleQuestions[currentIndex] ?? QUESTION_DEFINITIONS[0];

  useEffect(() => {
    void trackUsageEvent("app_loaded", {
      userEmail: authProfile?.email,
      metadata: {
        signedIn: Boolean(authProfile),
      },
    });
  }, []);

  useEffect(() => {
    setCurrentIndex((previousIndex) =>
      Math.min(previousIndex, Math.max(visibleQuestions.length - 1, 0)),
    );
  }, [visibleQuestions.length]);

  useEffect(() => {
    if (!authProfile) {
      setLegalAgreements({});
      return;
    }

    setLegalAgreements(localAccounts[authProfile.email]?.legalAgreements ?? {});
  }, [authProfile, localAccounts]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onPopState = () => {
      if (LEGAL_PATHS.has(window.location.pathname)) {
        setCurrentLegalPath(window.location.pathname);
      }

      setScreen(getScreenForPath(window.location.pathname));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function persist(nextAnswers: QuestionnaireAnswers) {
    if (storage) {
      saveDraft(storage, nextAnswers);
      setDraftSnapshot(loadDraft(storage));
    }
  }

  function handleAgreeToLegalDocument(document: LegalDocument) {
    setLegalAgreements((previousAgreements) => {
      const isAlreadyAgreed = previousAgreements[document.id] === document.lastUpdated;
      const nextAgreements = { ...previousAgreements };

      if (isAlreadyAgreed) {
        delete nextAgreements[document.id];
      } else {
        nextAgreements[document.id] = document.lastUpdated;
      }

      if (authProfile) {
        const currentAccount = localAccounts[authProfile.email];
        if (currentAccount) {
          const nextAccounts = {
            ...localAccounts,
            [authProfile.email]: {
              ...currentAccount,
              legalAgreements: nextAgreements,
            },
          };

          saveLocalAccounts(storage, nextAccounts);
          setLocalAccounts(nextAccounts);
        }
      }

      return nextAgreements;
    });
  }

  function handleSignIn(email: string, preferredName: string) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = preferredName.trim();

    if (!normalizedName) {
      throw new Error("Enter your preferred name.");
    }

    const account = localAccounts[normalizedEmail];
    const nextAccount: LocalAccountRecord = account
      ? { ...account, preferredName: normalizedName }
      : {
          email: normalizedEmail,
          preferredName: normalizedName,
          age: 35,
          legalAgreements: {},
          createdAt: new Date().toISOString(),
        };

    const nextAccounts = {
      ...localAccounts,
      [normalizedEmail]: nextAccount,
    };

    saveLocalAccounts(storage, nextAccounts);
    setLocalAccounts(nextAccounts);
    setLegalAgreements(nextAccount.legalAgreements);

    const nextAuthProfile: AuthProfile = {
      email: nextAccount.email,
      preferredName: nextAccount.preferredName,
      authProvider: "email",
      emailVerified: true,
      age: nextAccount.age,
      signedInAt: new Date().toISOString(),
    };

    saveAuthProfile(storage, nextAuthProfile);
    setAuthProfile(nextAuthProfile);
    setScreen("home");
    replacePath(HOME_PATH);
    void trackUsageEvent("sign_in_completed", {
      userEmail: nextAuthProfile.email,
      metadata: {
        authProvider: nextAuthProfile.authProvider,
        age: nextAuthProfile.age,
      },
    });
  }

  function handleSignUp({
    email,
    preferredName,
  }: {
    email: string;
    preferredName: string;
  }) {
    const normalizedEmail = normalizeEmail(email);

    if (blockedEmails[normalizedEmail]) {
      throw new Error("This email cannot use the app until the account holder is 18.");
    }

    if (localAccounts[normalizedEmail]) {
      throw new Error("An account already exists for this email. Please sign in instead.");
    }

    const nextAccount: LocalAccountRecord = {
      email: normalizedEmail,
      preferredName,
      age: 35,
      legalAgreements: {},
      createdAt: new Date().toISOString(),
    };

    const nextAccounts = {
      ...localAccounts,
      [normalizedEmail]: nextAccount,
    };

    saveLocalAccounts(storage, nextAccounts);
    setLocalAccounts(nextAccounts);
    setLegalAgreements(nextAccount.legalAgreements);

    const nextAuthProfile: AuthProfile = {
      email: nextAccount.email,
      preferredName: nextAccount.preferredName,
      authProvider: "email",
      emailVerified: true,
      age: nextAccount.age,
      signedInAt: new Date().toISOString(),
    };

    saveAuthProfile(storage, nextAuthProfile);
    setAuthProfile(nextAuthProfile);
    setScreen("home");
    replacePath(HOME_PATH);
    void trackUsageEvent("sign_up_completed", {
      userEmail: nextAuthProfile.email,
      metadata: {
        authProvider: nextAuthProfile.authProvider,
        age: nextAuthProfile.age,
      },
    });
  }

  function handleSignOut() {
    void trackUsageEvent("sign_out", {
      userEmail: authProfile?.email,
    });
    clearAuthProfile(storage);
    setAuthProfile(null);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    replacePath(HOME_PATH);
    setScreen("home");
  }

  function handleResetDemoData() {
    clearAuthProfile(storage);
    clearBlockedEmails(storage);
    if (storage) {
      clearDraft(storage);
      storage.removeItem(LOCAL_ACCOUNTS_STORAGE_KEY);
    }

    setAuthProfile(null);
    setLocalAccounts({});
    setBlockedEmails({});
    setLegalAgreements({});
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setDraftSnapshot(null);
    setSavedNotice("Demo data reset on this device.");
    replacePath(HOME_PATH);
    setScreen("home");
  }

  function handleUseDemoAccount() {
    const nextAgreements = appData.legalDocumentsUk.reduce<Record<string, string>>(
      (agreements, document) => ({
        ...agreements,
        [document.id]: document.lastUpdated,
      }),
      {},
    );

    const nextAccount: LocalAccountRecord = {
      email: DEMO_ACCOUNT_EMAIL,
      preferredName: DEMO_ACCOUNT_NAME,
      age: 35,
      legalAgreements: {},
      createdAt: new Date().toISOString(),
    };

    const nextAccounts = {
      ...localAccounts,
      [DEMO_ACCOUNT_EMAIL]: nextAccount,
    };

    saveLocalAccounts(storage, nextAccounts);
    setLegalAgreements(nextAccount.legalAgreements);
    setLocalAccounts(nextAccounts);

    const nextAuthProfile: AuthProfile = {
      email: nextAccount.email,
      preferredName: nextAccount.preferredName,
      authProvider: "email",
      emailVerified: true,
      age: nextAccount.age,
      signedInAt: new Date().toISOString(),
    };

    saveAuthProfile(storage, nextAuthProfile);
    setAuthProfile(nextAuthProfile);
    setScreen("home");
    replacePath(HOME_PATH);
    setSavedNotice("Demo account loaded for this device.");
    void trackUsageEvent("sign_in_completed", {
      userEmail: nextAuthProfile.email,
      metadata: {
        authProvider: nextAuthProfile.authProvider,
        age: nextAuthProfile.age,
      },
    });
  }

  function handleStartNew() {
    if (!authProfile) {
      return;
    }

    if (!hasAcceptedLegalDocuments) {
      return;
    }

    if (storage) {
      clearDraft(storage);
    }

    setDraftSnapshot(null);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setSavedNotice(null);
    replacePath(HOME_PATH);
    setScreen("questionnaire");
    void trackUsageEvent("questionnaire_started", {
      userEmail: authProfile.email,
    });
  }

  function handleResume() {
    if (!authProfile) {
      return;
    }

    if (!hasAcceptedLegalDocuments) {
      return;
    }

    if (!draftSnapshot) {
      handleStartNew();
      return;
    }

    const resumedAnswers = copyAnswersWithoutSkippedFields(draftSnapshot.answers);
    const resumedQuestions = getVisibleQuestions(resumedAnswers);

    setAnswers(resumedAnswers);
    setCurrentIndex(getFirstIncompleteQuestionIndex(resumedAnswers, resumedQuestions));
    setSavedNotice(null);
    replacePath(HOME_PATH);
    setScreen("questionnaire");
    void trackUsageEvent("questionnaire_resumed", {
      userEmail: authProfile.email,
    });
  }

  function handleAnswer(value: string | number) {
    const nextAnswers = copyAnswersWithoutSkippedFields({
      ...answers,
      [currentQuestion.id]: value,
    });
    const nextVisibleQuestions = getVisibleQuestions(nextAnswers);

    setAnswers(nextAnswers);
    persist(nextAnswers);
    void trackUsageEvent("question_answered", {
      userEmail: authProfile?.email,
      metadata: {
        questionId: currentQuestion.id,
        questionNumber: currentIndex + 1,
      },
    });

    if (currentQuestion.id === "q1_diagnosed_depression" && value === "no") {
      setScreen("diagnostic_signpost");
      void trackUsageEvent("diagnostic_signpost_viewed", {
        userEmail: authProfile?.email,
      });
      return;
    }

    if (getMatchResult(appData, nextAnswers).kind === "contact_specialist_now") {
      finalizeQuestionnaire(nextAnswers);
      return;
    }

    if (currentIndex >= nextVisibleQuestions.length - 1) {
      finalizeQuestionnaire(nextAnswers);
      return;
    }

    setCurrentIndex((previousIndex) => previousIndex + 1);
  }

  function finalizeQuestionnaire(nextAnswers: QuestionnaireAnswers) {
    const nextResult = getMatchResult(appData, nextAnswers);
    setResult(nextResult);

    if (storage) {
      clearDraft(storage);
    }

    setDraftSnapshot(null);
    if (nextResult.kind === "contact_specialist_now") {
      pushPath(CONTACT_SPECIALIST_PATH);
      setScreen("crisis");
      void trackUsageEvent("questionnaire_completed", {
        userEmail: authProfile?.email,
        metadata: {
          resultKind: nextResult.kind,
        },
      });
      void trackUsageEvent("crisis_page_viewed", {
        userEmail: authProfile?.email,
      });
      return;
    }

    replacePath(HOME_PATH);
    setScreen("results");
    void trackUsageEvent("questionnaire_completed", {
      userEmail: authProfile?.email,
      metadata: {
        resultKind: nextResult.kind,
        rankedCount: nextResult.ranked.length,
        alternativeCount: nextResult.alternatives.length,
      },
    });
  }

  function handleBack() {
    setCurrentIndex((previousIndex) => Math.max(previousIndex - 1, 0));
  }

  function handleSaveAndReturn() {
    persist(answers);
    setSavedNotice(appData.appCopy.questionnaireSavedNotice);
    replacePath(HOME_PATH);
    setScreen("home");
    void trackUsageEvent("draft_saved", {
      userEmail: authProfile?.email,
      metadata: {
        answeredQuestionCount: Object.keys(answers).length,
      },
    });
  }

  function handleExit() {
    persist(answers);
    replacePath(HOME_PATH);
    setScreen("home");
    void trackUsageEvent("questionnaire_exited", {
      userEmail: authProfile?.email,
      metadata: {
        answeredQuestionCount: Object.keys(answers).length,
      },
    });
  }

  function handleDiagnosticBack() {
    replacePath(HOME_PATH);
    setScreen("questionnaire");
    setCurrentIndex(0);
  }

  function handleDiagnosticContinue() {
    const nextVisibleQuestions = getVisibleQuestions(answers);
    setCurrentIndex(Math.min(1, Math.max(nextVisibleQuestions.length - 1, 0)));
    replacePath(HOME_PATH);
    setScreen("questionnaire");
  }

  function handleOpenBudgetPlanner() {
    pushPath(BUDGET_PATH);
    setScreen("budget");
    void trackUsageEvent("budget_opened", {
      userEmail: authProfile?.email,
    });
  }

  function handleBudgetBack() {
    replacePath(HOME_PATH);
    setScreen("results");
  }

  function handleOpenLegalDocument(path: string) {
    setReturnScreenAfterLegal(screen);
    setCurrentLegalPath(path);
    pushPath(path);
    setScreen("legal");
    void trackUsageEvent("legal_document_opened", {
      userEmail: authProfile?.email,
      metadata: {
        path,
      },
    });
  }

  function handleOpenAbout() {
    setReturnScreenAfterAbout(screen);
    pushPath(ABOUT_PATH);
    setScreen("about");
    void trackUsageEvent("about_opened", {
      userEmail: authProfile?.email,
    });
  }

  function handleAboutBack() {
    let nextScreen = returnScreenAfterAbout;

    if (
      (nextScreen === "results" || nextScreen === "budget") &&
      result?.kind !== "ranked"
    ) {
      nextScreen = authProfile ? "home" : "home";
    }

    replacePath(getPathForScreen(nextScreen));
    setScreen(nextScreen);
  }

  function handleLegalBack() {
    let nextScreen = returnScreenAfterLegal;

    if (
      (nextScreen === "results" || nextScreen === "budget") &&
      result?.kind !== "ranked"
    ) {
      nextScreen = "home";
    }

    replacePath(getPathForScreen(nextScreen));
    setScreen(nextScreen);
  }

  function handleLegalExit() {
    replacePath(HOME_PATH);
    setScreen("home");
  }

  function getCrisisSupportResources(): CrisisSupportResourceLink[] {
    const globalResources = [...appData.crisisSupportResources.global].sort(
      (left, right) => left.priority - right.priority,
    );

    if (
      selectedCountryCode &&
      ["US", "UK", "IE"].includes(selectedCountryCode)
    ) {
      const localResources = [
        ...appData.crisisSupportResources[
          selectedCountryCode as "US" | "UK" | "IE"
        ],
      ].sort((left, right) => left.priority - right.priority);

      return [...localResources, ...globalResources];
    }

    return globalResources;
  }

  if (!authProfile && screen !== "legal" && screen !== "about") {
    return (
      <SignInView
        appTitle={appData.appCopy.appTitle}
        blockedEmails={blockedEmails}
        legalDocuments={appData.legalDocumentsUk}
        legalAgreements={legalAgreements}
        onAgreeToLegalDocument={handleAgreeToLegalDocument}
        onOpenAbout={handleOpenAbout}
        onOpenLegalDocument={handleOpenLegalDocument}
        onUseDemoAccount={handleUseDemoAccount}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
    );
  }

  if (screen === "about") {
    return <AboutView appData={appData} onBack={handleAboutBack} />;
  }

  if (screen === "home") {
    return (
      <main className="app-shell home-shell">
        <section className="frame-card hero-card hero-card-siga">
          <div className="hero-brand-block">
            <p className="siga-logo">{appData.appCopy.appTitle}</p>
          </div>
          <p className="hero-copy hero-copy-siga">{appData.appCopy.intro}</p>
          {savedNotice ? (
            <div className="info-banner" role="status">
              {savedNotice}
            </div>
          ) : null}
          <div className="hero-actions hero-actions-siga">
            <button
              type="button"
              className="button button-primary button-home-primary"
              onClick={handleStartNew}
              disabled={!hasAcceptedLegalDocuments}
            >
              {appData.appCopy.startButtonLabel}
            </button>
            {draftSnapshot ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={handleResume}
                disabled={!hasAcceptedLegalDocuments}
              >
                {appData.appCopy.resumeButtonLabel}
              </button>
            ) : null}
          </div>
          <LegalAgreementPanel
            documents={appData.legalDocumentsUk}
            agreements={legalAgreements}
            onAgree={handleAgreeToLegalDocument}
            onOpen={handleOpenLegalDocument}
          />
          <LegalLinks
            documents={appData.legalDocumentsUk}
            onOpen={handleOpenLegalDocument}
          />
          <div className="auth-legal-links">
            <button
              type="button"
              className="legal-link-button"
              onClick={handleOpenAbout}
            >
              About
            </button>
          </div>
          {authProfile ? (
            <div className="signed-in-panel">
              <span>
                Signed in as {authProfile.preferredName} ({authProfile.email})
              </span>
              <div className="signed-in-actions">
                <button
                  type="button"
                  className="legal-link-button"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
                <button
                  type="button"
                  className="legal-link-button"
                  onClick={handleResetDemoData}
                >
                  Reset demo data
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    );
  }

  if (screen === "questionnaire") {
    return (
      <QuestionView
        appData={appData}
        currentQuestion={currentQuestion}
        currentIndex={currentIndex}
        totalQuestions={visibleQuestions.length}
        currentValue={answers[currentQuestion.id]}
        onAnswer={handleAnswer}
        onBack={handleBack}
        onExit={handleExit}
        onSaveAndReturn={handleSaveAndReturn}
        showBack={currentIndex > 0}
      />
    );
  }

  if (screen === "diagnostic_signpost") {
    return (
      <DiagnosticSignpostView
        onBack={handleDiagnosticBack}
        onRestart={handleStartNew}
        onContinue={handleDiagnosticContinue}
        onExit={handleExit}
      />
    );
  }

  if (screen === "crisis") {
    const crisisResources = getCrisisSupportResources();

    return (
      <main className="app-shell">
        <section className="frame-card crisis-card">
          <p className="eyebrow">Immediate support</p>
          <h1>{appData.hardStopRules.pageTitle}</h1>

          <div className="crisis-section">
            <h2>Reassurance</h2>
            <p>{appData.appCopy.crisisIntro}</p>
            <p>{appData.appCopy.crisisBestNextStep}</p>
          </div>

          <div className="crisis-section crisis-section-urgent">
            <h2>Immediate emergency</h2>
            <p>{appData.appCopy.crisisEmergency}</p>
          </div>

          <div className="crisis-section">
            <h2>Country-based support chooser</h2>
            <label className="country-selector">
              <span>{appData.appCopy.crisisCountryChooserLabel}</span>
              <select
                value={selectedCountryCode ?? ""}
                onChange={(event) =>
                  setSelectedCountryCode(event.target.value || null)
                }
              >
                <option value="">I am not sure</option>
                <option value="US">
                  {appData.crisisSupportResources.countryLabels.US}
                </option>
                <option value="UK">
                  {appData.crisisSupportResources.countryLabels.UK}
                </option>
                <option value="IE">
                  {appData.crisisSupportResources.countryLabels.IE}
                </option>
                <option value="OTHER">Other country</option>
              </select>
            </label>
            <div className="resource-grid">
              {crisisResources.map((resource) => (
                <CrisisSupportCard key={resource.id} item={resource} />
              ))}
            </div>
          </div>

          <div className="crisis-section">
            <h2>{appData.appCopy.crisisProfessionalCareHeading}</h2>
            <div className="resource-grid">
              {appData.crisisSupportResources.professionalCareOptions.map((item) => (
                <ProfessionalCareCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="crisis-section">
            <h2>{appData.appCopy.crisisChecklistHeading}</h2>
            <ul>
              {appData.crisisSupportResources.nextStepsChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "legal") {
    const legalDocument =
      getLegalDocumentForPath(appData, currentLegalPath) ??
      appData.legalDocumentsUk[0];

    return (
      <LegalDocumentView
        document={legalDocument}
        documents={appData.legalDocumentsUk}
        isAgreed={
          legalAgreements[legalDocument.id] === legalDocument.lastUpdated
        }
        onBack={handleLegalBack}
        onExit={handleLegalExit}
        onAgree={handleAgreeToLegalDocument}
        onOpen={handleOpenLegalDocument}
      />
    );
  }

  if (screen === "budget") {
    if (result?.kind === "ranked") {
      return (
        <BudgetPlanningView
          appData={appData}
          matches={result.ranked}
          onBack={handleBudgetBack}
          onRestart={handleStartNew}
        />
      );
    }

    return (
      <main className="app-shell">
        <section className="frame-card">
          <p className="eyebrow">Budget planning</p>
          <h1>Plan your budget</h1>
          <p className="hero-copy">
            Start the matcher first so we can build a budget page for your
            treatment matches.
          </p>
          <div className="results-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={handleStartNew}
            >
              Start now
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "results" && result?.kind === "ranked") {
    return (
      <main className="app-shell">
        <section className="frame-card">
          <p className="eyebrow">Measured profile results</p>
          <h1>{appData.appCopy.resultsHeading}</h1>
          <div className="results-header-actions">
            <button
              type="button"
              className="button button-primary budget-launch-button"
              onClick={handleOpenBudgetPlanner}
            >
              Plan your budget
            </button>
          </div>

          <div className="match-stack">
            {result.ranked.map((match) => (
              <MatchCard key={match.id} appData={appData} match={match} />
            ))}
          </div>

          {result.alternatives.length > 0 ? (
            <div className="alt-section">
              <h2>Alternative matches</h2>
              <div className="match-stack">
                {result.alternatives.map((match) => (
                  <MatchCard key={match.id} appData={appData} match={match} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="results-footer">
            <p>{appData.appCopy.resultsNote}</p>
            <div className="results-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={handleOpenAbout}
              >
                About
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={handleStartNew}
              >
                Restart
              </button>
            </div>
            <LegalLinks
              documents={appData.legalDocumentsUk}
              onOpen={handleOpenLegalDocument}
            />
          </div>
        </section>
      </main>
    );
  }

  return null;
}
