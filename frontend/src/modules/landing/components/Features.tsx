/* Framer source: nodeId VMJGhIahi (Features)
   Container: maxWidth=1072px, gap=120px (between blocks)
   Block 1: image LEFT (minWidth=588px), text RIGHT — horizontal layout, gap=64px
   Block 2: text LEFT, image RIGHT — reversed
   Image panels: borderRadius=24px, bg=framerusercontent.com/g690a9Fxc6Y5G69sPCSKq4vjw, padding=40px
   Right text column: space-between (text top, pills grid bottom)
   Pills grid: 2x2, gap=16px */

import Image from "next/image";
import Link from "next/link";

/* FeaturesPill: borderRadius=100px, padding=12px 16px, icon 24px + Body Normal Medium label */
function FeaturesPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 font-medium text-[16px] leading-[150%]"
      style={{
        padding: "12px 16px",
        borderRadius: "100px",
        backgroundColor: "var(--beige-10)",
        color: "var(--neutral-30)",
        width: "fit-content",
      }}
    >
      <span className="shrink-0 w-6 h-6 flex items-center justify-center">
        {icon}
      </span>
      {label}
    </div>
  );
}

/* Icon set — matching Framer's Shapes component per pill */
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const BarChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
);
const FileTextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);
const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /><path d="M16 12h5v4h-5a2 2 0 1 1 0-4z" />
  </svg>
);
const TrendingUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M23 6l-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" />
  </svg>
);
const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

/* Block 1 data */
const block1 = {
  eyebrow: "project management",
  heading: "Keep every project moving forward",
  body: "Plan, assign, and deliver your work — all in one place. With smart task tracking, deadlines, and real-time progress, you stay organized and clients stay confident.",
  imageBg: "https://framerusercontent.com/images/g690a9Fxc6Y5G69sPCSKq4vjw.png",
  illustration: "https://framerusercontent.com/images/gUEFVWinvZ7dMZa0mUhNZWHNj3U.png",
  pills: [
    { label: "Tasks", icon: <CheckIcon /> },
    { label: "Time tracking", icon: <ClockIcon /> },
    { label: "Timesheets", icon: <CalendarIcon /> },
    { label: "Reports", icon: <BarChartIcon /> },
  ],
};

/* Block 2 data */
const block2 = {
  eyebrow: "financial management",
  heading: "Track income, get paid, stress less",
  body: "Create branded invoices, log expenses, and keep tabs on your earnings. Whether you bill hourly or per project, everything's automated and tax-friendly.",
  imageBg: "https://framerusercontent.com/images/g690a9Fxc6Y5G69sPCSKq4vjw.png",
  illustration: "https://framerusercontent.com/images/thBhwyY3D4d8TRQEbrMU6zSvz8.png",
  pills: [
    { label: "Invoicing", icon: <FileTextIcon /> },
    { label: "Budgets", icon: <WalletIcon /> },
    { label: "Forecasting", icon: <TrendingUpIcon /> },
    { label: "Integrations", icon: <GridIcon /> },
  ],
};

/* Re-usable image panel */
function ImagePanel({ bgUrl, illustrationUrl, alt }: { bgUrl: string; illustrationUrl: string; alt: string }) {
  return (
    <div
      className="relative overflow-hidden flex items-center justify-center shrink-0"
      style={{
        flex: "1 1 0",
        minWidth: "min(588px, 100%)",
        borderRadius: "24px",
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "40px",
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: "615px",
          borderRadius: "20px",
          aspectRatio: "0.826",
          maxWidth: "100%",
        }}
      >
        <Image
          src={illustrationUrl}
          alt={alt}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, 540px"
        />
      </div>
    </div>
  );
}

/* Re-usable text column */
function TextColumn({
  eyebrow,
  heading,
  body,
  pills,
}: {
  eyebrow: string;
  heading: string;
  body: string;
  pills: { label: string; icon: React.ReactNode }[];
}) {
  return (
    <div
      className="flex flex-col justify-between"
      style={{ flex: "1 1 0", minWidth: 0, gap: "64px" }}
    >
      {/* Top: texts + CTA */}
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <span
            className="font-semibold tracking-widest uppercase"
            style={{ fontSize: "15px", color: "var(--neutral-10)" }}
          >
            {eyebrow}
          </span>
          <h2
            className="font-semibold leading-[120%] tracking-[-0.03em]"
            style={{
              fontSize: "clamp(28px, 3.5vw, 52px)",
              color: "var(--neutral-30)",
            }}
          >
            {heading}
          </h2>
          <p
            className="leading-[150%]"
            style={{ fontSize: "18px", color: "var(--neutral-20)" }}
          >
            {body}
          </p>
        </div>
        <Link
          href="/contact-us"
          className="inline-flex items-center self-start px-6 py-[18px] rounded-full font-semibold text-white text-[16px] leading-[1.2] transition-opacity duration-150 hover:opacity-85"
          style={{ backgroundColor: "var(--neutral-30)" }}
        >
          Try Dreelio free
        </Link>
      </div>

      {/* Bottom: 2×2 pills grid */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        {pills.map((pill) => (
          <FeaturesPill key={pill.label} label={pill.label} icon={pill.icon} />
        ))}
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section
      className="w-full flex justify-center px-6 py-0"
      id="features"
    >
      <div
        className="flex flex-col w-full"
        style={{ maxWidth: "1072px", gap: "120px" }}
      >
        {/* Block 1: image LEFT, text RIGHT */}
        <div
          className="flex flex-wrap items-stretch"
          style={{ gap: "64px" }}
        >
          <ImagePanel
            bgUrl={block1.imageBg}
            illustrationUrl={block1.illustration}
            alt="Dreelio project management — task board and time tracking interface"
          />
          <TextColumn
            eyebrow={block1.eyebrow}
            heading={block1.heading}
            body={block1.body}
            pills={block1.pills}
          />
        </div>

        {/* Block 2: text LEFT, image RIGHT */}
        <div
          className="flex flex-wrap-reverse items-stretch"
          style={{ gap: "64px" }}
        >
          <TextColumn
            eyebrow={block2.eyebrow}
            heading={block2.heading}
            body={block2.body}
            pills={block2.pills}
          />
          <ImagePanel
            bgUrl={block2.imageBg}
            illustrationUrl={block2.illustration}
            alt="Dreelio financial management — invoice and earnings tracking interface"
          />
        </div>
      </div>
    </section>
  );
}
