"use client";

/* Framer source: nodeId hmZAdLJYc (Banner)
   Layout: horizontal stack, center distribution, center alignment
   Content: maxWidth=800, gap=32 vertical, center aligned
   Texts: gap=16 | "Ready to get started" Heading 2
         "Download Aimaq for free. No credit card required." Body Large
   Button: Primary variant, "Try Freelio free"
   CloudLeft:  position=absolute left=-280, width=480, top=-40, bottom=-28
   CloudRight: position=absolute right=-280, width=480, top=-40, bottom=-28
   Both clouds use real PNG assets from framerusercontent */

import Link from "next/link";
import { FadeUp } from "./motion";

const CLOUD_LEFT  = "https://framerusercontent.com/images/iR8Ma0AjH7EaIAPThF3xcp9l3bM.png";
const CLOUD_RIGHT = "https://framerusercontent.com/images/qazH0744I2w9AnpfmUJIze7g.png";

export function CTABanner() {
  return (
    <section
      className="relative w-full overflow-hidden flex justify-center"
      style={{ padding: "120px 24px" }}
    >
      {/* Cloud — left */}
      <img
        src={CLOUD_LEFT}
        alt=""
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          top: "-8%",
          left: "-6%",
          width: "38%",
          maxWidth: 480,
          zIndex: 0,
          opacity: 0.88,
        }}
      />
      {/* Cloud — right */}
      <img
        src={CLOUD_RIGHT}
        alt=""
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          top: "-8%",
          right: "-6%",
          width: "38%",
          maxWidth: 480,
          zIndex: 0,
          opacity: 0.88,
        }}
      />

      {/* Content: maxWidth=800, center, gap=32 */}
      <FadeUp
        className="relative z-10 flex flex-col items-center text-center w-full"
        style={{ maxWidth: 800, gap: 32 }}
      >
        {/* Texts: gap=16 */}
        <div className="flex flex-col items-center" style={{ gap: 16 }}>
          {/* Heading 2: ~52px semibold -0.03em */}
          <h2
            className="font-semibold leading-[115%] tracking-[-0.03em]"
            style={{
              fontSize: "clamp(32px, 4.5vw, 52px)",
              color: "var(--neutral-30)",
            }}
          >
            Ready to get started
          </h2>
          {/* Body Large: 18px regular 150% leading */}
          <p
            className="leading-[150%]"
            style={{ fontSize: 18, color: "var(--neutral-20)" }}
          >
            Download Aimaq for free. No credit card required.
          </p>
        </div>

        {/* Primary CTA button — Neutral30 bg, white text, radius=100px, padding=18 24 */}
        <Link
          href="/contact-us"
          className="inline-flex items-center font-semibold text-[16px] leading-[1.2] text-white transition-opacity hover:opacity-85"
          style={{
            padding: "18px 28px",
            borderRadius: "100px",
            backgroundColor: "var(--neutral-30)",
          }}
        >
          Try Freelio free
        </Link>
      </FadeUp>
    </section>
  );
}
