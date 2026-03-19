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
  "Unlimited projects",
  "Unlimited clients",
  "Time tracking",
  "CRM",
  "iOS & Android app",
];

const PREMIUM_FEATURES = [
  "Everything in Basic",
  "Invoices & payments",
  "Expense tracking",
  "Income tracking",
  "Scheduling",
];

const ENTERPRISE_FEATURES = [
  "Everything in Premium",
  "Custom data import",
  "Advanced onboarding",
  "Hubspot integration",
  "Timesheets",
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
          className="flex-1 font-semibold text-[14px] leading-[1.2] capitalize transition-all"
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
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
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
  const price  = annual ? "$189/mo" : "$229/mo";

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
            Aimaq Premium
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
              Save 20%
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
          For pro use with light needs.
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
        Get started
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
          Pricing
        </span>
        <h2
          className="font-semibold leading-[115%] tracking-[-0.03em]"
          style={{
            fontSize: "clamp(32px, 4.5vw, 52px)",
            color: "var(--neutral-30)",
            maxWidth: 560,
          }}
        >
          Simple plans for serious work
        </h2>
      </FadeUp>

      {/* Cards — staggered, bottom-aligned */}
      <StaggerGroup
        className="w-full flex flex-wrap justify-center items-end"
        style={{ maxWidth: 1072, gap: 12 }}
      >
        <StaggerItem style={{ flex: "1 1 280px", maxWidth: 341 }}>
          <DefaultCard
            label="Aimaq Basic"
            name="Basic"
            price="Free"
            desc="For solo use with light needs."
            features={BASIC_FEATURES}
            cta="Try Freelio free"
          />
        </StaggerItem>

        <StaggerItem style={{ flex: "1 1 280px", maxWidth: 341 }}>
          <HighlightedCard billing={billing} onBillingChange={setBilling} />
        </StaggerItem>

        <StaggerItem style={{ flex: "1 1 280px", maxWidth: 341 }}>
          <DefaultCard
            label="Aimaq Enterprise"
            name="Enterprise"
            price="Flexible"
            desc="For team use with light needs."
            features={ENTERPRISE_FEATURES}
            cta="Contact sales"
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
