"use client";

/* Framer source: nodeId fPz22UEQX (Pricing)
   Section eyebrow="PRICING" | Heading 2 "Simple plans for serious work"
   MainCards: 3-col horizontal, gap=12, stackAlignment="end" (bottom-aligned)
   PricingCard Default: width=341, padding=32, gap=32, radius=24, white bg
   PricingCard Highlighted: same + border=5px solid /Blue 30 (rgb 132,185,239)
     Highlighted card has the Tabs (Annually/Monthly) toggle AT TOP
     So highlighted card is taller (toggle adds ~72px at top)
   Cards: Basic (Free, solo), Premium (highlighted, $189/mo), Enterprise (Flexible, team)
   CTA labels: "Try Freelio free" | "Get started" (dark pill) | "Contact sales"
   Tabs component: pill tabs, active=white elevated, inactive=transparent */

import { useState } from "react";
import { LogosTicker } from "./LogosTicker";
import { FadeUp, StaggerGroup, StaggerItem } from "./motion";

type Billing = "annually" | "monthly";

const BASIC_FEATURES = [
  "Быстрый подбор локаций по вашему запросу",
  "До 5 лучших мест в выдаче",
  "Сводка факторов (трафик, конкуренты, транспорт)",
  "Черновик письма арендодателю",
  "Подбор по району и бюджету"
];

const PREMIUM_FEATURES = [
  "Всё из Базового",
  "Расширенный рейтинг и подробный разбор",
  "Уточнение по конкуренции",
  "Обновление подборки при изменении параметров",
  "Приоритетная генерация письма арендодателю"
];

const ENTERPRISE_FEATURES = [
  "Всё из Премиум",
  "Подбор для нескольких точек бизнеса",
  "Командный доступ",
  "API для интеграций и автоматизации",
  "Техническая поддержка"
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="8" fill="rgb(14,161,88)" fillOpacity="0.12" />
      <path
        d="M4.5 8.25l2.25 2.25 4.75-5"
        stroke="rgb(14,161,88)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Billing toggle — placed INSIDE the highlighted card ── */
function BillingToggle({
  billing,
  onChange,
}: {
  billing: Billing;
  onChange: (b: Billing) => void;
}) {
  const labelByBilling: Record<Billing, string> = {
    annually: "Ежегодно",
    monthly: "Ежемесячно",
  };

  return (
    <div
      className="flex items-center p-1 self-stretch"
      style={{
        backgroundColor: "rgba(255,255,255,0.55)",
        borderRadius: 100,
        gap: 0,
      }}
    >
      {(["annually", "monthly"] as Billing[]).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="flex-1 font-semibold text-[14px] leading-[1.2] transition-all"
          style={{
            padding: "10px 20px",
            borderRadius: 100,
            color:
              billing === opt ? "var(--neutral-30)" : "var(--neutral-10)",
            backgroundColor:
              billing === opt ? "#ffffff" : "transparent",
            boxShadow:
              billing === opt
                ? "0 1px 4px rgba(0,0,0,0.12)"
                : "none",
          }}
        >
          {labelByBilling[opt]}
        </button>
      ))}
    </div>
  );
}

/* ── Default pricing card ── */
function DefaultCard({
  label,
  name,
  price,
  desc,
  features,
  cta,
}: {
  label: string;
  name: string;
  price: string;
  desc: string;
  features: string[];
  cta: string;
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        width: "100%",
        maxWidth: 341,
        padding: 32,
        gap: 32,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.72)",
      }}
    >
      {/* Plan label + price */}
      <div className="flex flex-col" style={{ gap: 8 }}>
        <span
          className="text-[14px] font-medium leading-[1.4]"
          style={{ color: "var(--neutral-20)" }}
        >
          {label}
        </span>
        <div
          className="font-semibold leading-[110%] tracking-[-0.03em]"
          style={{ fontSize: "clamp(36px, 4vw, 52px)", color: "var(--neutral-30)" }}
        >
          {price}
        </div>
        <p
          className="text-[15px] leading-[150%]"
          style={{ color: "var(--neutral-20)" }}
        >
          {desc}
        </p>
      </div>

      {/* Feature list */}
      <ul className="flex flex-col" style={{ gap: 12 }}>
        {features.map((f) => (
          <li key={f} className="flex items-center gap-3 text-[15px] leading-[1.4]"
            style={{ color: "var(--neutral-20)" }}>
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA — secondary style */}
      <button
        className="w-full font-semibold text-[15px] leading-[1.2] transition-colors hover:bg-black/5"
        style={{
          padding: "16px 24px",
          borderRadius: 100,
          backgroundColor: "rgba(26,22,21,0.07)",
          color: "var(--neutral-30)",
          marginTop: "auto",
        }}
      >
        {cta}
      </button>
    </div>
  );
}

/* ── Highlighted (Premium) pricing card — has toggle at top ── */
function HighlightedCard({
  billing,
  onBillingChange,
}: {
  billing: Billing;
  onBillingChange: (b: Billing) => void;
}) {
  const annual = billing === "annually";
  const price = annual ? "39 000 ₸/мес" : "49 000 ₸/мес";

  return (
    <div
      className="flex flex-col"
      style={{
        width: "100%",
        maxWidth: 341,
        padding: 32,
        gap: 32,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.72)",
        border: "5px solid var(--blue-30)",
      }}
    >
      {/* Toggle lives inside this card at the very top */}
      <BillingToggle billing={billing} onChange={onBillingChange} />

      {/* Plan label + save badge + price */}
      <div className="flex flex-col" style={{ gap: 8 }}>
        <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
          <span
            className="text-[14px] font-medium leading-[1.4]"
            style={{ color: "var(--neutral-20)" }}
          >
              Aimaq Премиум
          </span>
          {annual && (
            <span
              className="text-[12px] font-semibold leading-[1.2] px-3 py-1"
              style={{
                borderRadius: 100,
                backgroundColor: "rgba(14,161,88,0.1)",
                color: "var(--accent-green)",
                border: "1px solid rgba(14,161,88,0.25)",
              }}
            >
                Сэкономьте 20%
            </span>
          )}
        </div>
        <div
          className="font-semibold leading-[110%] tracking-[-0.03em]"
          style={{ fontSize: "clamp(36px, 4vw, 52px)", color: "var(--neutral-30)" }}
        >
          {price}
        </div>
        <p
          className="text-[15px] leading-[150%]"
          style={{ color: "var(--neutral-20)" }}
        >
          Для регулярного подбора и подробного объяснения факторов.
        </p>
      </div>

      {/* Feature list */}
      <ul className="flex flex-col" style={{ gap: 12 }}>
        {PREMIUM_FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-3 text-[15px] leading-[1.4]"
            style={{ color: "var(--neutral-20)" }}>
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA — primary dark pill */}
      <button
        className="w-full font-semibold text-[15px] text-white leading-[1.2] transition-opacity hover:opacity-85"
        style={{
          padding: "16px 24px",
          borderRadius: 100,
          backgroundColor: "var(--neutral-30)",
          marginTop: "auto",
        }}
      >
        Начать
      </button>
    </div>
  );
}

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("annually");

  return (
    <section className="w-full flex flex-col items-center px-6" style={{ gap: 60 }}>
      {/* Header */}
      <FadeUp className="flex flex-col items-center text-center" style={{ gap: 12 }}>
        <span
          className="text-[13px] font-semibold tracking-[0.12em] uppercase"
          style={{ color: "var(--neutral-10)" }}
        >
          Тарифы
        </span>
        <h2
          className="font-semibold leading-[115%] tracking-[-0.03em]"
          style={{
            fontSize: "clamp(32px, 4.5vw, 52px)",
            color: "var(--neutral-30)",
            maxWidth: 560,
          }}
        >
          Тарифы для подбора локаций
        </h2>
      </FadeUp>

      {/* Cards — staggered, bottom-aligned */}
      <StaggerGroup
        className="w-full flex flex-wrap justify-center items-end"
        style={{ maxWidth: 1072, gap: 12 }}
      >
        <StaggerItem style={{ flex: "1 1 280px", maxWidth: 341 }}>
          <DefaultCard
            label="Aimaq Базовый"
            name="Basic"
            price="Бесплатно"
            desc="Для первого подбора локаций: быстрый рейтинг и понятные пояснения."
            features={BASIC_FEATURES}
            cta="Начать подбор"
          />
        </StaggerItem>

        <StaggerItem style={{ flex: "1 1 280px", maxWidth: 341 }}>
          <HighlightedCard billing={billing} onBillingChange={setBilling} />
        </StaggerItem>

        <StaggerItem style={{ flex: "1 1 280px", maxWidth: 341 }}>
          <DefaultCard
            label="Aimaq Корпоративный"
            name="Enterprise"
            price="Гибкий"
            desc="Для бизнеса с несколькими точками и расширенными подборками."
            features={ENTERPRISE_FEATURES}
            cta="Запросить условия"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Repeated LogosTicker at bottom */}
      <div className="w-full">
        <LogosTicker />
      </div>
    </section>
  );
}
