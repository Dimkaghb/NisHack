"use client";

/* Framer source: nodeId kO4oh9IU1 (Benefits)
   Container: maxWidth=1072px, gap=56px
   Top 2 cards: horizontal, gap=24px | each: borderRadius=24px, padding=32px, gap=80px
   Bottom 3 BenefitsCards: horizontal, gap=24px | each: borderRadius=24px, padding=32px, gap=68px
   BenefitsCard: 56px icon circle (Beige 0 bg), H6 title, Body Normal desc */

import Image from "next/image";
import { FadeUp, StaggerGroup, StaggerItem } from "./motion";

/* ── Integration icon squares ────────────────────────────────────── */
type IntegrationItem = { name: string; color: string; letter: string };

const integrationRow1: IntegrationItem[] = [
  { name: "Stripe", color: "#635BFF", letter: "S" },
  { name: "Slack", color: "#4A154B", letter: "Sl" },
  { name: "Notion", color: "#000000", letter: "N" },
  { name: "Figma", color: "#F24E1E", letter: "F" },
  { name: "Google Drive", color: "#34A853", letter: "G" },
  { name: "Zoom", color: "#2D8CFF", letter: "Z" },
  { name: "HubSpot", color: "#FF7A59", letter: "H" },
  { name: "Dropbox", color: "#0061FF", letter: "D" },
  { name: "Asana", color: "#F06A6A", letter: "A" },
];

const integrationRow2: IntegrationItem[] = [
  { name: "QuickBooks", color: "#2CA01C", letter: "QB" },
  { name: "Xero", color: "#13B5EA", letter: "X" },
  { name: "Zapier", color: "#FF4A00", letter: "Z" },
  { name: "Linear", color: "#5E6AD2", letter: "L" },
  { name: "Loom", color: "#625DF5", letter: "Lo" },
  { name: "Calendly", color: "#006BFF", letter: "C" },
  { name: "Airtable", color: "#18BFFF", letter: "At" },
];

function IntegrationLogo({ item }: { item: IntegrationItem }) {
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-2xl text-white font-bold text-[15px] select-none"
      style={{
        width: 56,
        height: 56,
        backgroundColor: item.color,
        letterSpacing: "-0.01em",
      }}
      title={item.name}
    >
      {item.letter}
    </div>
  );
}

function IntegrationsRow({
  items,
  direction,
}: {
  items: IntegrationItem[];
  direction: "left" | "right";
}) {
  const doubled = [...items, ...items];
  return (
    <div className="ticker-mask w-full overflow-hidden" style={{ height: 56 }}>
      <div
        className={`flex items-center h-full ${
          direction === "left"
            ? "integrations-ticker-left"
            : "integrations-ticker-right"
        }`}
        style={{ gap: 16, width: "max-content" }}
      >
        {doubled.map((item, i) => (
          <IntegrationLogo key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

/* ── Bottom BenefitsCard ─────────────────────────────────────────── */
function BenefitsCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex flex-col justify-between"
      style={{
        flex: "1 1 0",
        backgroundColor: "rgba(240, 234, 229, 1)",
        borderRadius: 24,
        padding: 32,
        gap: 68,
        overflow: "hidden",
        minWidth: 240,
      }}
    >
      {/* Icon circle — 56px, Beige 0 bg */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 56,
          height: 56,
          backgroundColor: "var(--beige-0)",
          borderRadius: "100px",
        }}
      >
        {icon}
      </div>
      {/* Texts */}
      <div className="flex flex-col gap-4">
        <h3
          className="font-semibold leading-[140%] tracking-[-0.03em]"
          style={{ fontSize: 20, color: "var(--neutral-30)" }}
        >
          {title}
        </h3>
        <p
          className="leading-[150%]"
          style={{ fontSize: 16, color: "var(--neutral-20)" }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

/* ── Icon SVGs ───────────────────────────────────────────────────── */
const HandshakeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" style={{ color: "var(--neutral-30)" }}>
    <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l1.06 1.06L12 21.23l7.36-7.36 1.06-1.06a5.4 5.4 0 0 0 0-7.65z" />
  </svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" style={{ color: "var(--neutral-30)" }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const LayoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" style={{ color: "var(--neutral-30)" }}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);

/* ── Main component ──────────────────────────────────────────────── */
export function Benefits() {
  return (
    <section className="w-full flex justify-center px-6 py-0" id="benefits">
      <div className="flex flex-col w-full" style={{ maxWidth: "1072px", gap: 56 }}>

        {/* Header */}
        <FadeUp className="flex flex-col items-center gap-5 w-full text-center" style={{ maxWidth: 800, alignSelf: "center" }}>
          <span className="font-semibold tracking-widest uppercase" style={{ fontSize: 15, color: "var(--neutral-10)" }}>
            подбор локаций
          </span>
          <h2 className="font-semibold leading-[120%] tracking-[-0.03em]"
            style={{ fontSize: "clamp(32px, 4.5vw, 52px)", color: "var(--neutral-30)" }}>
            Подбор локаций на основе данных — быстро и прозрачно
          </h2>
        </FadeUp>

        {/* Cards */}
        <div className="flex flex-col" style={{ gap: 24 }}>
          {/* Top row — 2 large cards, staggered */}
          <StaggerGroup className="flex flex-wrap" style={{ gap: 24 }}>
            {/* Card 1 — Customisation */}
            <StaggerItem className="flex flex-col" style={{ flex: "1 1 460px", backgroundColor: "rgba(240, 234, 229, 1)", borderRadius: 24, padding: 32, gap: 80, overflow: "hidden" }}>
              <h3 className="font-semibold leading-[140%] tracking-[-0.03em]"
                style={{ fontSize: "clamp(20px, 2vw, 28px)", color: "var(--neutral-30)" }}>
                Персональные параметры под ваш бизнес
              </h3>
              <div className="relative w-full" style={{ height: 176 }}>
                <Image
                  src="https://framerusercontent.com/images/o5PFg7LTymdZ6P4tuEGy4oFUFzw.svg"
                  alt="Aimaq — настройка параметров под бизнес"
                  fill className="object-contain object-left"
                  sizes="(max-width: 768px) 100vw, 540px" unoptimized
                />
              </div>
              <p className="leading-[150%]" style={{ fontSize: 18, color: "var(--neutral-20)" }}>
                Укажите формат бизнеса, район, бюджет, минимальную площадь и допустимых конкурентов — Aimaq настроит подбор под ваши цели.
              </p>
            </StaggerItem>

            {/* Card 2 — Integrations */}
            <StaggerItem className="flex flex-col" style={{ flex: "1 1 460px", backgroundColor: "rgba(241, 235, 229, 1)", borderRadius: 24, padding: 32, gap: 80, overflow: "hidden" }}>
              <h3 className="font-semibold leading-[140%] tracking-[-0.03em]"
                style={{ fontSize: "clamp(20px, 2vw, 28px)", color: "var(--neutral-30)" }}>
                Обоснованный рейтинг по данным
              </h3>
              <div className="flex flex-col" style={{ gap: 16, height: 176 }}>
                <IntegrationsRow items={integrationRow1} direction="left" />
                <IntegrationsRow items={integrationRow2} direction="right" />
              </div>
              <p className="leading-[150%]" style={{ fontSize: 18, color: "var(--neutral-20)" }}>
                Мы собираем объявления и дополняем их оценками трафика, конкурентов и транспортной доступности — чтобы рейтинг был понятным и справедливым.
              </p>
            </StaggerItem>
          </StaggerGroup>

          {/* Bottom row — 3 BenefitsCards, staggered */}
          <StaggerGroup className="flex flex-wrap" style={{ gap: 24 }}>
            <StaggerItem style={{ flex: "1 1 0", minWidth: 240 }}>
              <BenefitsCard
                icon={<HandshakeIcon />}
                title="Пояснение к каждому месту"
                description="Вы видите рейтинг и разбор факторов: трафик, конкуренты, транспорт, цена и площадь — без лишней «математики»."
              />
            </StaggerItem>
            <StaggerItem style={{ flex: "1 1 0", minWidth: 240 }}>
              <BenefitsCard
                icon={<GlobeIcon />}
                title="Под ваш формат бизнеса"
                description="Для каждого типа бизнеса важны разные факторы — Aimaq учитывает это при расчёте рейтинга."
              />
            </StaggerItem>
            <StaggerItem style={{ flex: "1 1 0", minWidth: 240 }}>
              <BenefitsCard
                icon={<LayoutIcon />}
                title="Быстрый результат за ~60 секунд"
                description="Запустите подбор — и за минуту получите топ локаций в вашем городе с понятным обоснованием."
              />
            </StaggerItem>
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}
