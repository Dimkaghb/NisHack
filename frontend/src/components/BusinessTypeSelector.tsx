"use client";

import type { BusinessType } from "@/types";

interface Tile {
  value: BusinessType;
  label: string;
  icon: React.ReactNode;
}

const TILES: Tile[] = [
  {
    value: "fastfood",
    label: "Кафе / Фастфуд",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    value: "office",
    label: "Офис",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    value: "retail",
    label: "Магазин",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l1-4h16l1 4" />
        <path d="M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" />
        <line x1="9" y1="15" x2="9" y2="21" />
        <line x1="15" y1="15" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    value: "pharmacy",
    label: "Аптека",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    value: "other",
    label: "Другое",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

interface BusinessTypeSelectorProps {
  value: BusinessType | null;
  onChange: (v: BusinessType) => void;
}

export function BusinessTypeSelector({
  value,
  onChange,
}: BusinessTypeSelectorProps) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <label
        className="text-[13px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--neutral-10)" }}
      >
        Тип бизнеса
      </label>
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}
      >
        {TILES.map((tile) => {
          const active = value === tile.value;
          return (
            <button
              key={tile.value}
              type="button"
              onClick={() => onChange(tile.value)}
              className="flex flex-col items-center justify-center rounded-xl transition-all"
              style={{
                padding: "10px 6px",
                gap: 5,
                border: active
                  ? "2px solid var(--accent-blue)"
                  : "2px solid var(--stroke)",
                backgroundColor: active
                  ? "var(--blue-10)"
                  : "rgba(255,255,255,0.72)",
                color: active ? "var(--accent-blue)" : "var(--neutral-20)",
                cursor: "pointer",
              }}
            >
              {tile.icon}
              <span
                className="text-center leading-tight"
                style={{
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  lineHeight: 1.3,
                }}
              >
                {tile.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
