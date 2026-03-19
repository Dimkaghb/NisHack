"use client";

import { useEffect, useState } from "react";
import { useSearchPolling } from "@/hooks/useSearchPolling";

const STEPS = [
  "Загружаем объявления с Krisha.kz",
  "Загружаем объявления с OLX.kz",
  "Считаем трафик",
  "Проверяем конкурентов",
  "Оцениваем транспорт",
  "Формируем рейтинг",
];

type StepStatus = "pending" | "active" | "done";

function getStepStatuses(pipelineStatus: string | null): StepStatus[] {
  const statuses: StepStatus[] = Array(STEPS.length).fill("pending");

  switch (pipelineStatus) {
    case "fetching":
      statuses[0] = "active";
      statuses[1] = "active";
      break;
    case "footfall":
      statuses[0] = "done";
      statuses[1] = "done";
      statuses[2] = "active";
      break;
    case "competitors":
      statuses[0] = "done";
      statuses[1] = "done";
      statuses[2] = "done";
      statuses[3] = "active";
      break;
    case "transit":
      statuses[0] = "done";
      statuses[1] = "done";
      statuses[2] = "done";
      statuses[3] = "done";
      statuses[4] = "active";
      break;
    case "scoring":
      statuses[0] = "done";
      statuses[1] = "done";
      statuses[2] = "done";
      statuses[3] = "done";
      statuses[4] = "done";
      statuses[5] = "active";
      break;
    case "complete":
      statuses.fill("done");
      break;
    default:
      if (pipelineStatus === "pending") {
        statuses[0] = "active";
      }
  }

  return statuses;
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <span
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 22,
          height: 22,
          backgroundColor: "var(--accent-green)",
        }}
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
          <path
            d="M2 6l3 3 5-5"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (status === "active") {
    return (
      <span
        className="flex items-center justify-center rounded-full flex-shrink-0 pipeline-spinner"
        style={{
          width: 22,
          height: 22,
          border: "2.5px solid var(--accent-blue)",
          borderTopColor: "transparent",
        }}
      />
    );
  }

  return (
    <span
      className="flex-shrink-0 rounded-full"
      style={{
        width: 22,
        height: 22,
        border: "2px solid rgb(228,226,226)",
        display: "inline-block",
      }}
    />
  );
}

export function PipelineProgress() {
  const { data } = useSearchPolling();
  const pipelineStatus = data?.status ?? null;
  const stepStatuses = getStepStatuses(pipelineStatus);

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const errorMessage = data?.error_message;

  return (
    <div className="flex flex-col p-5" style={{ gap: 20 }}>
      <div className="flex flex-col" style={{ gap: 6 }}>
        <h3
          className="font-semibold"
          style={{ fontSize: 16, color: "var(--neutral-30)" }}
        >
          Анализируем рынок
        </h3>
        <p style={{ fontSize: 13, color: "var(--neutral-10)" }}>
          Это занимает около 30–60 секунд
        </p>
      </div>

      <div className="flex flex-col" style={{ gap: 12 }}>
        {STEPS.map((label, i) => {
          const status = stepStatuses[i];
          return (
            <div key={i} className="flex items-center" style={{ gap: 10 }}>
              <StepIcon status={status} />
              <span
                className="text-[14px] leading-snug"
                style={{
                  color:
                    status === "done"
                      ? "var(--accent-green)"
                      : status === "active"
                      ? "var(--neutral-30)"
                      : "var(--neutral-10)",
                  fontWeight: status === "active" ? 500 : 400,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <p
          className="text-[13px] rounded-lg px-3 py-2"
          style={{
            color: "#dc2626",
            backgroundColor: "rgba(220,38,38,0.08)",
          }}
        >
          {errorMessage}
        </p>
      )}

      <div className="flex items-center justify-center pt-2">
        <span
          className="font-mono text-[13px]"
          style={{ color: "var(--neutral-10)" }}
        >
          {timeStr}
        </span>
      </div>
    </div>
  );
}
