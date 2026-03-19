"use client";

import type { ScoreBreakdown as ScoreBreakdownType } from "@/types";
import { getSortedBreakdown, scoreToColor } from "@/lib/score-utils";

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType;
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const factors = getSortedBreakdown(breakdown);

  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      {factors.map(({ key, label, score }) => (
        <div key={key} className="flex flex-col" style={{ gap: 4 }}>
          <div className="flex items-center justify-between">
            <span
              className="text-[13px] font-medium"
              style={{ color: "var(--neutral-20)" }}
            >
              {label}
            </span>
            <span
              className="text-[13px] font-semibold"
              style={{ color: scoreToColor(score) }}
            >
              {score}
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 6, backgroundColor: "rgb(228,226,226)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${score}%`,
                backgroundColor: scoreToColor(score),
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
