/* Framer source: nodeId kO4oh9IU1 (Benefits)
   Container: maxWidth=1072px, gap=56px
   Top 2 cards: horizontal, gap=24px | each: borderRadius=24px, padding=32px, gap=80px
   Bottom 3 BenefitsCards: horizontal, gap=24px | each: borderRadius=24px, padding=32px, gap=68px
   BenefitsCard: 56px icon circle (Beige 0 bg), H6 title, Body Normal desc */

import Image from "next/image";

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
    <div className="relative w-full overflow-hidden" style={{ height: 56 }}>
      {/* fades */}
      <div
        className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to right, rgba(241,235,229,1), transparent)`,
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to left, rgba(241,235,229,1), transparent)`,
        }}
      />
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
    <section
      className="w-full flex justify-center px-6 py-0"
      id="benefits"
    >
      <div
        className="flex flex-col w-full"
        style={{ maxWidth: "1072px", gap: 56 }}
      >
        {/* Header */}
        <div
          className="flex flex-col items-center gap-5 w-full text-center"
          style={{ maxWidth: 800, alignSelf: "center" }}
        >
          <span
            className="font-semibold tracking-widest uppercase"
            style={{ fontSize: 15, color: "var(--neutral-10)" }}
          >
            features
          </span>
          <h2
            className="font-semibold leading-[120%] tracking-[-0.03em]"
            style={{
              fontSize: "clamp(32px, 4.5vw, 52px)",
              color: "var(--neutral-30)",
            }}
          >
            Built for freelancers, powered by simplicity
          </h2>
        </div>

        {/* Cards */}
        <div className="flex flex-col" style={{ gap: 24 }}>
          {/* Top row — 2 large cards */}
          <div className="flex flex-wrap" style={{ gap: 24 }}>
            {/* Card 1 — Customisation */}
            <div
              className="flex flex-col"
              style={{
                flex: "1 1 460px",
                backgroundColor: "rgba(240, 234, 229, 1)",
                borderRadius: 24,
                padding: 32,
                gap: 80,
                overflow: "hidden",
              }}
            >
              <h3
                className="font-semibold leading-[140%] tracking-[-0.03em]"
                style={{ fontSize: "clamp(20px, 2vw, 28px)", color: "var(--neutral-30)" }}
              >
                Smart, flexible, and built around your business workflow
              </h3>
              {/* Illustration */}
              <div
                className="relative w-full"
                style={{ height: 176, borderRadius: 0 }}
              >
                <Image
                  src="https://framerusercontent.com/images/o5PFg7LTymdZ6P4tuEGy4oFUFzw.svg"
                  alt="Dreelio workflow customization illustration"
                  fill
                  className="object-contain object-left"
                  sizes="(max-width: 768px) 100vw, 540px"
                  unoptimized
                />
              </div>
              <p
                className="leading-[150%]"
                style={{ fontSize: 18, color: "var(--neutral-20)" }}
              >
                Personalize every detail. From branding and interface layout to
                colors and menus, so Dreelio feels like an extension of your
                brand.
              </p>
            </div>

            {/* Card 2 — Integrations */}
            <div
              className="flex flex-col"
              style={{
                flex: "1 1 460px",
                backgroundColor: "rgba(241, 235, 229, 1)",
                borderRadius: 24,
                padding: 32,
                gap: 80,
                overflow: "hidden",
              }}
            >
              <h3
                className="font-semibold leading-[140%] tracking-[-0.03em]"
                style={{ fontSize: "clamp(20px, 2vw, 28px)", color: "var(--neutral-30)" }}
              >
                Integrates seamlessly with the tools you already use
              </h3>
              {/* Two ticker rows */}
              <div className="flex flex-col" style={{ gap: 16, height: 176 }}>
                <IntegrationsRow items={integrationRow1} direction="left" />
                <IntegrationsRow items={integrationRow2} direction="right" />
              </div>
              <p
                className="leading-[150%]"
                style={{ fontSize: 18, color: "var(--neutral-20)" }}
              >
                Seamless integrations. Plug Dreelio into the tools you love.
                Set up automations, sync your data, and make your systems work
                smarter together.
              </p>
            </div>
          </div>

          {/* Bottom row — 3 BenefitsCards */}
          <div className="flex flex-wrap" style={{ gap: 24 }}>
            <BenefitsCard
              icon={<HandshakeIcon />}
              title="Collaborate in realtime"
              description="Keep every conversation in sync — use comments, messages, and project chats to stay on the same page."
            />
            <BenefitsCard
              icon={<GlobeIcon />}
              title="Speaks your language"
              description="Set your language, currency, time, and date preferences for a seamless experience that feels truly local."
            />
            <BenefitsCard
              icon={<LayoutIcon />}
              title="View things your way"
              description="Easily toggle between various views, including Kanban, cards, list, table, timeline, and calendar."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
