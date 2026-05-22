import type { QuestionDefinition, QuestionnaireAnswers } from "./types";

export const QUESTION_DEFINITIONS: QuestionDefinition[] = [
  {
    id: "q1_diagnosed_depression",
    title: "Q1. Has a clinician ever told you that you have depression?",
    options: [
      { key: "yes", value: "yes", label: "Yes" },
      { key: "no", value: "no", label: "No" },
      { key: "not_sure", value: "not_sure", label: "Not sure" },
      {
        key: "prefer_not",
        value: "prefer_not",
        label: "Prefer not to say",
      },
    ],
  },
  {
    id: "q2_suicidal_ideation",
    title:
      "Q2. In the last 2 weeks, have you had thoughts that you would be better off dead or of hurting yourself?",
    options: [
      { key: "0", value: 0, label: "Not at all" },
      { key: "1", value: 1, label: "Several days" },
      { key: "2", value: 2, label: "More than half the days" },
      { key: "3", value: 3, label: "Nearly every day" },
    ],
  },
  {
    id: "q3_suicidal_intent_now",
    title: "Q3. Are you thinking about acting on those thoughts now?",
    options: [
      { key: "no", value: "no", label: "No" },
      { key: "unsure", value: "unsure", label: "Unsure" },
      { key: "yes", value: "yes", label: "Yes" },
    ],
  },
  {
    id: "q4_mania_screen",
    title:
      "Q4. Have you ever had a period of several days or more when you felt unusually high, wired, needed much less sleep, were much more active than usual, or unusually impulsive?",
    options: [
      { key: "no", value: "no", label: "No" },
      { key: "maybe", value: "maybe", label: "Maybe" },
      { key: "yes", value: "yes", label: "Yes" },
    ],
  },
  {
    id: "q5_psychosis_screen",
    title:
      "Q5. Have you recently had experiences like hearing voices when no one is there, seeing things others cannot see, or being unable to shake beliefs that others say are not real?",
    options: [
      { key: "no", value: "no", label: "No" },
      { key: "maybe", value: "maybe", label: "Maybe" },
      { key: "yes", value: "yes", label: "Yes" },
    ],
  },
  {
    id: "q6_age_group",
    title: "Q6. Which age group are you in?",
    options: [
      { key: "18_24", value: "18_24", label: "18–24" },
      { key: "25_54", value: "25_54", label: "25–54" },
      { key: "55_74", value: "55_74", label: "55–74" },
      { key: "75_plus", value: "75_plus", label: "75+" },
      { key: "unknown", value: "unknown", label: "Prefer not to say" },
    ],
  },
  {
    id: "q7_perinatal_stage",
    title: "Q7. Which of these best describes you right now?",
    options: [
      { key: "pregnant", value: "pregnant", label: "I am pregnant" },
      {
        key: "postpartum",
        value: "postpartum",
        label: "I gave birth within the last 12 months",
      },
      { key: "none", value: "none", label: "Neither" },
      { key: "unknown", value: "unknown", label: "Prefer not to say" },
    ],
  },
  {
    id: "q8_source_group",
    title: "Q8. Which of these best describes your current situation?",
    options: [
      {
        key: "student",
        value: "student",
        label: "I am a college or university student",
      },
      {
        key: "medical_comorbidity",
        value: "medical_comorbidity",
        label: "I have a long-term physical health condition that affects my mood",
      },
      { key: "general", value: "general", label: "Neither" },
      { key: "both", value: "both", label: "Both" },
      { key: "unknown", value: "unknown", label: "Prefer not to say" },
    ],
  },
  {
    id: "q9_medical_condition",
    title:
      "Q9. If you have a long-term physical health condition, which is closest?",
    options: [
      { key: "diabetes", value: "diabetes", label: "Diabetes" },
      { key: "chronic_pain", value: "chronic_pain", label: "Chronic pain" },
      {
        key: "cardiovascular",
        value: "cardiovascular",
        label: "Heart or cardiovascular condition",
      },
      {
        key: "cancer",
        value: "cancer",
        label: "Cancer or cancer history",
      },
      { key: "hiv", value: "hiv", label: "HIV" },
      {
        key: "other_medical",
        value: "other_medical",
        label: "Another long-term condition",
      },
      { key: "none", value: "none", label: "Not applicable" },
      { key: "unknown", value: "unknown", label: "Prefer not to say" },
    ],
  },
  {
    id: "q10_diagnosis_type",
    title:
      "Q10. If a clinician has ever described your depression in a specific way, which is closest?",
    options: [
      {
        key: "major_depression",
        value: "major_depression",
        label: "Major depression",
      },
      {
        key: "persistent_chronic",
        value: "persistent_chronic",
        label: "Persistent or chronic depression",
      },
      {
        key: "depressive_symptoms_only",
        value: "depressive_symptoms_only",
        label: "Depressive symptoms but not a formal diagnosis",
      },
      {
        key: "not_sure",
        value: "not_sure",
        label: "I am not sure",
      },
      {
        key: "prefer_not",
        value: "prefer_not",
        label: "Prefer not to say",
      },
    ],
  },
  {
    id: "q11_course",
    title:
      "Q11. Which best describes how your depression has happened over time?",
    options: [
      {
        key: "first_episode",
        value: "first_episode",
        label: "This is my first episode",
      },
      {
        key: "recurrent",
        value: "recurrent",
        label: "I have had depression before",
      },
      {
        key: "chronic_hard_to_recover",
        value: "chronic_hard_to_recover",
        label: "It has felt long-lasting or hard to fully recover from",
      },
      { key: "unknown_1", value: "unknown", label: "I am not sure" },
      { key: "unknown_2", value: "unknown", label: "Prefer not to say" },
    ],
  },
  {
    id: "q12_help_style",
    title:
      "Q12. Which of these sounds closest to the kind of help you think you need?",
    options: [
      {
        key: "skills_based",
        value: "skills_based",
        label: "A practical skills-based treatment",
      },
      {
        key: "activation",
        value: "activation",
        label: "Help getting active and doing things again",
      },
      {
        key: "relationship_focused",
        value: "relationship_focused",
        label: "Help with relationship or role problems",
      },
      {
        key: "health_condition_coping",
        value: "health_condition_coping",
        label: "Help coping with depression linked to a health condition",
      },
      { key: "not_sure", value: "not_sure", label: "I am not sure" },
    ],
  },
  {
    id: "q13_linked_to",
    title:
      "Q13. Which best describes where your depression seems most tied to?",
    options: [
      {
        key: "thoughts_reactions",
        value: "thoughts_reactions",
        label: "Mainly my thoughts and reactions",
      },
      {
        key: "low_motivation_inactivity",
        value: "low_motivation_inactivity",
        label: "Mainly loss of motivation or not doing things",
      },
      {
        key: "relationships_loneliness",
        value: "relationships_loneliness",
        label: "Mainly relationships, conflict, or loneliness",
      },
      {
        key: "physical_health",
        value: "physical_health",
        label: "Mainly my physical health condition",
      },
      {
        key: "not_sure",
        value: "not_sure",
        label: "None of these / Not sure",
      },
    ],
  },
];

export function shouldAskQuestion10(answers: QuestionnaireAnswers): boolean {
  const q1 = answers.q1_diagnosed_depression;
  return q1 === "yes" || q1 === "not_sure";
}

export function getVisibleQuestions(
  answers: QuestionnaireAnswers,
): QuestionDefinition[] {
  return QUESTION_DEFINITIONS.filter((question) => {
    if (question.id !== "q10_diagnosis_type") {
      return true;
    }

    return shouldAskQuestion10(answers);
  });
}
