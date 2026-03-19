"use client";

import { useState } from "react";
import type { ScoredListing } from "@/types";
import { ScoreRing } from "./ScoreRing";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { useLocationIQStore } from "@/store/useLocationIQStore";
import { formatPrice, formatArea, getScoreBadges } from "@/lib/score-utils";
import { postContact } from "@/lib/api";

interface ScoreCardProps {
  listing: ScoredListing;
  rank: number;
  isActive: boolean;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onShowOnMap: () => void;
}

export function ScoreCard({
  listing,
  rank,
  isActive,
  isExpanded,
  onExpand,
  onCollapse,
  onShowOnMap,
}: ScoreCardProps) {
  const sessionId = useLocationIQStore((s) => s.sessionId);
  const setContactDraft = useLocationIQStore((s) => s.setContactDraft);
  const setAppState = useLocationIQStore((s) => s.setAppState);
  const setActiveListingId = useLocationIQStore((s) => s.setActiveListingId);

  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const { top, low } = getScoreBadges(listing);

  async function handleContact() {
    if (!sessionId) return;
    setContactLoading(true);
    setContactError(null);
    try {
      const draft = await postContact(sessionId, listing.id);
      setContactDraft(draft);
      setActiveListingId(listing.id);
      setAppState("contact");
    } catch {
      setContactError("Не удалось сгенерировать письмо. Попробуйте ещё раз.");
    } finally {
      setContactLoading(false);
    }
  }

  function handleCardClick() {
    if (!isExpanded) {
      onExpand();
      setActiveListingId(listing.id);
    }
  }

  return (
    <div
      className="rounded-2xl transition-all cursor-pointer"
      style={{
        backgroundColor: "rgba(255,255,255,0.72)",
        border: isActive ? "2px solid var(--accent-blue)" : "2px solid transparent",
        overflow: "hidden",
      }}
      onClick={handleCardClick}
    >
      {/* Collapsed header — always visible */}
      <div className="flex items-start p-4" style={{ gap: 12 }}>
        {/* Rank badge */}
        <span
          className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white"
          style={{
            width: 32,
            height: 32,
            backgroundColor: "var(--neutral-30)",
            fontSize: 14,
            marginTop: 2,
          }}
        >
          {rank}
        </span>

        {/* Address + meta */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 4 }}>
          <p
            className="font-medium leading-snug line-clamp-2"
            style={{ fontSize: 14, color: "var(--neutral-30)" }}
          >
            {listing.address}
          </p>
          <div className="flex items-center flex-wrap" style={{ gap: 6 }}>
            <span className="text-[13px]" style={{ color: "var(--neutral-20)" }}>
              {formatPrice(listing.price_tenge)}
            </span>
            <span
              className="text-[11px] rounded-full px-2 py-0.5"
              style={{
                backgroundColor: "var(--beige-10)",
                color: "var(--neutral-10)",
              }}
            >
              {formatArea(listing.area_sqm)}
            </span>
          </div>

          {/* Factor badges */}
          <div className="flex flex-wrap" style={{ gap: 4 }}>
            {top.map((b) => (
              <span
                key={b.label}
                className="text-[11px] font-medium rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: "rgba(14,161,88,0.12)",
                  color: "var(--accent-green)",
                }}
              >
                {b.label}
              </span>
            ))}
            {low && (
              <span
                className="text-[11px] font-medium rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: "rgba(207,141,19,0.12)",
                  color: "var(--accent-yellow)",
                }}
              >
                {low.label}
              </span>
            )}
          </div>
        </div>

        {/* Score ring */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <ScoreRing score={listing.total_score} size={52} />
        </div>
      </div>

      {/* Expand button */}
      <div
        className="px-4 pb-3 flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={isExpanded ? onCollapse : onExpand}
          className="text-[13px] font-medium transition-colors"
          style={{ color: "var(--accent-blue)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          {isExpanded ? "Скрыть ↑" : "Почему это место? ↓"}
        </button>
        <span
          className="text-[11px] rounded-full px-2 py-0.5"
          style={{
            backgroundColor: listing.source === "krisha" ? "var(--blue-10)" : "var(--beige-10)",
            color: listing.source === "krisha" ? "var(--accent-blue)" : "var(--neutral-10)",
            fontWeight: 500,
          }}
        >
          {listing.source === "krisha" ? "Krisha.kz" : "OLX.kz"}
        </span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          className="px-4 pb-4 flex flex-col border-t"
          style={{ gap: 14, borderColor: "var(--stroke)" }}
        >
          {/* Explanation */}
          <p
            className="leading-relaxed pt-3"
            style={{ fontSize: 14, color: "var(--neutral-20)" }}
          >
            {listing.explanation}
          </p>

          {/* Score breakdown */}
          <ScoreBreakdown breakdown={listing.score_breakdown} />

          {contactError && (
            <p className="text-[12px]" style={{ color: "#dc2626" }}>
              {contactError}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <button
              type="button"
              onClick={handleContact}
              disabled={contactLoading}
              className="w-full rounded-xl font-semibold transition-opacity"
              style={{
                padding: "10px 14px",
                fontSize: 14,
                backgroundColor: "var(--neutral-30)",
                color: "#fff",
                cursor: contactLoading ? "not-allowed" : "pointer",
                opacity: contactLoading ? 0.7 : 1,
                border: "none",
              }}
            >
              {contactLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block rounded-full border-2 border-white border-t-transparent animate-spin"
                    style={{ width: 12, height: 12 }}
                  />
                  Генерируем письмо...
                </span>
              ) : (
                "Написать арендодателю →"
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShowOnMap();
              }}
              className="w-full rounded-xl font-medium transition-colors"
              style={{
                padding: "8px 14px",
                fontSize: 14,
                backgroundColor: "transparent",
                color: "var(--accent-blue)",
                border: "1.5px solid var(--blue-30)",
                cursor: "pointer",
              }}
            >
              Показать на карте
            </button>

            {listing.external_url && (
              <a
                href={listing.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-[13px] font-medium underline"
                style={{ color: "var(--neutral-10)" }}
                onClick={(e) => e.stopPropagation()}
              >
                Открыть объявление ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
