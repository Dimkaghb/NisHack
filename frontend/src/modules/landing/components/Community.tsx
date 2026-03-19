"use client";

/* Framer source: nodeId NAN7SdLYe (Community)
   Container: maxWidth=952px, gap=56px
   CommunityCard Desktop: bg=rgba(255,255,255,0.699), radius=24px, padding=32px, gap=32px
   AppLogo: 64px, radius=16px, padding=15px | Followers: Eyebrow Large (15px uppercase)
   Platform name: Heading 5 (28px) | Description: Body Large (18px) | CTA: Tertiary button */

import Link from "next/link";
import { FadeUp, StaggerGroup, StaggerItem } from "./motion";

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const cards = [
  {
    platform: "X/Twitter",
    followers: "15.2K followers",
    description: "Stay updated on new features and discover how others are using Aimaq.",
    cta: "Follow us",
    href: "https://x.com/Leonc7303",
    icon: <XIcon />,
    iconBg: "#000000",
  },
  {
    platform: "YouTube",
    followers: "32K subscribers",
    description: "Tips, tutorials, and in-depth feature guides to inspire and enhance your Aimaq workflow.",
    cta: "Subscribe",
    href: "https://www.youtube.com/@Framer",
    icon: <YouTubeIcon />,
    iconBg: "#FF0000",
  },
];

export function Community() {
  return (
    <section className="w-full flex justify-center px-6 py-0">
      {/* maxWidth=952px (matches Framer) */}
      <div className="flex flex-col w-full" style={{ maxWidth: 952, gap: 56 }}>
        {/* Header */}
        <FadeUp className="flex flex-col items-center gap-5 text-center" style={{ maxWidth: 800, alignSelf: "center" }}>
          <span className="font-semibold tracking-widest uppercase" style={{ fontSize: 15, color: "var(--neutral-10)" }}>
            Community
          </span>
          <h2 className="font-semibold leading-[120%] tracking-[-0.03em]" style={{ fontSize: "clamp(32px, 4.5vw, 52px)", color: "var(--neutral-30)" }}>
            Stay in the loop
          </h2>
        </FadeUp>

        {/* Cards — staggered */}
        <StaggerGroup className="flex flex-wrap" style={{ gap: 24 }}>
          {cards.map((card) => (
            <StaggerItem
              key={card.platform}
              className="flex flex-col justify-between"
              style={{
                flex: "1 1 400px",
                backgroundColor: "rgba(255, 255, 255, 0.699)",
                borderRadius: 24,
                padding: 32,
                gap: 32,
              }}
            >
              {/* App logo + followers count — space-between */}
              <div className="flex items-center justify-between">
                {/* 64px logo icon, radius=16px, padding=15px */}
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: card.iconBg,
                    padding: 15,
                  }}
                >
                  {card.icon}
                </div>
                {/* Followers — Eyebrow Large: 15px uppercase semibold */}
                <span
                  className="font-semibold tracking-widest uppercase"
                  style={{ fontSize: 15, color: "var(--neutral-30)" }}
                >
                  {card.followers}
                </span>
              </div>

              {/* Texts: H5 name + Body Large description */}
              <div className="flex flex-col" style={{ gap: 8 }}>
                <h3
                  className="font-semibold leading-[140%] tracking-[-0.03em]"
                  style={{ fontSize: 28, color: "var(--neutral-30)" }}
                >
                  {card.platform}
                </h3>
                <p className="leading-[150%]" style={{ fontSize: 18, color: "var(--neutral-20)" }}>
                  {card.description}
                </p>
              </div>

              {/* CTA — Tertiary variant: transparent bg, pill, text-only */}
              <Link
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center self-start px-6 font-semibold text-[16px] leading-[1.2] rounded-full transition-colors duration-150 hover:bg-black/5"
                style={{
                  height: 56,
                  backgroundColor: "transparent",
                  color: "var(--neutral-30)",
                }}
              >
                {card.cta}
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
