"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BusinessType } from "@/types";
import { useLocationIQStore } from "@/store/useLocationIQStore";
import { postSearch } from "@/lib/api";
import { DISTRICT_MAP } from "@/types";
import { formatNumber } from "@/lib/score-utils";

type Step = 1 | 2 | 3;
const TOTAL_STEPS = 3;

const STEP_TITLES: Record<Step, string> = {
  1: "О вашем бизнесе",
  2: "Локация и бюджет",
  3: "Конкуренция",
};

const STEP_SUBTITLES: Record<Step, string> = {
  1: "Расскажите, чем вы занимаетесь",
  2: "Где хотите открыться и сколько готовы платить",
  3: "Насколько важно отсутствие конкурентов поблизости",
};

const BIZ_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: "fastfood", label: "Кафе / Фастфуд" },
  { value: "cafe", label: "Ресторан" },
  { value: "retail", label: "Магазин" },
  { value: "pharmacy", label: "Аптека" },
  { value: "office", label: "Офис" },
];

const DISTRICTS = [
  "Алмалы", "Медеу", "Бостандык", "Алатау",
  "Ауэзов", "Жетысу", "Турксиб", "Наурызбай",
] as const;

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full transition-all"
      style={{
        padding: "10px 20px",
        fontSize: 15,
        fontWeight: active ? 600 : 400,
        border: active
          ? "1.5px solid var(--neutral-30)"
          : "1.5px solid var(--stroke)",
        backgroundColor: active
          ? "var(--neutral-30)"
          : "rgba(255,255,255,0.6)",
        color: active ? "#fff" : "var(--neutral-20)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="font-medium"
      style={{ fontSize: 14, color: "var(--neutral-20)" }}
    >
      {children}
    </label>
  );
}

function OptionalTag() {
  return (
    <span style={{ fontSize: 12, color: "var(--neutral-10)", fontWeight: 400 }}>
      {" "}(необязательно)
    </span>
  );
}

interface QuestionnaireProps {
  onBack: () => void;
}

export function Questionnaire({ onBack }: QuestionnaireProps) {
  const {
    businessType,
    district,
    budgetTenge,
    areaSqmMin,
    competitorTolerance,
    setBusinessType,
    setDistrict,
    setBudget,
    setArea,
    setCompetitorTolerance,
    setSessionId,
    setAppState,
    setLastSearchedParams,
  } = useLocationIQStore();

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [businessDesc, setBusinessDesc] = useState("");
  const [noCompetitorConcern, setNoCompetitorConcern] = useState(false);

  const isOffice = businessType === "office";
  const competitorDisabled = isOffice || noCompetitorConcern;

  const canAdvance = step === 1 ? businessType !== null : true;
  const isLast = step === TOTAL_STEPS;

  function goNext() {
    if (!canAdvance) return;
    if (step < TOTAL_STEPS) setStep((s) => (s + 1) as Step);
  }

  function goPrev() {
    if (step > 1) setStep((s) => (s - 1) as Step);
    else onBack();
  }

  async function handleSubmit() {
    if (!businessType) return;
    setSubmitting(true);
    setError(null);

    const params = JSON.stringify({
      businessType,
      district,
      budgetTenge,
      areaSqmMin,
      competitorTolerance: competitorDisabled ? 0 : competitorTolerance,
    });
    const apiDistrict = district ? (DISTRICT_MAP[district] ?? district) : null;

    try {
      const res = await postSearch({
        business_type: businessType,
        business_name: businessName.trim() || null,
        business_description: businessDesc.trim() || null,
        district: apiDistrict,
        budget_tenge: budgetTenge,
        area_sqm_min: areaSqmMin,
        competitor_tolerance: competitorDisabled ? 0 : competitorTolerance,
      });
      setSessionId(res.session_id);
      setLastSearchedParams(params);
      setAppState("loading");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center flex-1 overflow-y-auto px-6 py-10">
      <div
        className="w-full flex flex-col"
        style={{ maxWidth: 520, gap: 28 }}
      >
        {/* Top row: back + step indicators */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            className="flex items-center gap-1 transition-opacity hover:opacity-60"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--neutral-10)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Назад
          </button>

          {/* Step bar */}
          <div className="flex items-center" style={{ gap: 4 }}>
            {([1, 2, 3] as Step[]).map((s) => (
              <div
                key={s}
                className="rounded-full transition-all"
                style={{
                  width: s === step ? 28 : 8,
                  height: 8,
                  backgroundColor:
                    s < step
                      ? "var(--accent-green)"
                      : s === step
                        ? "var(--neutral-30)"
                        : "var(--stroke)",
                }}
              />
            ))}
          </div>

          <span
            style={{
              fontSize: 13,
              color: "var(--neutral-10)",
              minWidth: 50,
              textAlign: "right",
            }}
          >
            {step} / {TOTAL_STEPS}
          </span>
        </div>

        {/* Title + subtitle */}
        <div className="flex flex-col" style={{ gap: 6 }}>
          <h2
            className="font-semibold tracking-[-0.02em]"
            style={{ fontSize: 24, color: "var(--neutral-30)" }}
          >
            {STEP_TITLES[step]}
          </h2>
          <p style={{ fontSize: 15, color: "var(--neutral-10)", lineHeight: 1.5 }}>
            {STEP_SUBTITLES[step]}
          </p>
        </div>

        {/* Step content with smooth transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            layout
            initial={{ opacity: 0, y: 14, scale: 0.995, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, scale: 0.995, filter: "blur(6px)" }}
            transition={{
              duration: 0.26,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* ── Step 1: Business Info ─────────────────────────────── */}
            {step === 1 && (
              <div className="flex flex-col" style={{ gap: 24 }}>
                {/* Industry */}
                <div className="flex flex-col" style={{ gap: 10 }}>
                  <FieldLabel>Тип бизнеса</FieldLabel>
                  <div className="flex flex-wrap" style={{ gap: 8 }}>
                    {BIZ_OPTIONS.map((o) => (
                      <Pill
                        key={o.value}
                        active={businessType === o.value}
                        onClick={() => setBusinessType(o.value)}
                      >
                        {o.label}
                      </Pill>
                    ))}
                  </div>
                </div>

                {/* Business name — optional, not sent to API */}
                <div className="flex flex-col" style={{ gap: 8 }}>
                  <FieldLabel>
                    Название бизнеса
                    <OptionalTag />
                  </FieldLabel>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Например, «Кофе с собой»"
                    className="w-full rounded-xl"
                    style={{
                      padding: "12px 16px",
                      fontSize: 15,
                      color: "var(--neutral-30)",
                      border: "1.5px solid var(--stroke)",
                      backgroundColor: "rgba(255,255,255,0.6)",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Description — optional, not sent to API */}
                <div className="flex flex-col" style={{ gap: 8 }}>
                  <FieldLabel>
                    Краткое описание
                    <OptionalTag />
                  </FieldLabel>
                  <textarea
                    value={businessDesc}
                    onChange={(e) => setBusinessDesc(e.target.value)}
                    placeholder="Чем занимается ваш бизнес, целевая аудитория..."
                    rows={3}
                    className="w-full rounded-xl resize-none"
                    style={{
                      padding: "12px 16px",
                      fontSize: 15,
                      color: "var(--neutral-30)",
                      border: "1.5px solid var(--stroke)",
                      backgroundColor: "rgba(255,255,255,0.6)",
                      outline: "none",
                      lineHeight: 1.5,
                    }}
                  />
                </div>
              </div>
            )}

            {/* ── Step 2: Location & Budget ────────────────────────── */}
            {step === 2 && (
              <div className="flex flex-col" style={{ gap: 28 }}>
                {/* District */}
                <div className="flex flex-col" style={{ gap: 10 }}>
                  <FieldLabel>Район Алматы</FieldLabel>
                  <div className="flex flex-wrap" style={{ gap: 8 }}>
                    <Pill active={district === null} onClick={() => setDistrict(null)}>
                      Любой район
                    </Pill>
                    {DISTRICTS.map((d) => (
                      <Pill key={d} active={district === d} onClick={() => setDistrict(d)}>
                        {d}
                      </Pill>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div className="flex flex-col" style={{ gap: 10 }}>
                  <FieldLabel>Бюджет аренды</FieldLabel>
                  <span
                    className="font-bold tracking-tight"
                    style={{
                      fontSize: 32,
                      color: "var(--neutral-30)",
                      lineHeight: 1,
                    }}
                  >
                    {formatNumber(budgetTenge)}{" "}
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 500,
                        color: "var(--neutral-10)",
                      }}
                    >
                      ₸/мес
                    </span>
                  </span>
                  <input
                    type="range"
                    min={100000}
                    max={5000000}
                    step={50000}
                    value={budgetTenge}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full accent-neutral-800"
                  />
                  <div className="flex justify-between">
                    <span style={{ fontSize: 12, color: "var(--neutral-10)" }}>
                      100 000 ₸
                    </span>
                    <span style={{ fontSize: 12, color: "var(--neutral-10)" }}>
                      5 000 000 ₸
                    </span>
                  </div>
                </div>

                {/* Area */}
                <div className="flex flex-col" style={{ gap: 8 }}>
                  <FieldLabel>Минимальная площадь</FieldLabel>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={10}
                      max={5000}
                      step={10}
                      value={areaSqmMin}
                      onChange={(e) =>
                        setArea(Math.max(10, Math.round(Number(e.target.value))))
                      }
                      className="w-full rounded-xl"
                      style={{
                        padding: "12px 44px 12px 16px",
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--neutral-30)",
                        border: "1.5px solid var(--stroke)",
                        backgroundColor: "rgba(255,255,255,0.6)",
                        outline: "none",
                      }}
                    />
                    <span
                      className="absolute right-4 font-medium"
                      style={{ fontSize: 14, color: "var(--neutral-10)" }}
                    >
                      м²
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Competition ──────────────────────────────── */}
            {step === 3 && (
              <div className="flex flex-col" style={{ gap: 24 }}>
                {/* Toggle: don't care about competitors */}
                <label
                  className="flex items-center gap-3 cursor-pointer select-none rounded-xl"
                  style={{
                    padding: "14px 16px",
                    backgroundColor: "rgba(255,255,255,0.6)",
                    border: "1.5px solid var(--stroke)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={noCompetitorConcern}
                    onChange={(e) => setNoCompetitorConcern(e.target.checked)}
                    disabled={isOffice}
                    className="accent-neutral-800"
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                  <div className="flex flex-col" style={{ gap: 2 }}>
                    <span
                      className="font-medium"
                      style={{ fontSize: 15, color: "var(--neutral-30)" }}
                    >
                      Конкуренты не важны
                    </span>
                    <span style={{ fontSize: 13, color: "var(--neutral-10)" }}>
                      Не учитывать количество конкурентов при оценке
                    </span>
                  </div>
                </label>

                {/* Competitor slider */}
                <div
                  className="flex flex-col transition-opacity"
                  style={{
                    gap: 10,
                    opacity: competitorDisabled ? 0.35 : 1,
                    pointerEvents: competitorDisabled ? "none" : "auto",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <FieldLabel>Допустимые конкуренты поблизости</FieldLabel>
                    <span
                      className="font-semibold"
                      style={{ fontSize: 15, color: "var(--neutral-30)" }}
                    >
                      {competitorDisabled ? "—" : competitorTolerance}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={competitorTolerance}
                    disabled={competitorDisabled}
                    onChange={(e) =>
                      setCompetitorTolerance(Number(e.target.value))
                    }
                    className="w-full accent-neutral-800 disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-between">
                    <span style={{ fontSize: 12, color: "var(--neutral-10)" }}>
                      0 — нет конкурентов
                    </span>
                    <span style={{ fontSize: 12, color: "var(--neutral-10)" }}>
                      10 — не важно
                    </span>
                  </div>
                </div>

                {isOffice && (
                  <p style={{ fontSize: 13, color: "var(--neutral-10)" }}>
                    Для офисных помещений конкуренция не учитывается.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 14, color: "#dc2626" }}>{error}</p>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={isLast ? handleSubmit : goNext}
          disabled={!canAdvance || submitting}
          className="w-full flex items-center justify-center gap-2 font-semibold transition-opacity hover:opacity-85"
          style={{
            padding: "16px 24px",
            fontSize: 16,
            backgroundColor: !canAdvance
              ? "rgba(26,22,21,0.12)"
              : "var(--neutral-30)",
            color: "#fff",
            borderRadius: 100,
            border: "none",
            cursor: !canAdvance ? "not-allowed" : "pointer",
            opacity: !canAdvance ? 0.5 : 1,
          }}
        >
          {submitting ? (
            <span
              className="inline-block rounded-full border-2 border-white border-t-transparent animate-spin"
              style={{ width: 16, height: 16 }}
            />
          ) : isLast ? (
            "Найти локации"
          ) : (
            "Далее"
          )}
        </button>
      </div>
    </div>
  );
}
