"use client";

/* Shared scroll-triggered animation primitives for the Aimaq landing page.
   All use Framer Motion's whileInView so they fire as the element enters the viewport.
   `once: true` — animation plays only once (no re-trigger on scroll back up).
   Easing: [0.22, 1, 0.36, 1] — smooth deceleration, same feel as Framer's default spring. */

import { motion, type Variants, type HTMLMotionProps } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "-80px" } as const;

/* ── Variants ─────────────────────────────────────────────────────── */

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, delay },
  }),
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, ease: EASE, delay },
  }),
};

export const slideInVariants = (direction: "left" | "right"): Variants => ({
  hidden: { opacity: 0, x: direction === "left" ? -48 : 48 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.75, ease: EASE, delay },
  }),
});

export const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE, delay },
  }),
};

/* Stagger container — children inherit the viewport trigger */
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

export const staggerChildVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE },
  },
};

/* ── Component wrappers ───────────────────────────────────────────── */

type DivProps = HTMLMotionProps<"div">;

/** Fades up + translates Y — for section content blocks */
export function FadeUp({
  delay = 0,
  className,
  style,
  children,
  ...rest
}: DivProps & { delay?: number }) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      custom={delay}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Simple opacity fade — for backgrounds, images, decorative elements */
export function FadeIn({
  delay = 0,
  className,
  style,
  children,
  ...rest
}: DivProps & { delay?: number }) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      custom={delay}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Slides in from left or right — for alternating feature blocks */
export function SlideIn({
  from = "left",
  delay = 0,
  className,
  style,
  children,
  ...rest
}: DivProps & { from?: "left" | "right"; delay?: number }) {
  return (
    <motion.div
      variants={slideInVariants(from)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      custom={delay}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Scale up from slightly smaller — for dashboard screenshots and hero images */
export function ScaleUp({
  delay = 0,
  className,
  style,
  children,
  ...rest
}: DivProps & { delay?: number }) {
  return (
    <motion.div
      variants={scaleUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      custom={delay}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Parent container that staggers its direct children */
export function StaggerGroup({
  className,
  style,
  children,
  ...rest
}: DivProps) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Child of StaggerGroup — inherits parent stagger timing */
export function StaggerItem({ className, style, children, ...rest }: DivProps) {
  return (
    <motion.div
      variants={staggerChildVariants}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
