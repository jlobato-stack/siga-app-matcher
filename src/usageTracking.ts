export type UsageEventName =
  | "app_loaded"
  | "email_verified"
  | "sign_in_completed"
  | "sign_up_completed"
  | "under_18_blocked"
  | "sign_out"
  | "about_opened"
  | "legal_document_opened"
  | "legal_document_agreed"
  | "questionnaire_started"
  | "questionnaire_resumed"
  | "question_answered"
  | "diagnostic_signpost_viewed"
  | "draft_saved"
  | "questionnaire_exited"
  | "questionnaire_completed"
  | "crisis_page_viewed"
  | "budget_opened";

export interface UsageEvent {
  id?: number;
  eventName: UsageEventName;
  timestamp: string;
  path: string;
  userEmail?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

const USAGE_DATABASE_NAME = "siga_depression_matcher_usage";
const USAGE_DATABASE_VERSION = 1;
const USAGE_EVENT_STORE = "usage_events";

function openUsageDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const request = window.indexedDB.open(
      USAGE_DATABASE_NAME,
      USAGE_DATABASE_VERSION,
    );

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(USAGE_EVENT_STORE)) {
        const store = database.createObjectStore(USAGE_EVENT_STORE, {
          autoIncrement: true,
          keyPath: "id",
        });
        store.createIndex("eventName", "eventName", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("userEmail", "userEmail", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

export async function trackUsageEvent(
  eventName: UsageEventName,
  options: {
    userEmail?: string;
    metadata?: UsageEvent["metadata"];
  } = {},
): Promise<void> {
  const database = await openUsageDatabase();
  if (!database) {
    return;
  }

  const event: UsageEvent = {
    eventName,
    timestamp: new Date().toISOString(),
    path:
      typeof window === "undefined"
        ? "/"
        : `${window.location.pathname}${window.location.search}`,
    userEmail: options.userEmail,
    metadata: options.metadata,
  };

  await new Promise<void>((resolve) => {
    const transaction = database.transaction(USAGE_EVENT_STORE, "readwrite");
    transaction.objectStore(USAGE_EVENT_STORE).add(event);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      resolve();
    };
    transaction.onabort = () => {
      database.close();
      resolve();
    };
  });
}
