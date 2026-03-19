"use client";

/* Framer source: nodeId EDlyxw3K9 (AboutApp)
   Container maxWidth=1072px, gap=56px
   Carousel height=700px, borderRadius=24px, bg=rgb(249,248,248)
   Toggle: "Mobile App" (active=dark) / "Web App" (active=dark), bottom-center at 32px */

import Image from "next/image";
import { useState } from "react";
import { FadeUp, ScaleUp } from "./motion";

const TABS = [
  {
    id: "mobile",
    label: "Mobile App",
    src: "https://framerusercontent.com/images/W508S15xkXJdvalNWW9jYJSIKg.png",
    alt: "Aimaq mobile app — manage your freelance work on the go",
  },
  {
    id: "web",
    label: "Web App",
    src: "https://framerusercontent.com/images/pfcMvn2yqXD2Cl6VWthMkHlhaKQ.png",
    alt: "Aimaq web app — full-featured dashboard for your freelance business",
  },
];

export function AboutApp() {
  const [activeTab, setActiveTab] = useState<"mobile" | "web">("mobile");
  const current = TABS.find((t) => t.id === activeTab)!;

  return (
    <section className="w-full flex justify-center px-6 py-0">
      <div
        className="flex flex-col items-center w-full gap-14"
        style={{ maxWidth: "1072px" }}
      >
        {/* Header */}
        <FadeUp
          className="flex flex-col items-center gap-5 w-full text-center"
          style={{ maxWidth: "800px" }}
        >
          <span
            className="font-semibold tracking-widest uppercase"
            style={{ fontSize: "15px", color: "var(--neutral-10)" }}
          >
            Seamless across devices
          </span>
          <h2
            className="font-semibold leading-[120%] tracking-[-0.03em]"
            style={{
              fontSize: "clamp(32px, 4.5vw, 52px)",
              color: "var(--neutral-30)",
            }}
          >
            Work from anywhere, stay in sync
          </h2>
        </FadeUp>

        {/* Carousel card — scales up on scroll */}
        <ScaleUp
          className="relative w-full overflow-hidden"
          style={{
            height: "700px",
            borderRadius: "24px",
            backgroundColor: "rgb(249, 248, 248)",
          }}
        >
          {/* Slide image */}
          <div
            key={current.id}
            className="absolute inset-0 transition-opacity duration-500 ease-in-out"
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              priority
              className="object-cover object-top"
              sizes="1072px"
            />
          </div>

          {/* Toggle tabs */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 p-2"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "40px",
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "mobile" | "web")}
                  className="px-6 font-semibold text-[15px] leading-[1.2] transition-colors duration-200"
                  style={{
                    height: "50px",
                    borderRadius: "100px",
                    backgroundColor: isActive
                      ? "var(--neutral-30)"
                      : "transparent",
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.75)",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </ScaleUp>
      </div>
    </section>
  );
}
