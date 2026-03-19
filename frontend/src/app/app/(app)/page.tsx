"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { SearchForm } from "@/components/SearchForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { ContactModal } from "@/components/ContactModal";
import { useLocationIQStore } from "@/store/useLocationIQStore";
import { postSearch } from "@/lib/api";

const AlmatyMap = dynamic(
  () => import("@/components/AlmatyMap").then((m) => m.AlmatyMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100" /> }
);

function Header() {
  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-5"
      style={{
        height: 48,
        backgroundColor: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--stroke)",
        zIndex: 100,
      }}
    >
      <span
        className="font-bold tracking-tight"
        style={{ fontSize: 18, color: "var(--neutral-30)", letterSpacing: "-0.03em" }}
      >
        Location<span style={{ color: "var(--accent-blue)" }}>IQ</span>
      </span>
      <div
        className="flex items-center justify-center rounded-full font-semibold"
        style={{
          width: 32,
          height: 32,
          backgroundColor: "var(--beige-10)",
          fontSize: 13,
          color: "var(--neutral-20)",
          border: "1.5px solid var(--stroke)",
          cursor: "pointer",
        }}
      >
        А
      </div>
    </header>
  );
}

export default function AppPage() {
  const appState = useLocationIQStore((s) => s.appState);
  const businessType = useLocationIQStore((s) => s.businessType);
  const district = useLocationIQStore((s) => s.district);
  const budgetTenge = useLocationIQStore((s) => s.budgetTenge);
  const areaSqmMin = useLocationIQStore((s) => s.areaSqmMin);
  const competitorTolerance = useLocationIQStore((s) => s.competitorTolerance);
  const setAppState = useLocationIQStore((s) => s.setAppState);
  const setSessionId = useLocationIQStore((s) => s.setSessionId);
  const lastSearchedParams = useLocationIQStore((s) => s.lastSearchedParams);
  const setLastSearchedParams = useLocationIQStore((s) => s.setLastSearchedParams);

  const isResults =
    appState === "results" || appState === "detail" || appState === "contact";

  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const currentParams = JSON.stringify({
    businessType,
    district,
    budgetTenge,
    areaSqmMin,
    competitorTolerance,
  });

  // Stale detection: compare current form params to the params used for last search
  const isStale =
    isResults &&
    lastSearchedParams !== null &&
    currentParams !== lastSearchedParams;

  const handleRefresh = useCallback(async () => {
    if (!businessType) return;
    const params = JSON.stringify({
      businessType,
      district,
      budgetTenge,
      areaSqmMin,
      competitorTolerance,
    });
    try {
      const res = await postSearch({
        business_type: businessType,
        district,
        budget_tenge: budgetTenge,
        area_sqm_min: areaSqmMin,
        competitor_tolerance: businessType === "office" ? 0 : competitorTolerance,
      });
      setSessionId(res.session_id);
      setLastSearchedParams(params);
      setAppState("loading");
    } catch {
      // silent — form submit will show error
    }
  }, [businessType, district, budgetTenge, areaSqmMin, competitorTolerance, setSessionId, setAppState, setLastSearchedParams]);

  return (
    <>
      <style>{`
        /* Leaflet attribution minimal style */
        .leaflet-control-attribution {
          font-size: 10px !important;
          background: rgba(255,255,255,0.7) !important;
          padding: 2px 6px !important;
        }

        /* Marker styles */
        .liq-marker {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--marker-color, #16a34a);
          border: 2.5px solid rgba(255,255,255,0.9);
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 13px;
          font-family: var(--font-plus-jakarta), sans-serif;
          transition: transform 0.15s ease;
          cursor: pointer;
        }
        .liq-marker:hover {
          transform: scale(1.1);
        }
        .liq-marker--active {
          animation: liq-pulse 1.4s ease-in-out infinite;
          box-shadow: 0 0 0 0 var(--marker-color, #16a34a);
        }
        @keyframes liq-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
          70%  { box-shadow: 0 0 0 10px rgba(22,163,74,0); }
          100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
        }

        /* Pipeline step spinner */
        .pipeline-spinner {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div
        className="flex flex-col"
        style={{ height: "100dvh", overflow: "hidden" }}
      >
        <Header />

        {/* Desktop layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Input Panel — desktop */}
          <aside
            className="hidden md:flex flex-col flex-shrink-0 overflow-y-auto"
            style={{
              width: 320,
              borderRight: "1px solid var(--stroke)",
              backgroundColor: "rgba(244,241,238,0.7)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="p-4 flex-1">
              <SearchForm />
            </div>
          </aside>

          {/* Map */}
          <main className="flex-1 relative overflow-hidden">
            <AlmatyMap isStale={isStale} onRefresh={handleRefresh} />

            {/* Mobile: floating open-form button */}
            <button
              type="button"
              className="md:hidden absolute bottom-40 right-4 z-[1000] flex items-center gap-2 rounded-full shadow-lg font-semibold"
              style={{
                padding: "10px 16px",
                backgroundColor: "var(--neutral-30)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
              }}
              onClick={() => setIsMobileSheetOpen(true)}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Поиск
            </button>
          </main>

          {/* Results Panel — desktop */}
          <aside
            className="hidden md:flex flex-col flex-shrink-0"
            style={{
              width: 360,
              borderLeft: "1px solid var(--stroke)",
              backgroundColor: "rgba(244,241,238,0.7)",
              backdropFilter: "blur(10px)",
              overflow: "hidden",
            }}
          >
            <ResultsPanel />
          </aside>
        </div>

        {/* Mobile Results bottom sheet */}
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-[900] rounded-t-2xl flex flex-col"
          style={{
            height: "45vh",
            backgroundColor: "rgba(244,241,238,0.97)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid var(--stroke)",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.1)",
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div
              className="rounded-full"
              style={{ width: 36, height: 4, backgroundColor: "var(--stroke)" }}
            />
          </div>
          <ResultsPanel />
        </div>

        {/* Mobile Input bottom sheet */}
        {isMobileSheetOpen && (
          <div
            className="md:hidden fixed inset-0 z-[950]"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            onClick={() => setIsMobileSheetOpen(false)}
          >
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-y-auto"
              style={{
                maxHeight: "85dvh",
                backgroundColor: "rgba(244,241,238,0.99)",
                backdropFilter: "blur(12px)",
                padding: 20,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2
                  className="font-semibold"
                  style={{ fontSize: 16, color: "var(--neutral-30)" }}
                >
                  Параметры поиска
                </h2>
                <button
                  type="button"
                  onClick={() => setIsMobileSheetOpen(false)}
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: "var(--beige-10)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 18,
                    color: "var(--neutral-20)",
                  }}
                >
                  ×
                </button>
              </div>
              <SearchForm />
            </div>
          </div>
        )}

        {/* Contact modal */}
        {appState === "contact" && <ContactModal />}
      </div>
    </>
  );
}
