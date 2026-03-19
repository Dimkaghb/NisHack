"use client";

/* Framer source: nodeId kD9B4CiVi (Blog)
   Eyebrow "BLOG" | Heading 2 "Ideas to level-up your freelance game"
   WideDesktop card: height=480, gap=0, horizontal stack
     Left: ImageFrame width=45% radius=16 (left round only)
     Right: ContentColumn padding=40, gap=24 vertical, white bg
       Badge ("MUST READ" dark brown), Title H2, Description, AuthorRow + "FEATURED" badge
   WideDesktop card has border 2px solid /Blue 30 (featured highlight)
   SmallCards: 3-col grid, gap=12
     Each: vertical stack, ImageFrame height=220 top radius, ContentRow padding=20 12
     Badge right-aligned, Title + AuthorRow
   Author avatars: circle initials DP bg=#8da6bb */

import Image from "next/image";
import { FadeUp, StaggerGroup, StaggerItem } from "./motion";

/* ── Author component ─────────────────────────────────────── */
function Author({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("");
  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      <div
        className="flex items-center justify-center font-semibold text-[11px] text-white flex-shrink-0"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: "#8da6bb",
        }}
      >
        {initials}
      </div>
      <div className="flex flex-col" style={{ gap: 1 }}>
        <span
          className="font-semibold text-[14px] leading-[1.4]"
          style={{ color: "var(--neutral-30)" }}
        >
          {name}
        </span>
        <span
          className="text-[12px] leading-[1.4]"
          style={{ color: "var(--neutral-10)" }}
        >
          {role}
        </span>
      </div>
    </div>
  );
}

/* ── Badge component ──────────────────────────────────────── */
const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  "НУЖНО ПРОЧИТАТЬ":  { bg: "rgb(69, 57, 51)",    color: "#fff" },
  "РЕКОМЕНДУЕМ":      { bg: "rgb(201, 80, 46)",   color: "#fff" },
  "ИНСТРУМЕНТЫ":      { bg: "rgb(21, 108, 194)",  color: "#fff" },
  "ПОЛЕЗНОЕ":        { bg: "rgb(207, 141, 19)",  color: "#fff" },
  "УПРАВЛЕНИЕ":      { bg: "rgb(14, 161, 88)",   color: "#fff" },
};
function Badge({ label }: { label: string }) {
  const c = BADGE_COLORS[label] ?? { bg: "var(--neutral-30)", color: "#fff" };
  return (
    <span
      className="inline-flex items-center font-semibold text-[11px] tracking-[0.06em] uppercase leading-[1]"
      style={{
        padding: "6px 10px",
        borderRadius: 100,
        backgroundColor: c.bg,
        color: c.color,
      }}
    >
      {label}
    </span>
  );
}

/* ── Featured / wide card ──────────────────────────────────── */
function FeaturedCard() {
  return (
    <div
      className="w-full flex overflow-hidden"
      style={{
        borderRadius: 20,
        border: "2px solid var(--blue-30)",
        backgroundColor: "rgba(255,255,255,0.72)",
        minHeight: 380,
      }}
    >
      {/* Image half */}
      <div
        className="relative flex-shrink-0"
        style={{ width: "46%", minHeight: 380 }}
      >
        <Image
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=640&q=80&auto=format&fit=crop"
            alt="Коммерческие локации — подбор с Aimaq"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Content half */}
      <div
        className="flex flex-col justify-between flex-1"
        style={{ padding: 40, gap: 24 }}
      >
        <div className="flex flex-col" style={{ gap: 16 }}>
          <Badge label="НУЖНО ПРОЧИТАТЬ" />
          <h3
            className="font-semibold leading-[125%] tracking-[-0.02em]"
            style={{ fontSize: "clamp(20px, 2.4vw, 28px)", color: "var(--neutral-30)" }}
          >
            Как выбрать локацию для бизнеса: 7 шагов
          </h3>
          <p
            className="text-[15px] leading-[150%]"
            style={{ color: "var(--neutral-20)" }}
          >
            Подробное руководство: трафик, конкуренты, транспорт и бюджет — с понятными критериями выбора.
          </p>
        </div>

        {/* Author row + FEATURED badge at bottom */}
        <div className="flex items-end justify-between flex-wrap" style={{ gap: 12 }}>
          <Author name="Dhyna Phils" role="Аналитик коммерческих локаций" />
          <Badge label="РЕКОМЕНДУЕМ" />
        </div>
      </div>
    </div>
  );
}

/* ── Small blog card ────────────────────────────────────────── */
function SmallCard({
  image,
  title,
  badge,
}: {
  image: string;
  title: string;
  badge: string;
}) {
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.72)",
        flex: "1 1 280px",
        minWidth: 0,
      }}
    >
      {/* Image area */}
      <div
        className="relative w-full flex-shrink-0"
        style={{ height: 220, overflow: "hidden" }}
      >
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col" style={{ padding: "20px 20px 24px", gap: 12 }}>
        <div className="flex items-start justify-between" style={{ gap: 8 }}>
          <h4
            className="font-semibold text-[15px] leading-[145%]"
            style={{ color: "var(--neutral-30)", flex: 1 }}
          >
            {title}
          </h4>
          <Badge label={badge} />
        </div>
        <Author name="Dyna Phils" role="Аналитик коммерческих площадей" />
      </div>
    </div>
  );
}

export function Blog() {
  return (
    <section className="w-full flex flex-col items-center px-6" style={{ gap: 48 }}>
      {/* Header */}
      <FadeUp className="flex flex-col items-center text-center" style={{ gap: 12 }}>
        <span
          className="text-[13px] font-semibold tracking-[0.12em] uppercase"
          style={{ color: "var(--neutral-10)" }}
        >
          Блог
        </span>
        <h2
          className="font-semibold leading-[115%] tracking-[-0.03em]"
          style={{
            fontSize: "clamp(28px, 4.5vw, 52px)",
            color: "var(--neutral-30)",
            maxWidth: 600,
          }}
        >
          Статьи и советы по выбору локаций
        </h2>
      </FadeUp>

      {/* Cards wrapper — maxWidth=1072px */}
      <div className="w-full flex flex-col" style={{ maxWidth: 1072, gap: 12 }}>
        {/* Featured wide card — fades up */}
        <FadeUp>
          <FeaturedCard />
        </FadeUp>

        {/* Three small cards — staggered */}
        <StaggerGroup className="w-full flex flex-wrap" style={{ gap: 12 }}>
          <StaggerItem style={{ flex: "1 1 280px", minWidth: 0 }}>
            <SmallCard
              image="https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=640&q=80&auto=format&fit=crop"
              title="Топ-10 районов вашего города для кафе"
              badge="ИНСТРУМЕНТЫ"
            />
          </StaggerItem>
          <StaggerItem style={{ flex: "1 1 280px", minWidth: 0 }}>
            <SmallCard
              image="https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=640&q=80&auto=format&fit=crop"
              title="Как оценить окупаемость локации в 2026"
              badge="ПОЛЕЗНОЕ"
            />
          </StaggerItem>
          <StaggerItem style={{ flex: "1 1 280px", minWidth: 0 }}>
            <SmallCard
              image="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=640&q=80&auto=format&fit=crop"
              title="Что важно учитывать по конкурентам рядом"
              badge="УПРАВЛЕНИЕ"
            />
          </StaggerItem>
        </StaggerGroup>
      </div>
    </section>
  );
}
