"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchPolling } from "@/hooks/useSearchPolling";
import type { SourceStatus } from "@/types";

// ── Step definitions ─────────────────────────────────────────────────────────

interface StepDef {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  icon: React.ReactNode;
}

const STEPS: StepDef[] = [
  {
    id: "planning",
    title: "Планирование",
    subtitle: "Анализируем запрос",
    detail: "Определяем стратегию поиска, весовые коэффициенты и параметры фильтрации",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "fetching",
    title: "Поиск объявлений",
    subtitle: "Сканируем открытые площадки",
    detail: "Загружаем коммерческие помещения по вашим параметрам",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    id: "enriching",
    title: "Обогащение данных",
    subtitle: "Трафик · Конкуренты · Транспорт",
    detail: "Три агента параллельно оценивают пешеходный поток, плотность конкурентов и доступность транспорта",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    id: "scoring",
    title: "Оценка",
    subtitle: "Рассчитываем рейтинг",
    detail: "Взвешиваем все параметры для вашего типа бизнеса и формируем итоговый балл",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    id: "validating",
    title: "Валидация",
    subtitle: "Проверяем результаты",
    detail: "Убеждаемся, что все данные корректны и актуальны перед финальным отчётом",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "explaining",
    title: "Объяснение",
    subtitle: "AI формирует рекомендации",
    detail: "Claude анализирует топ-локации и пишет развёрнутое обоснование на русском языке",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 9h8M8 13h4" />
      </svg>
    ),
  },
];

// ── Status → step index mapping ──────────────────────────────────────────────

type StepStatus = "pending" | "active" | "done";

function getStepStatuses(pipelineStatus: string | null): StepStatus[] {
  const statuses: StepStatus[] = Array(STEPS.length).fill("pending");

  const statusOrder = ["planning", "fetching", "enriching", "scoring", "validating", "explaining"];
  const idx = statusOrder.indexOf(pipelineStatus ?? "");

  if (pipelineStatus === "complete") {
    statuses.fill("done");
    return statuses;
  }

  if (idx === -1) {
    if (pipelineStatus === "pending") statuses[0] = "active";
    return statuses;
  }

  for (let i = 0; i < idx; i++) statuses[i] = "done";
  statuses[idx] = "active";

  return statuses;
}

// ── Animated dots ────────────────────────────────────────────────────────────

function PulseDots() {
  return (
    <span className="inline-flex items-center" style={{ gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: 4,
            height: 4,
            backgroundColor: "var(--accent-blue)",
            opacity: 0.4,
            animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

// ── Source status icon ───────────────────────────────────────────────────────

function SourceIcon({ status }: { status: SourceStatus["status"] }) {
  if (status === "done") {
    return (
      <svg width="12" height="12" fill="none" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
        <path d="M2 6l3 3 5-5" stroke="var(--accent-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "active") {
    return (
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          border: "1.5px solid var(--accent-blue)",
          borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
    );
  }
  if (status === "error") {
    return (
      <svg width="12" height="12" fill="none" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
        <path d="M3 3l6 6M9 3l-6 6" stroke="var(--accent-orange)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <span
      className="rounded-full"
      style={{
        width: 6,
        height: 6,
        backgroundColor: "var(--neutral-10)",
        opacity: 0.3,
        flexShrink: 0,
      }}
    />
  );
}

// ── Sources list (shown inside fetching step) ────────────────────────────────

function SourcesList({ sources }: { sources: SourceStatus[] }) {
  return (
    <div className="flex flex-col" style={{ gap: 6, paddingLeft: 44, marginTop: 8 }}>
      {sources.map((src) => (
        <div
          key={src.id}
          className="flex items-center"
          style={{
            gap: 8,
            opacity: src.status === "pending" ? 0.5 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          <SourceIcon status={src.status} />
          <span
            style={{
              fontSize: 12,
              color: src.status === "active"
                ? "var(--neutral-30)"
                : src.status === "done"
                  ? "var(--neutral-20)"
                  : "var(--neutral-10)",
              fontWeight: src.status === "active" ? 500 : 400,
              transition: "color 0.3s ease",
            }}
          >
            {src.label}
          </span>
          {src.status === "done" && src.count > 0 && (
            <span
              className="rounded-full"
              style={{
                fontSize: 10,
                color: "var(--accent-green)",
                backgroundColor: "rgba(22,163,74,0.08)",
                padding: "1px 7px",
                fontWeight: 600,
              }}
            >
              {src.count}
            </span>
          )}
          {src.status === "active" && <PulseDots />}
        </div>
      ))}
    </div>
  );
}

// ── Step row ─────────────────────────────────────────────────────────────────

function StepRow({
  step,
  status,
  children,
}: {
  step: StepDef;
  status: StepStatus;
  children?: React.ReactNode;
}) {
  const isActive = status === "active";
  const isDone = status === "done";
  const hasChildren = !!children;

  return (
    <div
      className="flex flex-col rounded-2xl transition-all"
      style={{
        padding: isActive ? "14px 16px" : "10px 16px",
        backgroundColor: isActive
          ? "rgba(59,130,246,0.05)"
          : "transparent",
        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div className="flex items-center" style={{ gap: 12 }}>
        {/* Icon / check */}
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0 transition-all"
          style={{
            width: 32,
            height: 32,
            backgroundColor: isDone
              ? "var(--accent-green)"
              : isActive
                ? "var(--accent-blue)"
                : "var(--beige-20)",
            color: isDone || isActive ? "#fff" : "var(--neutral-10)",
            transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {isDone ? (
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
              <path
                d="M2.5 7l3.5 3.5 5.5-5.5"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : isActive ? (
            <span
              className="flex items-center justify-center"
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.4)",
                borderTopColor: "#fff",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            step.icon
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span
              className="font-semibold leading-tight"
              style={{
                fontSize: 14,
                color: isDone
                  ? "var(--neutral-20)"
                  : isActive
                    ? "var(--neutral-30)"
                    : "var(--neutral-10)",
                transition: "color 0.3s ease",
              }}
            >
              {step.title}
            </span>
            {isActive && !hasChildren && <PulseDots />}
          </div>
          <span
            style={{
              fontSize: 12,
              color: isActive ? "var(--neutral-20)" : "var(--neutral-10)",
              lineHeight: 1.4,
              transition: "color 0.3s ease",
            }}
          >
            {step.subtitle}
          </span>
        </div>

        {/* Check for done */}
        {isDone && (
          <svg
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 14 14"
            style={{ flexShrink: 0, opacity: 0.4 }}
          >
            <path
              d="M2.5 7l3.5 3.5 5.5-5.5"
              stroke="var(--accent-green)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Expanded detail or children for active step */}
      <div
        style={{
          maxHeight: isActive ? 300 : 0,
          opacity: isActive ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {hasChildren ? (
          children
        ) : (
          <p
            style={{
              fontSize: 12,
              color: "var(--neutral-10)",
              lineHeight: 1.5,
              marginTop: 6,
              paddingLeft: 44,
            }}
          >
            {step.detail}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ statuses }: { statuses: StepStatus[] }) {
  const doneCount = statuses.filter((s) => s === "done").length;
  const activeCount = statuses.filter((s) => s === "active").length;
  const progress = ((doneCount + activeCount * 0.5) / statuses.length) * 100;

  return (
    <div
      className="rounded-full overflow-hidden"
      style={{
        height: 4,
        backgroundColor: "var(--beige-20)",
      }}
    >
      <div
        className="rounded-full"
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, var(--accent-blue), var(--accent-green))",
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function PipelineProgress() {
  const { data } = useSearchPolling();
  const pipelineStatus = data?.status ?? null;
  const statusMeta = data?.status_meta ?? null;
  const stepStatuses = getStepStatuses(pipelineStatus);

  const [elapsed, setElapsed] = useState(0);
  const prevStatusRef = useRef(pipelineStatus);

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    prevStatusRef.current = pipelineStatus;
  }, [pipelineStatus]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const errorMessage = data?.error_message;
  const doneCount = stepStatuses.filter((s) => s === "done").length;
  const isComplete = pipelineStatus === "complete";

  // Sources from status_meta (shown during fetching step)
  const sources: SourceStatus[] | null = statusMeta?.sources ?? null;

  return (
    <div className="flex flex-col" style={{ gap: 20, padding: "24px 20px" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col" style={{ gap: 4 }}>
          <h3
            className="font-semibold"
            style={{ fontSize: 17, color: "var(--neutral-30)" }}
          >
            {isComplete ? "Готово!" : "Анализируем рынок"}
          </h3>
          <p style={{ fontSize: 12, color: "var(--neutral-10)" }}>
            {isComplete
              ? "Подготавливаем результаты…"
              : `Шаг ${doneCount + 1} из ${STEPS.length} · ~30–60 сек`}
          </p>
        </div>
        <span
          className="font-mono"
          style={{
            fontSize: 13,
            color: "var(--neutral-10)",
            backgroundColor: "var(--beige-10)",
            padding: "4px 10px",
            borderRadius: 100,
          }}
        >
          {timeStr}
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar statuses={stepStatuses} />

      {/* Steps — always visible, overlay when complete */}
      <div className="relative">
        <div className="flex flex-col" style={{ gap: 2 }}>
          {STEPS.map((step, i) => {
            const isFetchingActive = step.id === "fetching" && stepStatuses[i] === "active";
            const isFetchingDone = step.id === "fetching" && stepStatuses[i] === "done";

            return (
              <StepRow key={step.id} step={step} status={stepStatuses[i]}>
                {/* Show live sources list during fetching */}
                {(isFetchingActive || isFetchingDone) && sources && sources.length > 0
                  ? <SourcesList sources={sources} />
                  : undefined}
              </StepRow>
            );
          })}
        </div>

        {/* Frosted overlay + preparing text when complete */}
        {isComplete && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl"
            style={{
              backgroundColor: "rgba(249, 248, 248, 0.82)",
              backdropFilter: "blur(3px)",
              transition: "opacity 0.5s ease",
            }}
          >
            <div className="flex items-center" style={{ gap: 10 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid var(--neutral-10)",
                  borderTopColor: "transparent",
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span
                className="font-medium"
                style={{ fontSize: 15, color: "var(--neutral-20)" }}
              >
                Подготавливаем результаты…
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {errorMessage && (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            fontSize: 13,
            color: "var(--accent-orange)",
            backgroundColor: "rgba(234,88,12,0.06)",
            border: "1px solid rgba(234,88,12,0.15)",
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
