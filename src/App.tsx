import { useEffect, useState } from "react";
import { loadAppData } from "./data/loadAppData";
import { MatcherApp } from "./MatcherApp";
import type { AppData } from "./types";

function LoadingState() {
  return (
    <main className="app-shell">
      <section className="frame-card status-card">
        <p className="eyebrow">Loading data</p>
        <h1>Preparing the questionnaire</h1>
        <p>Loading the required treatment matching files.</p>
      </section>
    </main>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="app-shell">
      <section className="frame-card status-card status-card-error">
        <p className="eyebrow">Configuration error</p>
        <h1>Required app data could not be loaded.</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}

export default function App() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadAppData()
      .then((loadedData) => {
        if (isMounted) {
          setAppData(loadedData);
        }
      })
      .catch((loadError: unknown) => {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unknown data-loading failure.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!appData) {
    return <LoadingState />;
  }

  return <MatcherApp appData={appData} />;
}
