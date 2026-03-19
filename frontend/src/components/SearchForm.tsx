"use client";

import { useState } from "react";
import { BusinessTypeSelector } from "./BusinessTypeSelector";
import { useLocationIQStore } from "@/store/useLocationIQStore";
import { postSearch } from "@/lib/api";
import { formatNumber } from "@/lib/score-utils";
import { DISTRICT_MAP } from "@/types";

const DISTRICTS = [
  "Любой",
  "Алмалы",
  "Медеу",
  "Бостандык",
  "Алатау",
  "Ауэзов",
  "Жетысу",
  "Турксиб",
  "Наурызбай",
] as const;

export function SearchForm() {
  const {
    appState,
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
    setAppState,
    setSessionId,
    resetSearch,
    setLastSearchedParams,
  } = useLocationIQStore();

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLoading = appState === "loading";
  const isOffice = businessType === "office";

  const selectedDistrict = district ?? "Любой";

  function handleDistrictClick(d: string) {
    if (d === "Любой") {
      setDistrict(null);
    } else {
      setDistrict(d);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessType) return;

    setError(null);
    setSubmitting(true);

    const params = JSON.stringify({
      businessType,
      district,
      budgetTenge,
      areaSqmMin,
      competitorTolerance,
    });

    try {
      // Map Russian district name to English for the API
      const apiDistrict = district ? (DISTRICT_MAP[district] ?? district) : null;

      const res = await postSearch({
        business_type: businessType,
        business_name: null,
        business_description: null,
        district: apiDistrict,
        budget_tenge: budgetTenge,
        area_sqm_min: areaSqmMin,
        competitor_tolerance: isOffice ? 0 : competitorTolerance,
      });
      setSessionId(res.session_id);
      setLastSearchedParams(params);
      setAppState("loading");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Произошла ошибка. Попробуйте снова.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    resetSearch();
  }

  const budgetFormatted = formatNumber(budgetTenge);
  const submitDisabled = !businessType || submitting || isLoading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full" style={{ gap: 20 }}>
      <BusinessTypeSelector value={businessType} onChange={setBusinessType} />

      {/* District */}
      <div className="flex flex-col" style={{ gap: 8 }}>
        <label
          className="text-[13px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--neutral-10)" }}
        >
          Район Алматы
        </label>
        <div className="flex flex-wrap" style={{ gap: 5 }}>
          {DISTRICTS.map((d) => {
            const active =
              d === "Любой" ? selectedDistrict === "Любой" : selectedDistrict === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => handleDistrictClick(d)}
                className="rounded-full transition-all"
                style={{
                  padding: "5px 11px",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  border: active
                    ? "1.5px solid var(--accent-blue)"
                    : "1.5px solid var(--stroke)",
                  backgroundColor: active ? "var(--blue-10)" : "rgba(255,255,255,0.72)",
                  color: active ? "var(--accent-blue)" : "var(--neutral-20)",
                  cursor: "pointer",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget */}
      <div className="flex flex-col" style={{ gap: 8 }}>
        <div className="flex items-center justify-between">
          <label
            className="text-[13px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--neutral-10)" }}
          >
            Бюджет аренды
          </label>
          <span
            className="text-[14px] font-semibold"
            style={{ color: "var(--neutral-30)" }}
          >
            {budgetFormatted} ₸/мес
          </span>
        </div>
        <input
          type="range"
          min={100000}
          max={5000000}
          step={50000}
          value={budgetTenge}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between">
          <span className="text-[12px]" style={{ color: "var(--neutral-10)" }}>
            100 000 ₸
          </span>
          <span className="text-[12px]" style={{ color: "var(--neutral-10)" }}>
            5 000 000 ₸
          </span>
        </div>
      </div>

      {/* Area */}
      <div className="flex flex-col" style={{ gap: 8 }}>
        <label
          className="text-[13px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--neutral-10)" }}
        >
          Минимальная площадь
        </label>
        <div className="relative flex items-center">
          <input
            type="number"
            min={10}
            max={5000}
            step={1}
            value={areaSqmMin}
            onChange={(e) => setArea(Math.round(Number(e.target.value)))}
            placeholder="50"
            className="w-full rounded-xl pr-10 transition-all"
            style={{
              padding: "10px 12px",
              fontSize: 14,
              border: "1.5px solid var(--stroke)",
              backgroundColor: "rgba(255,255,255,0.72)",
              color: "var(--neutral-30)",
              outline: "none",
            }}
          />
          <span
            className="absolute right-3 text-[13px]"
            style={{ color: "var(--neutral-10)" }}
          >
            м²
          </span>
        </div>
      </div>

      {/* Competitor tolerance */}
      <div
        className="flex flex-col"
        style={{ gap: 8, opacity: isOffice ? 0.5 : 1 }}
      >
        <div className="flex items-center justify-between">
          <label
            className="text-[13px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--neutral-10)" }}
          >
            Допустимые конкуренты
          </label>
          <span
            className="text-[14px] font-semibold"
            style={{ color: "var(--neutral-30)" }}
          >
            {competitorTolerance}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={competitorTolerance}
          onChange={(e) => setCompetitorTolerance(Number(e.target.value))}
          disabled={isOffice}
          className="w-full accent-blue-600 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between">
          <span className="text-[12px]" style={{ color: "var(--neutral-10)" }}>
            Нет конкурентов
          </span>
          <span className="text-[12px]" style={{ color: "var(--neutral-10)" }}>
            Не важно
          </span>
        </div>
        {isOffice && (
          <p className="text-[12px]" style={{ color: "var(--neutral-10)" }}>
            Для офиса конкуренты не важны
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <p
          className="text-[13px] rounded-lg px-3 py-2"
          style={{ color: "#dc2626", backgroundColor: "rgba(220,38,38,0.08)" }}
        >
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitDisabled}
        className="w-full rounded-xl font-semibold transition-opacity"
        style={{
          padding: "12px 16px",
          fontSize: 15,
          backgroundColor: submitDisabled ? "rgba(26,22,21,0.15)" : "var(--neutral-30)",
          color: "#fff",
          cursor: submitDisabled ? "not-allowed" : "pointer",
          opacity: submitDisabled ? 0.6 : 1,
        }}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className="inline-block rounded-full border-2 border-white border-t-transparent animate-spin"
              style={{ width: 14, height: 14 }}
            />
            Отправляем...
          </span>
        ) : (
          "Найти локации →"
        )}
      </button>

      {/* Cancel during loading */}
      {isLoading && (
        <button
          type="button"
          onClick={handleCancel}
          className="w-full rounded-xl font-medium transition-colors"
          style={{
            padding: "10px 16px",
            fontSize: 14,
            backgroundColor: "rgba(220,38,38,0.08)",
            color: "#dc2626",
            border: "1.5px solid rgba(220,38,38,0.2)",
            cursor: "pointer",
          }}
        >
          Отменить
        </button>
      )}
    </form>
  );
}
