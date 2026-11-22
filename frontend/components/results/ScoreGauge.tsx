"use client";

// Radial gauge that sweeps from 0 to the score while the number counts up.
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

const R = 88;
const C = 2 * Math.PI * R;
const ARC = 0.75; // the gauge is a 270° arc

function verdict(score: number) {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Good match, with gaps";
  if (score >= 40) return "Partial match";
  return "Weak match for this role";
}

export function ScoreGauge({ score, size = 240, delay = 0.1 }: { score: number; size?: number; delay?: number }) {
  const reduce = useReducedMotion();
  const progress = useMotionValue(reduce ? score : 0);
  const dash = useTransform(progress, (v) => `${(v / 100) * C * ARC} ${C}`);
  const [shown, setShown] = useState(reduce ? score : 0);

  useEffect(() => {
    if (reduce) {
      progress.set(score);
      setShown(score);
      return;
    }
    const controls = animate(progress, score, {
      duration: 1.4,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [score, reduce, delay, progress]);

  const ticks = Array.from({ length: 28 }, (_, i) => i);

  return (
    <figure className="relative" style={{ width: size, height: size }} aria-label={`Match score ${score} out of 100: ${verdict(score)}`} role="img">
      <svg viewBox="0 0 220 220" className="h-full w-full -rotate-[225deg]">
        {/* track */}
        <circle cx="110" cy="110" r={R} fill="none" stroke="var(--rule)" strokeWidth="10" strokeDasharray={`${C * ARC} ${C}`} strokeLinecap="round" />
        {/* value */}
        <motion.circle cx="110" cy="110" r={R} fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" style={{ strokeDasharray: dash }} />
        {/* instrument ticks */}
        {ticks.map((i) => {
          const a = (i / (ticks.length - 1)) * ARC * 2 * Math.PI;
          const r1 = 70;
          const r2 = i % 3 === 0 ? 62 : 66;
          return (
            <line
              key={i}
              x1={110 + r1 * Math.cos(a)}
              y1={110 + r1 * Math.sin(a)}
              x2={110 + r2 * Math.cos(a)}
              y2={110 + r2 * Math.sin(a)}
              stroke="var(--muted)"
              strokeOpacity={i % 3 === 0 ? 0.8 : 0.4}
              strokeWidth="1"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[3.6rem] font-medium leading-none tracking-[-0.04em] tabular text-ink" style={{ fontSize: size * 0.24 }}>
          {shown}
        </span>
        <span className="mt-1 font-mono text-xs tracking-[0.12em] text-muted">/ 100</span>
      </div>
      <figcaption className="absolute inset-x-0 bottom-[6%] text-center text-sm font-medium text-ink-2">{verdict(score)}</figcaption>
    </figure>
  );
}
