import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatcherApp } from "../MatcherApp";
import {
  getActiveCautionFlags,
  getMatchResult,
  isHardStop,
} from "../engine/scoring";
import { QUESTION_DEFINITIONS } from "../questionnaire";
import type { QuestionnaireAnswers } from "../types";
import { makeAppData } from "./fixtures/appData";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function renderMatcherApp(initialPath = "/") {
  window.history.replaceState({}, "", initialPath);
  const appData = makeAppData();
  const storage = createMemoryStorage();
  const user = userEvent.setup();

  render(<MatcherApp appData={appData} storage={storage} />);

  return { user, appData, storage };
}

async function startQuestionnaire(user: ReturnType<typeof userEvent.setup>) {
  if (
    screen.queryByRole("heading", {
        name: /choose a demo access option|sign in to use siga treatment matcher|sign up to use siga treatment matcher/i,
      })
  ) {
    await createAdultAccount(user);
  }

  const agreeButtons = screen.queryAllByRole("button", { name: /^i agree$/i });
  for (const agreeButton of agreeButtons) {
    await user.click(agreeButton);
  }

  await user.click(screen.getByRole("button", { name: /start now/i }));
}

async function createAdultAccount(
  user: ReturnType<typeof userEvent.setup>,
  email = "adult@example.com",
) {
  if (!screen.queryByLabelText(/preferred name/i)) {
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
  }

  await user.type(screen.getByLabelText(/^email$/i), email);
  await user.type(screen.getByLabelText(/preferred name/i), "Alex");

  const agreeButtons = screen.getAllByRole("button", { name: /^i agree$/i });
  for (const agreeButton of agreeButtons) {
    await user.click(agreeButton);
  }

  await user.click(screen.getByRole("button", { name: /^create account$/i }));
}

async function answerAndContinue(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
) {
  const dashVariants = [label];

  if (label.includes("â€“")) {
    dashVariants.push(label.replaceAll("â€“", "–"));
  }

  if (label.includes("–")) {
    dashVariants.push(label.replaceAll("–", "â€“"));
  }

  const input =
    dashVariants
      .map((variant) => screen.queryByLabelText(variant))
      .find(Boolean) ?? screen.getByLabelText(label);

  await user.click(input);
}

function buildSafeAnswers(
  overrides: Partial<QuestionnaireAnswers> = {},
): QuestionnaireAnswers {
  return {
    q1_diagnosed_depression: "yes",
    q2_suicidal_ideation: 0,
    q3_suicidal_intent_now: "no",
    q4_mania_screen: "no",
    q5_psychosis_screen: "no",
    q6_age_group: "25_54",
    q7_perinatal_stage: "none",
    q8_source_group: "general",
    q9_medical_condition: "none",
    q10_diagnosis_type: "major_depression",
    q11_course: "first_episode",
    q12_help_style: "skills_based",
    q13_linked_to: "thoughts_reactions",
    ...overrides,
  };
}

describe("MatcherApp", () => {
  test("creates an adult account before showing the matcher", async () => {
    const { user } = renderMatcherApp();

    expect(
      screen.getByRole("heading", {
        name: /choose a demo access option/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/email verification is not required for this demo version/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign up$/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start now/i }),
    ).not.toBeInTheDocument();

    await createAdultAccount(user, "verified@example.com");

    expect(screen.getByText(/signed in as alex/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start now/i })).toBeEnabled();
  });

  test("routes the sign-in and sign-up buttons to the correct forms", async () => {
    const { user } = renderMatcherApp();

    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(window.location.pathname).toBe("/sign-in");
    expect(
      screen.getByRole("heading", {
        name: /sign in to use siga treatment matcher/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^preferred name$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^continue$/i })).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /need an account\? sign up/i }),
    );

    expect(window.location.pathname).toBe("/sign-up");
    expect(
      screen.getByRole("heading", {
        name: /sign up to use siga treatment matcher/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^preferred name$/i)).toBeInTheDocument();
  });

  test("opens the demo account in one click", async () => {
    const { user } = renderMatcherApp();

    await user.click(screen.getByRole("button", { name: /^open demo account$/i }));

    expect(screen.getByText(/signed in as investor demo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start now/i })).toBeEnabled();
  });

  test("opens the sign-up form directly from the sign-up route", () => {
    renderMatcherApp("/sign-up");

    expect(window.location.pathname).toBe("/sign-up");
    expect(
      screen.getByRole("heading", {
        name: /sign up to use siga treatment matcher/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^preferred name$/i)).toBeInTheDocument();
  });

  test("signs back in with the saved email and name", async () => {
    const { user } = renderMatcherApp();

    await createAdultAccount(user, "saved@example.com");
    await user.click(screen.getByRole("button", { name: /^sign out$/i }));
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await user.type(screen.getByLabelText(/^email$/i), "saved@example.com");
    await user.type(screen.getByLabelText(/preferred name/i), "Alex");
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(screen.getByText(/signed in as alex/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start now/i })).toBeEnabled();
  });

  test("signs up directly and lands on the home screen", async () => {
    const { user } = renderMatcherApp();

    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await user.type(screen.getByLabelText(/^email$/i), "young@example.com");
    await user.type(screen.getByLabelText(/preferred name/i), "Sam");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    expect(screen.getByText(/signed in as sam/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start now/i })).toBeDisabled();
  });

  test("about page explains the current method from the app data", async () => {
    const { user } = renderMatcherApp();

    await user.click(screen.getByRole("button", { name: /^about$/i }));

    expect(
      screen.getByRole("heading", { name: /how the matcher works/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the context score is capped at 10 points/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the current tie threshold is 3 points/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/match score formula: base evidence \+ subgroup match \+ context score - fragility penalty/i),
    ).toBeInTheDocument();
  });

  test("requires agreement to all UK legal documents before starting", async () => {
    const { user } = renderMatcherApp();
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await user.type(screen.getByLabelText(/^email$/i), "newuser@example.com");
    await user.type(screen.getByLabelText(/preferred name/i), "Jamie");

    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    expect(
      screen.getByText(/agree to the privacy policy, terms of service, and disclaimer before signing up/i),
    ).toBeInTheDocument();

    const agreeButtons = screen.getAllByRole("button", { name: /^i agree$/i });
    for (const agreeButton of agreeButtons) {
      await user.click(agreeButton);
    }

    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    expect(screen.getByRole("button", { name: /start now/i })).toBeEnabled();

    await user.click(
      screen.getByRole("button", { name: /agreed for privacy policy/i }),
    );

    expect(screen.getByRole("button", { name: /start now/i })).toBeDisabled();
  });

  test("renders every question and every answer option in the UI", async () => {
    const { user } = renderMatcherApp();
    await startQuestionnaire(user);

    const answersByQuestion: Record<string, string> = {
      q1_diagnosed_depression: "Yes",
      q2_suicidal_ideation: "Not at all",
      q3_suicidal_intent_now: "No",
      q4_mania_screen: "No",
      q5_psychosis_screen: "No",
      q6_age_group: "25–54",
      q7_perinatal_stage: "Neither",
      q8_source_group: "Neither",
      q9_medical_condition: "Not applicable",
      q10_diagnosis_type: "Major depression",
      q11_course: "This is my first episode",
      q12_help_style: "A practical skills-based treatment",
      q13_linked_to: "Mainly my thoughts and reactions",
    };

    for (const question of QUESTION_DEFINITIONS) {
      expect(screen.getByText(question.title)).toBeInTheDocument();
      question.options.forEach((option) => {
        expect(screen.getByText(option.label)).toBeInTheDocument();
      });

      await answerAndContinue(user, answersByQuestion[question.id]);
    }

    expect(
      screen.getByRole("heading", {
        name: /your best-supported treatment matches/i,
      }),
    ).toBeInTheDocument();
  });

  test("supports save and resume later", async () => {
    const { user } = renderMatcherApp();
    await startQuestionnaire(user);

    await user.click(screen.getByLabelText("Yes"));
    await user.click(
      screen.getByRole("button", { name: /save and return later/i }),
    );

    expect(
      screen.getByText(/progress saved on this device/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /resume saved progress/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /resume saved progress/i }),
    );

    expect(
      screen.getByText(
        "Q2. In the last 2 weeks, have you had thoughts that you would be better off dead or of hurting yourself?",
      ),
    ).toBeInTheDocument();
  });

  test("UK legal documents are available from the home screen", async () => {
    const { user } = renderMatcherApp();
    await createAdultAccount(user);

    await user.click(
      screen.getByRole("button", { name: /^privacy policy$/i }),
    );

    expect(window.location.pathname).toBe("/privacy-policy-uk");
    expect(
      screen.getByRole("heading", { name: /privacy policy for uk users/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^exit$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/questionnaire answers are processed in your browser/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ico uk gdpr guidance/i }),
    ).toHaveAttribute(
      "href",
      "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/",
    );

    await user.click(screen.getByRole("button", { name: /^terms of service$/i }));

    expect(window.location.pathname).toBe("/terms-of-service-uk");
    expect(
      screen.getByRole("heading", { name: /terms of service for uk users/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^exit$/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^disclaimer$/i }));

    expect(window.location.pathname).toBe("/disclaimer-uk");
    expect(
      screen.getByRole("heading", {
        name: /health and safety disclaimer for uk users/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/not a diagnosis/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /^exit$/i }));
    expect(window.location.pathname).toBe("/");
    expect(
      screen.getByRole("button", { name: /start now/i }),
    ).toBeInTheDocument();
  });

  test("Q10 skip logic works and diagnosis signpost appears when q1 is no", async () => {
    const { user } = renderMatcherApp();
    await startQuestionnaire(user);

    await user.click(screen.getByLabelText("No"));

    expect(
      screen.getByRole("heading", {
        name: /find out which type of depression you have/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/online depression test/i)).toBeInTheDocument();
    expect(screen.getByText(/find a psychiatrist/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /^continue$/i }),
    );

    await answerAndContinue(user, "Not at all");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "25–54");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Not applicable");

    expect(
      screen.queryByText(
        "Q10. If a clinician has ever described your depression in a specific way, which is closest?",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Q11. Which best describes how your depression has happened over time?",
      ),
    ).toBeInTheDocument();
  });

  test("unconfirmed diagnosis caution includes a diagnosis link", async () => {
    const { user } = renderMatcherApp();
    await startQuestionnaire(user);

    await user.click(screen.getByLabelText("No"));
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    await answerAndContinue(user, "Not at all");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "25–54");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Not applicable");
    await answerAndContinue(
      user,
      "This is my first episode",
    );
    await answerAndContinue(
      user,
      "A practical skills-based treatment",
    );
    await answerAndContinue(user, "Mainly my thoughts and reactions");

    expect(
      screen.getAllByText(
        /confidence is lower because depression has not been clinically confirmed/i,
      ).length,
    ).toBeGreaterThan(0);

    const diagnosisLinks = screen.getAllByRole("link", { name: "LINK" });
    expect(diagnosisLinks.length).toBeGreaterThan(0);
    expect(diagnosisLinks[0]).toHaveAttribute(
      "href",
      "https://screening.mhanational.org/screening-tools/depression/",
    );
  });

  test("only q3=yes and q5=yes hard-stop", () => {
    const appData = makeAppData();

    expect(
      isHardStop(appData, buildSafeAnswers({ q3_suicidal_intent_now: "yes" })),
    ).toBe(true);
    expect(
      isHardStop(appData, buildSafeAnswers({ q5_psychosis_screen: "yes" })),
    ).toBe(true);
    expect(
      isHardStop(appData, buildSafeAnswers({ q4_mania_screen: "yes" })),
    ).toBe(false);
    expect(
      getMatchResult(appData, buildSafeAnswers({ q4_mania_screen: "yes" })).kind,
    ).toBe("ranked");
  });

  test("q4 maybe and q5 maybe only add caution flags", () => {
    const appData = makeAppData();
    const answers = buildSafeAnswers({
      q2_suicidal_ideation: 2,
      q4_mania_screen: "maybe",
      q5_psychosis_screen: "maybe",
    });
    const cautionFlags = getActiveCautionFlags(appData, answers);
    const result = getMatchResult(appData, answers);

    expect(cautionFlags).toEqual([
      "high_suicidal_ideation",
      "possible_mania",
      "possible_psychosis",
    ]);
    expect(result.kind).toBe("ranked");
    if (result.kind === "ranked") {
      expect(result.ranked[0].cautions).toEqual(
        expect.arrayContaining([
          appData.explanationTemplates.cautions.high_suicidal_ideation,
          appData.explanationTemplates.cautions.possible_mania,
          appData.explanationTemplates.cautions.possible_psychosis,
        ]),
      );
    }
  });

  test("scoring uses displayGroupId rather than cleanedSubtypeId", () => {
    const appData = makeAppData();
    appData.treatmentRegistry = appData.treatmentRegistry.map((entry) =>
      entry.displayGroupId === "cbt"
        ? { ...entry, cleanedSubtypeId: "not_the_score_key" }
        : entry,
    );
    appData.treatmentBaseScores.cbt.baseEvidence = 120;

    const result = getMatchResult(appData, buildSafeAnswers());

    expect(result.kind).toBe("ranked");
    if (result.kind === "ranked") {
      expect(result.ranked[0].id).toBe("cbt");
    }
  });

  test("scoring_config values are used for penalties and tie handling", () => {
    const highPenaltyData = makeAppData();
    const lowPenaltyData = makeAppData();
    highPenaltyData.scoringConfig.cautionPenalties.high_suicidal_ideation = 18;
    lowPenaltyData.scoringConfig.cautionPenalties.high_suicidal_ideation = 0;
    highPenaltyData.scoringConfig.tieThreshold = 0;
    lowPenaltyData.scoringConfig.tieThreshold = 100;
    highPenaltyData.treatmentBaseScores.behavioral_activation.baseEvidence = 70;
    highPenaltyData.treatmentBaseScores.cbt.baseEvidence = 72;
    lowPenaltyData.treatmentBaseScores.behavioral_activation.baseEvidence = 70;
    lowPenaltyData.treatmentBaseScores.cbt.baseEvidence = 72;

    const answers = buildSafeAnswers({
      q2_suicidal_ideation: 2,
      q12_help_style: "activation",
      q13_linked_to: "low_motivation_inactivity",
    });

    const highPenaltyResult = getMatchResult(highPenaltyData, answers);
    const lowPenaltyResult = getMatchResult(lowPenaltyData, answers);

    expect(highPenaltyResult.kind).toBe("ranked");
    expect(lowPenaltyResult.kind).toBe("ranked");
    if (highPenaltyResult.kind === "ranked" && lowPenaltyResult.kind === "ranked") {
      expect(highPenaltyResult.ranked[0].confidence).toBeLessThan(
        lowPenaltyResult.ranked[0].confidence,
      );
      expect(highPenaltyResult.ranked).toHaveLength(1);
      expect(lowPenaltyResult.ranked.length).toBeGreaterThan(1);
    }
  });

  test("display_group_metadata values drive the displayed names", () => {
    const appData = makeAppData();
    appData.displayGroupMetadata.cbt.displayName = "Metadata Driven CBT Name";
    appData.treatmentBaseScores.cbt.baseEvidence = 120;

    const result = getMatchResult(appData, buildSafeAnswers());

    expect(result.kind).toBe("ranked");
    if (result.kind === "ranked") {
      expect(result.ranked[0].displayName).toBe("Metadata Driven CBT Name");
    }
  });

  test("reviewed treatment registry mappings stay aligned with treatment families", () => {
    const appData = makeAppData();

    const expectedMappings: Record<string, string> = {
      "Cognitive-behavioral therapy for depression in parkinson’s disease":
        "cbt_health_tailored",
      "Group person-based cognitive therapy": "cbt",
      "Internet-based treatment": "other_psychological",
      "Mothers and babies course": "combined_multi_component",
      "Online therapy": "other_psychological",
      "Perinatal dyadic psychotherapy": "combined_multi_component",
      "Psychotherapy": "supportive_therapy",
      "Psychotherapy for postpartum depression": "combined_multi_component",
    };

    for (const [rawLabel, displayGroupId] of Object.entries(expectedMappings)) {
      const entry = appData.treatmentRegistry.find(
        (item) => item.rawLabel === rawLabel,
      );
      expect(entry).toBeDefined();
      expect(entry?.displayGroupId).toBe(displayGroupId);
      expect(entry?.scoreKey).toBe(displayGroupId);
    }
  });

  test("crisis page loads resources from crisis_support_resources.json", async () => {
    const { user } = renderMatcherApp();
    await startQuestionnaire(user);

    await answerAndContinue(user, "Yes");
    await answerAndContinue(user, "Not at all");
    await answerAndContinue(user, "Yes");

    expect(window.location.pathname).toBe("/contact-specialist-now");
    expect(
      screen.getByRole("heading", { name: /contact a specialist now\./i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/find a free, verified helpline in your country/i),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox"),
      screen.getByRole("option", { name: /united states/i }),
    );

    expect(screen.getByText(/call or text 988/i)).toBeInTheDocument();
    expect(screen.getByText(/24\/7/i)).toBeInTheDocument();
  });

  test("q5 yes also routes to contact-specialist-now", async () => {
    const { user } = renderMatcherApp();
    await startQuestionnaire(user);

    await answerAndContinue(user, "Yes");
    await answerAndContinue(user, "Not at all");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "Yes");

    expect(window.location.pathname).toBe("/contact-specialist-now");
    expect(
      screen.getByRole("heading", { name: /contact a specialist now\./i }),
    ).toBeInTheDocument();
  });

  test("results page has a restart button that returns to question 1", async () => {
    const { user } = renderMatcherApp();
    await startQuestionnaire(user);

    await answerAndContinue(user, "Yes");
    await answerAndContinue(user, "Not at all");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "25–54");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Not applicable");
    await answerAndContinue(user, "Major depression");
    await answerAndContinue(user, "This is my first episode");
    await answerAndContinue(user, "A practical skills-based treatment");
    await answerAndContinue(user, "Mainly my thoughts and reactions");

    expect(
      screen.getByRole("heading", {
        name: /your best-supported treatment matches/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^restart$/i }));

    expect(
      screen.getByText(
        "Q1. Has a clinician ever told you that you have depression?",
      ),
    ).toBeInTheDocument();
  });

  test("results page groups providers by delivery type", async () => {
    const { user } = renderMatcherApp();
    await startQuestionnaire(user);

    await answerAndContinue(user, "Yes");
    await answerAndContinue(user, "Not at all");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "25–54");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Not applicable");
    await answerAndContinue(user, "Major depression");
    await answerAndContinue(user, "This is my first episode");
    await answerAndContinue(user, "A practical skills-based treatment");
    await answerAndContinue(user, "Mainly my thoughts and reactions");

    const cbtCard = screen
      .getByRole("heading", { name: /cognitive behavioral therapy \(cbt\)/i })
      .closest("article");

    expect(cbtCard).not.toBeNull();
    const cbtCardQueries = within(cbtCard as HTMLElement);

    expect(cbtCardQueries.getByText("Providers")).toBeInTheDocument();
    expect(
      cbtCardQueries.getByRole("heading", { name: /in-person treatments/i }),
    ).toBeInTheDocument();
    expect(
      cbtCardQueries.getByRole("heading", { name: /online treatments/i }),
    ).toBeInTheDocument();
    expect(
      cbtCardQueries.getByRole("heading", { name: /web-based treatments/i }),
    ).toBeInTheDocument();
    expect(
      cbtCardQueries.getByRole("heading", { name: /ai treatments/i }),
    ).toBeInTheDocument();

    const onlineSection = cbtCardQueries
      .getByRole("heading", { name: /online treatments/i })
      .closest("section");
    const webBasedSection = cbtCardQueries
      .getByRole("heading", { name: /web-based treatments/i })
      .closest("section");
    const aiSection = cbtCardQueries
      .getByRole("heading", { name: /ai treatments/i })
      .closest("section");

    expect(onlineSection).not.toBeNull();
    expect(webBasedSection).not.toBeNull();
    expect(aiSection).not.toBeNull();

    expect(
      within(onlineSection as HTMLElement).getByRole("link", {
        name: "Beck Institute",
      }),
    ).toBeInTheDocument();
    expect(
      within(onlineSection as HTMLElement).getByRole("link", {
        name: "Dr. Judith S. Beck",
      }),
    ).toBeInTheDocument();
    expect(
      within(webBasedSection as HTMLElement).getByRole("link", {
        name: "SilverCloud by Amwell",
      }),
    ).toBeInTheDocument();
    expect(
      within(aiSection as HTMLElement).getByRole("link", {
        name: "Wysa",
      }),
    ).toBeInTheDocument();
    const bestMatchBadges = cbtCardQueries.getAllByText(/best treatment match/i);
    expect(bestMatchBadges.length).toBeGreaterThan(0);
    expect(bestMatchBadges[0]).toHaveAttribute(
      "title",
      "This provider supports the exact treatment shown here.",
    );
  });

  test("results page removes the extra sentence and opens the budget page", async () => {
    const { user } = renderMatcherApp();
    await startQuestionnaire(user);

    await answerAndContinue(user, "Yes");
    await answerAndContinue(user, "Not at all");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "25–54");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Not applicable");
    await answerAndContinue(user, "Major depression");
    await answerAndContinue(user, "This is my first episode");
    await answerAndContinue(user, "A practical skills-based treatment");
    await answerAndContinue(user, "Mainly my thoughts and reactions");

    expect(
      screen.queryByText(
        /these are the best-supported treatment matches based on your measured profile/i,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /plan your budget/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /plan your budget/i }));

    expect(
      screen.getByRole("heading", { name: /plan your budget/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/this first version focuses on time, not money/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/target duration:/i),
    ).toBeInTheDocument();
  });

  test("results page shows only the exact treatment detail for a match", async () => {
    const { user } = renderMatcherApp();
    await startQuestionnaire(user);

    await answerAndContinue(user, "Yes");
    await answerAndContinue(user, "Not at all");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "25–54");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Not applicable");
    await answerAndContinue(user, "Major depression");
    await answerAndContinue(user, "This is my first episode");
    await answerAndContinue(user, "A practical skills-based treatment");
    await answerAndContinue(user, "Mainly my thoughts and reactions");

    const cbtCard = screen
      .getByRole("heading", { name: /cognitive behavioral therapy \(cbt\)/i })
      .closest("article");

    expect(cbtCard).not.toBeNull();
    const cbtCardQueries = within(cbtCard as HTMLElement);

    await user.click(
      cbtCardQueries.getByRole("button", {
        name: /find out more about the treatment/i,
      }),
    );

    const detailsPanel = cbtCardQueries.getByRole("button", {
      name: /hide treatment details/i,
    }).nextElementSibling as HTMLElement;
    const detailQueries = within(detailsPanel);

    expect(
      detailQueries.getByText(/^Cognitive behavior therapy$/i),
    ).toBeInTheDocument();
    expect(
      detailQueries.queryByText(/brief culturally adapted cbt/i),
    ).not.toBeInTheDocument();
    expect(
      detailQueries.queryByText(/internet-based cognitive behavior therapy/i),
    ).not.toBeInTheDocument();
    const nhsLinks = detailQueries.getAllByRole("link", {
      name: /\[learn more\] nhs cbt overview/i,
    });
    expect(nhsLinks).toHaveLength(1);
    expect(nhsLinks[0]).toHaveAttribute(
      "href",
      "https://www.nhs.uk/tests-and-treatments/cognitive-behavioural-therapy-cbt/",
    );
  });

  test("results page explains the meaning of match score", async () => {
    const { user } = renderMatcherApp();
    await startQuestionnaire(user);

    await answerAndContinue(user, "Yes");
    await answerAndContinue(user, "Not at all");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "25–54");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Not applicable");
    await answerAndContinue(user, "Major depression");
    await answerAndContinue(user, "This is my first episode");
    await answerAndContinue(user, "A practical skills-based treatment");
    await answerAndContinue(user, "Mainly my thoughts and reactions");

    const cbtCard = screen
      .getByRole("heading", { name: /cognitive behavioral therapy \(cbt\)/i })
      .closest("article");

    expect(cbtCard).not.toBeNull();
    const cbtCardQueries = within(cbtCard as HTMLElement);

    await user.click(
      cbtCardQueries.getByRole("button", {
        name: /what does this match level mean/i,
      }),
    );

    expect(
      cbtCardQueries.getByText(
        /the app works out a score from your answers/i,
      ),
    ).toBeInTheDocument();
    expect(
      cbtCardQueries.queryAllByRole("dialog", {
        name: /match level explanation/i,
      }),
    ).toHaveLength(1);
  });

  test("results page shows match levels and hides confidence numbers", async () => {
    const { user } = renderMatcherApp();
    await startQuestionnaire(user);

    await answerAndContinue(user, "Yes");
    await answerAndContinue(user, "Not at all");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "25–54");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Not applicable");
    await answerAndContinue(user, "Major depression");
    await answerAndContinue(user, "This is my first episode");
    await answerAndContinue(user, "A practical skills-based treatment");
    await answerAndContinue(user, "Mainly my thoughts and reactions");

    const cbtCard = screen
      .getByRole("heading", { name: /cognitive behavioral therapy \(cbt\)/i })
      .closest("article");

    expect(cbtCard).not.toBeNull();
    const cbtCardQueries = within(cbtCard as HTMLElement);

    expect(
      cbtCardQueries.queryByText(/match level:/i),
    ).not.toBeInTheDocument();
    expect(
      cbtCardQueries.getAllByText(
        /highest match level|very high match level|high match level|moderate match level|low match level/i,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      cbtCardQueries.queryByRole("button", {
        name: /what do the confidence label and number mean/i,
      }),
    ).not.toBeInTheDocument();
  });

  test("missing exact treatment details roll up to an explicit family-level description", async () => {
    const appData = makeAppData();
    appData.treatmentBaseScores.cbt_health_tailored.baseEvidence = 200;
    appData.treatmentBaseScores.cbt.baseEvidence = 10;
    appData.treatmentBaseScores.behavioral_activation.baseEvidence = 10;
    appData.treatmentBaseScores.ipt.baseEvidence = 10;

    const storage = createMemoryStorage();
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/");

    render(<MatcherApp appData={appData} storage={storage} />);

    await startQuestionnaire(user);
    await answerAndContinue(user, "Yes");
    await answerAndContinue(user, "Several days");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "Maybe");
    await answerAndContinue(user, "Maybe");
    await answerAndContinue(user, "25–54");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(
      user,
      "I have a long-term physical health condition that affects my mood",
    );
    await answerAndContinue(user, "Another long-term condition");
    await answerAndContinue(user, "Major depression");
    await answerAndContinue(user, "I have had depression before");
    await answerAndContinue(user, "Help coping with depression linked to a health condition");
    await answerAndContinue(user, "Mainly my physical health condition");

    const healthTailoredCard = screen
      .getByRole("heading", { name: /health-tailored cbt/i })
      .closest("article");

    expect(healthTailoredCard).not.toBeNull();
    const healthTailoredQueries = within(healthTailoredCard as HTMLElement);

    await user.click(
      healthTailoredQueries.getByRole("button", {
        name: /find out more about the treatment/i,
      }),
    );

    expect(
      healthTailoredQueries.getByText(
        /cognitive behavioral therapy \(cbt\) family of treatments/i,
      ),
    ).toBeInTheDocument();
    expect(
      healthTailoredQueries.getByText(
        /the information below describes the broader cbt family that this treatment belongs to/i,
      ),
    ).toBeInTheDocument();
  });

  test("find out more button is hidden when neither exact nor family-level details exist", async () => {
    const appData = makeAppData();
    appData.treatmentBaseScores.combined_multi_component.baseEvidence = 220;
    appData.treatmentBaseScores.cbt.baseEvidence = 10;
    appData.treatmentBaseScores.behavioral_activation.baseEvidence = 10;
    appData.treatmentBaseScores.ipt.baseEvidence = 10;

    const storage = createMemoryStorage();
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/");

    render(<MatcherApp appData={appData} storage={storage} />);

    await startQuestionnaire(user);
    await answerAndContinue(user, "Yes");
    await answerAndContinue(user, "Not at all");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "No");
    await answerAndContinue(user, "25–54");
    await answerAndContinue(user, "I gave birth within the last 12 months");
    await answerAndContinue(user, "Neither");
    await answerAndContinue(user, "Not applicable");
    await answerAndContinue(user, "Major depression");
    await answerAndContinue(user, "This is my first episode");
    await answerAndContinue(user, "A practical skills-based treatment");
    await answerAndContinue(user, "Mainly my thoughts and reactions");

    const combinedCard = screen
      .getByRole("heading", { name: /combined \/ multi-component interventions/i })
      .closest("article");

    expect(combinedCard).not.toBeNull();
    const combinedQueries = within(combinedCard as HTMLElement);

    expect(
      combinedQueries.queryByRole("button", {
        name: /find out more about the treatment/i,
      }),
    ).not.toBeInTheDocument();
  });
});
