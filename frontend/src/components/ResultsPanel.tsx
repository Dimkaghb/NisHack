"use client";

import { useLocationIQStore } from "@/store/useLocationIQStore";
import { FactorBars } from "./FactorBars";
import { PipelineProgress } from "./PipelineProgress";
import { ScoreCard } from "./ScoreCard";

export function ResultsPanel() {
  const appState = useLocationIQStore((s) => s.appState);
  const businessType = useLocationIQStore((s) => s.businessType);
  const listings = useLocationIQStore((s) => s.listings);
  const activeListingId = useLocationIQStore((s) => s.activeListingId);
  const expandedListingId = useLocationIQStore((s) => s.expandedListingId);
  const setActiveListingId = useLocationIQStore((s) => s.setActiveListingId);
  const setExpandedListingId = useLocationIQStore((s) => s.setExpandedListingId);
  const setAppState = useLocationIQStore((s) => s.setAppState);
  const pipelineStatus = useLocationIQStore((s) => s.pipelineStatus);

  const isIdle = appState === "idle";
  const isLoading = appState === "loading";
  const isResults =
    appState === "results" || appState === "detail" || appState === "contact";

  function handleExpand(listingId: string) {
    setExpandedListingId(listingId);
    setActiveListingId(listingId);
    setAppState("detail");
  }

  function handleCollapse() {
    setExpandedListingId(null);
    setAppState("results");
  }

  function handleShowOnMap(listingId: string) {
    setActiveListingId(listingId);
  }

  return (
    <div
      className="h-full overflow-y-auto flex flex-col"
      style={{ gap: 0 }}
    >
      {/* Panel header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex-shrink-0"
        style={{
          backgroundColor: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--stroke)",
        }}
      >
        <h2
          className="font-semibold"
          style={{ fontSize: 15, color: "var(--neutral-30)" }}
        >
          {isIdle && "Как работает подбор"}
          {isLoading && "Анализируем рынок"}
          {isResults && listings.length > 0 && `Топ ${listings.length} локаций`}
          {isResults && listings.length === 0 && "Результаты"}
        </h2>
        {isLoading && pipelineStatus && (
          <p style={{ fontSize: 12, color: "var(--neutral-10)", marginTop: 2 }}>
            Статус: {pipelineStatus}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col" style={{ gap: 10 }}>
        {isIdle && <FactorBars businessType={businessType} />}

        {isLoading && <PipelineProgress />}

        {isResults && listings.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-12"
            style={{ gap: 8 }}
          >
            <span style={{ fontSize: 36 }}>🔍</span>
            <p
              className="text-center"
              style={{ fontSize: 14, color: "var(--neutral-10)" }}
            >
              Нет результатов. Попробуйте изменить параметры.
            </p>
          </div>
        )}

        {isResults &&
          listings.map((listing, index) => (
            <div key={listing.id} id={`card-${listing.id}`}>
              <ScoreCard
                listing={listing}
                rank={index + 1}
                isActive={listing.id === activeListingId}
                isExpanded={listing.id === expandedListingId}
                onExpand={() => handleExpand(listing.id)}
                onCollapse={handleCollapse}
                onShowOnMap={() => handleShowOnMap(listing.id)}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
