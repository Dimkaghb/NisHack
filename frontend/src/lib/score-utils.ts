import type { BusinessType, ScoreBreakdown, ScoredListing } from "@/types";

export function scoreToColor(score: number): string {
  if (score >= 70) return "#16a34a"; // green-600
  if (score >= 45) return "#d97706"; // amber-600
  return "#dc2626"; // red-600
}

export function scoreToColorClass(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 45) return "text-amber-600";
  return "text-red-600";
}

const formatter = new Intl.NumberFormat("ru-KZ");

export function formatPrice(tenge: number): string {
  return `${formatter.format(tenge)} ₸/мес`;
}

export function formatArea(sqm: number): string {
  return `${sqm} м²`;
}

export function formatNumber(n: number): string {
  return formatter.format(n);
}

export type FactorKey = keyof ScoreBreakdown;

export const FACTOR_LABELS: Record<FactorKey, string> = {
  footfall: "Трафик",
  competitor: "Конкуренты",
  transit: "Транспорт",
  price: "Цена",
  area: "Площадь",
};

export function getTopFactors(
  breakdown: ScoreBreakdown
): { key: FactorKey; label: string; score: number; isTop: boolean }[] {
  const entries = Object.entries(breakdown) as [FactorKey, number][];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const top2Keys = new Set([sorted[0][0], sorted[1][0]]);
  const lowestEntry = sorted[sorted.length - 1];

  return entries.map(([key, score]) => ({
    key,
    label: FACTOR_LABELS[key],
    score,
    isTop: top2Keys.has(key),
  })).concat(
    lowestEntry[1] < 50
      ? [
          {
            key: lowestEntry[0],
            label: FACTOR_LABELS[lowestEntry[0]],
            score: lowestEntry[1],
            isTop: false,
          },
        ]
      : []
  ).filter(
    (item, index, self) =>
      self.findIndex((i) => i.key === item.key) === index
  );
}

export function getSortedBreakdown(
  breakdown: ScoreBreakdown
): { key: FactorKey; label: string; score: number }[] {
  return (Object.entries(breakdown) as [FactorKey, number][]).map(
    ([key, score]) => ({ key, label: FACTOR_LABELS[key], score })
  );
}

export interface FactorWeight {
  label: string;
  percent: number;
}

export function getWeightsForType(type: BusinessType | null): {
  title: string;
  subtitle?: string;
  weights: FactorWeight[];
} {
  switch (type) {
    case "fastfood":
      return {
        title: "Как мы выбираем лучшее место для кафе",
        weights: [
          { label: "Трафик", percent: 40 },
          { label: "Конкуренты", percent: 25 },
          { label: "Цена", percent: 20 },
          { label: "Транспорт", percent: 10 },
          { label: "Площадь", percent: 5 },
        ],
      };
    case "office":
      return {
        title: "Как мы выбираем лучший офис",
        weights: [
          { label: "Транспорт", percent: 50 },
          { label: "Цена", percent: 30 },
          { label: "Площадь", percent: 10 },
          { label: "Трафик", percent: 5 },
          { label: "Конкуренты", percent: 5 },
        ],
      };
    case "retail":
      return {
        title: "Как мы выбираем лучшее место для магазина",
        weights: [
          { label: "Трафик", percent: 35 },
          { label: "Цена", percent: 20 },
          { label: "Конкуренты", percent: 20 },
          { label: "Транспорт", percent: 15 },
          { label: "Площадь", percent: 10 },
        ],
      };
    case "pharmacy":
      return {
        title: "Как мы выбираем место для аптеки",
        weights: [
          { label: "Трафик", percent: 30 },
          { label: "Транспорт", percent: 25 },
          { label: "Конкуренты", percent: 20 },
          { label: "Цена", percent: 15 },
          { label: "Площадь", percent: 10 },
        ],
      };
    default:
      return {
        title: "Выберите тип бизнеса",
        subtitle:
          "Мы подберём лучшие локации Алматы под ваш запрос — с учётом трафика, конкурентов и транспорта.",
        weights: [],
      };
  }
}

export function getScoreBadges(listing: ScoredListing): {
  top: { label: string }[];
  low: { label: string } | null;
} {
  const entries = Object.entries(listing.score_breakdown) as [
    FactorKey,
    number
  ][];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);

  const top = sorted.slice(0, 2).map(([key]) => ({
    label: `${FACTOR_LABELS[key]} ↑`,
  }));

  const last = sorted[sorted.length - 1];
  const low =
    last[1] < 50 ? { label: `${FACTOR_LABELS[last[0]]} ↓` } : null;

  return { top, low };
}
