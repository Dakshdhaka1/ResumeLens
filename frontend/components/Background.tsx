"use client";

// Layered page background: slow-drifting accent blobs + a fixed paper-grain
// noise overlay. Both sit behind content (pointer-events: none).
import { motion, useReducedMotion } from "framer-motion";

const GRAIN_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function Background() {
  const reduce = useReducedMotion();
  const drift = (x: number[], y: number[], duration: number) =>
    reduce ? {} : { animate: { x, y }, transition: { duration, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const } };

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-40 right-[-10%] h-[38rem] w-[38rem] rounded-full blur-[110px]"
        style={{ background: "var(--accent)", opacity: 0.14 }}
        {...drift([0, -80, 30], [0, 60, -20], 46)}
      />
      <motion.div
        className="absolute top-[45%] -left-40 h-[30rem] w-[30rem] rounded-full blur-[120px]"
        style={{ background: "var(--blob-2)", opacity: 0.16 }}
        {...drift([0, 90, -10], [0, -50, 40], 58)}
      />
      <motion.div
        className="absolute bottom-[-12rem] right-[20%] h-[26rem] w-[26rem] rounded-full blur-[120px]"
        style={{ background: "var(--accent)", opacity: 0.08 }}
        {...drift([0, -40, 60], [0, -30, 10], 52)}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: GRAIN_SVG, opacity: "var(--grain-opacity)", mixBlendMode: "var(--grain-blend)" as never }}
      />
    </div>
  );
}
