import type { PersistedDraft, QuestionnaireAnswers } from "./types";

export const DRAFT_STORAGE_KEY = "depression-treatment-matcher-draft";

export function saveDraft(
  storage: Storage,
  answers: QuestionnaireAnswers,
): void {
  const payload: PersistedDraft = {
    answers,
    savedAt: new Date().toISOString(),
  };

  storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
}

export function loadDraft(storage: Storage): PersistedDraft | null {
  const raw = storage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedDraft;
  } catch {
    storage.removeItem(DRAFT_STORAGE_KEY);
    return null;
  }
}

export function clearDraft(storage: Storage): void {
  storage.removeItem(DRAFT_STORAGE_KEY);
}
