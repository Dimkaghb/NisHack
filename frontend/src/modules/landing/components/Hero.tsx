"use client";

/* Framer source: nodeId jhh85N0W1 (Hero)
   height=1020px, minHeight=80vh, overflow=clip, padding=160px 0 0 0
   Content maxWidth=1072px, gap=64px | Top maxWidth=792px, gap=40px
   Texts gap=16px | Heading 1 (76px semibold -0.03em) | Body XL (20px regular centered)
   Buttons gap=8px horizontal | Primary + Tertiary variants
   DashboardImage height=700px, maxWidth=1072px, aspectRatio=1.531, radius=20px
   Animations: staggered fade-up — heading (0s) → subtitle (0.1s) → buttons (0.2s) → image (0.35s) */

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const CLOUD_LEFT  = "https://framerusercontent.com/images/iR8Ma0AjH7EaIAPThF3xcp9l3bM.png";
const CLOUD_RIGHT = "https://framerusercontent.com/images/qazH0744I2w9AnpfmUJIze7g.png";

const EASE = [0.22, 1, 0.36, 1] as const;

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
  };
}

export function Hero() {
  return (
    <section
      className="relative w-full overflow-hidden flex flex-col items-center"
      style={{ minHeight: "80vh", paddingTop: 160 }}
    >
      {/* Cloud images — decorative, no animation needed on page-load decor */}
      <img
        src={CLOUD_LEFT}
        alt=""
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{ top: "18%", left: "-8%", width: "42%", maxWidth: 500, zIndex: 0, opacity: 0.9 }}
      />
      <img
        src={CLOUD_RIGHT}
        alt=""
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{ top: "14%", right: "-8%", width: "42%", maxWidth: 500, zIndex: 0, opacity: 0.9 }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center w-full px-6"
        style={{ gap: 64, maxWidth: 1072 + 48 }}
      >
        {/* Top text + buttons */}
        <div
          className="flex flex-col items-center w-full"
          style={{ maxWidth: 792, gap: 40 }}
        >
          {/* Texts */}
          <div className="flex flex-col items-center w-full" style={{ gap: 16 }}>
            <motion.h1
              {...fadeUp(0)}
              className="w-full text-center font-semibold leading-[120%] tracking-[-0.03em]"
              style={{ fontSize: "clamp(40px, 6.5vw, 76px)", color: "var(--neutral-30)" }}
            >
              Подберите идеальную локацию для бизнеса
            </motion.h1>

            <motion.p
              {...fadeUp(0.1)}
              className="text-center leading-[150%]"
              style={{
                fontSize: "clamp(16px, 2vw, 20px)",
                color: "var(--neutral-20)",
                maxWidth: 700,
              }}
            >
              Aimaq оценивает трафик, конкурентов и транспорт, чтобы вы получили рейтинг лучших локаций с понятными пояснениями. Заполните параметры — результат появится за ~60 секунд.
            </motion.p>
          </div>

          {/* Buttons */}
          <motion.div
            {...fadeUp(0.2)}
            className="flex items-center flex-wrap justify-center"
            style={{ gap: 8 }}
          >
            <Link
              href="/auth"
              className="inline-flex items-center font-semibold text-[16px] leading-[1.2] text-white transition-opacity hover:opacity-85"
              style={{ padding: "18px 24px", borderRadius: "100px", backgroundColor: "var(--neutral-30)" }}
            >
              Запустить подбор
            </Link>
            <Link
              href="/#features"
              className="inline-flex items-center font-semibold text-[16px] leading-[1.2] transition-colors hover:bg-black/5"
              style={{ padding: "18px 24px", borderRadius: "100px", backgroundColor: "rgba(255,255,255,0.1)", color: "var(--neutral-30)" }}
            >
              Как это работает
            </Link>
          </motion.div>
        </div>

        {/* Dashboard image — scale up from slightly below */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.9, ease: EASE, delay: 0.35 } }}
          className="relative w-full overflow-hidden shadow-2xl"
          style={{ borderRadius: 20, aspectRatio: "1.531", maxWidth: 1072 }}
        >
          <Image
            src="/hero-dashboard.png"
            alt="Скрин Aimaq — подбор локаций и рейтинг под ваш бизнес"
            fill
            priority
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 1072px"
          />
        </motion.div>
      </div>
    </section>
  );
}
