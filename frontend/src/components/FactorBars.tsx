"use client";

import type { BusinessType } from "@/types";
import { getWeightsForType } from "@/lib/score-utils";

interface FactorBarsProps {
  businessType: BusinessType | null;
}

export function FactorBars({ businessType }: FactorBarsProps) {
  const { title, subtitle, weights } = getWeightsForType(businessType);

  return (
    <div
      className="rounded-2xl p-5 flex flex-col"
      style={{
        backgroundColor: "rgba(255,255,255,0.72)",
        gap: 16,
      }}
    >
      <div className="flex flex-col" style={{ gap: 4 }}>
        <h3
          className="font-semibold leading-snug"
          style={{ fontSize: 16, color: "var(--neutral-30)" }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            className="leading-relaxed"
            style={{ fontSize: 14, color: "var(--neutral-10)" }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {weights.length > 0 && (
        <div className="flex flex-col" style={{ gap: 10 }}>
          {weights.map(({ label, percent }) => (
            <div key={label} className="flex flex-col" style={{ gap: 4 }}>
              <div className="flex items-center justify-between">
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "var(--neutral-20)" }}
                >
                  {label}
                </span>
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: "var(--neutral-30)" }}
                >
                  {percent}%
                </span>
              </div>
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: 6, backgroundColor: "rgb(228,226,226)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: "var(--accent-blue)",
                    transition: "width 300ms ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {weights.length === 0 && !subtitle && (
        <div
          className="flex flex-col items-center justify-center py-6"
          style={{ gap: 8 }}
        >
          <span style={{ fontSize: 32 }}>🗺️</span>
          <p
            className="text-center leading-relaxed"
            style={{ fontSize: 14, color: "var(--neutral-10)" }}
          >
            Мы подберём лучшие локации Алматы под ваш запрос — с учётом трафика, конкурентов и транспорта.
          </p>
        </div>
      )}
    </div>
  );
}
