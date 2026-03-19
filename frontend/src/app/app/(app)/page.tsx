"use client";

import { HeroScreen } from "@/components/HeroScreen";
import { Questionnaire } from "@/components/Questionnaire";
import { PipelineProgress } from "@/components/PipelineProgress";
import { ResultsGrid } from "@/components/ResultsGrid";
import { useLocationIQStore } from "@/store/useLocationIQStore";
import { useSearchPolling } from "@/hooks/useSearchPolling";


// ─── Loading screen ───────────────────────────────────────────────────────

function LoadingScreen({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16">
      <div
        className="w-full rounded-2xl flex flex-col"
        style={{
          maxWidth: 480,
          backgroundColor: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(8px)",
          border: "1px solid var(--stroke)",
          overflow: "hidden",
        }}
      >
        <PipelineProgress />

        <div
          className="px-5 pb-5"
          style={{ borderTop: "1px solid var(--stroke)", paddingTop: 16 }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl font-medium transition-colors"
            style={{
              padding: "10px 16px",
              fontSize: 14,
              backgroundColor: "rgba(220,38,38,0.06)",
              color: "#dc2626",
              border: "1.5px solid rgba(220,38,38,0.2)",
              cursor: "pointer",
            }}
          >
            Отменить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AppPage() {
  const appState = useLocationIQStore((s) => s.appState);
  const setAppState = useLocationIQStore((s) => s.setAppState);
  const resetSearch = useLocationIQStore((s) => s.resetSearch);
  const explanation = useLocationIQStore((s) => s.explanation);

  useSearchPolling();

  const isResults =
    appState === "results" || appState === "detail" || appState === "contact";

  return (
    <>
      <style>{`
        .leaflet-control-attribution {
          font-size: 10px !important;
          background: rgba(255,255,255,0.7) !important;
          padding: 2px 6px !important;
        }
        .liq-marker {
          width: 36px; height: 36px;
          border-radius: 50%;
          background-color: var(--marker-color, #16a34a);
          border: 2.5px solid rgba(255,255,255,0.9);
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 13px;
          font-family: var(--font-plus-jakarta), sans-serif;
          transition: transform 0.15s ease; cursor: pointer;
        }
        .liq-marker:hover { transform: scale(1.1); }
        .liq-marker--active {
          animation: liq-pulse 1.4s ease-in-out infinite;
        }
        @keyframes liq-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
          70%  { box-shadow: 0 0 0 10px rgba(22,163,74,0); }
          100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
        }
        .pipeline-spinner {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div className="flex flex-col" style={{ minHeight: "100dvh" }}>

        {/* Idle — hero CTA */}
        {appState === "idle" && (
          <HeroScreen onStart={() => setAppState("form")} />
        )}

        {/* Form — questionnaire */}
        {appState === "form" && (
          <Questionnaire onBack={() => setAppState("idle")} />
        )}

        {/* Loading — pipeline */}
        {appState === "loading" && (
          <LoadingScreen onCancel={resetSearch} />
        )}

        {/* Results — card grid */}
        {isResults && (
          <ResultsGrid
            onStartOver={resetSearch}
            explanation={explanation}
          />
        )}
      </div>
    </>
  );
}
