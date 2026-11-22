"use client";

// Loading state: a scan line + lens move down a skeleton resume while the
// status text rotates through what the model is doing.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const STEPS = [
  "Stripping contact details…",
  "Reading the job description…",
  "Extracting requirements…",
  "Matching skills line by line…",
  "Ranking the gaps…",
  "Rewriting weak bullets from your facts only…",
  "Scoring against the rubric…",
  "Validating the JSON…",
];

const ROWS = [62, 38, 0, 28, 84, 70, 0, 24, 90, 76, 82, 54, 0, 32, 88, 66];

export function ScanLoader({ label }: { label?: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div role="status" aria-live="polite" className="grid items-center gap-8 rounded-[6px] border border-rule bg-card p-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:p-10">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[15rem] overflow-hidden rounded-[4px] border border-ink/80 bg-paper px-5 py-6">
        {ROWS.map((w, i) =>
          w === 0 ? (
            <div key={i} className="h-3" />
          ) : (
            <div
              key={i}
              className="mb-2 h-[5px] rounded-full bg-ink/15"
              style={{ width: `${w}%`, marginLeft: i % 5 === 4 || i % 5 === 0 ? 0 : "8%" }}
            />
          ),
        )}
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 h-16"
            initial={{ top: "-15%" }}
            animate={{ top: ["-15%", "100%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
          >
            <div className="h-full w-full bg-gradient-to-b from-transparent to-accent/25" />
            <div className="h-[2px] w-full bg-accent" />
            <svg className="absolute right-1 -bottom-6 h-12 w-12" viewBox="0 0 56 56" fill="none">
              <circle cx="22" cy="22" r="15" stroke="var(--ink)" strokeWidth="4" fill="var(--card)" fillOpacity="0.4" />
              <path d="M33 33l14 14" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </motion.div>
        )}
      </div>

      <div>
        <p className="folio">{label ?? "Analysing"}</p>
        <div className="relative mt-3 h-[4.5rem] overflow-hidden sm:h-[5.5rem]">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              className="display absolute inset-0 text-[clamp(1.6rem,3.2vw,2.6rem)] !leading-[1.1]"
              initial={{ y: reduce ? 0 : "60%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: reduce ? 0 : "-60%", opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {STEPS[step]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="mt-6 flex gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span key={i} className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-accent" : "bg-rule"}`} />
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">Usually 10–40 seconds. If the reply isn&apos;t valid JSON, we ask the model once to fix it.</p>
      </div>
    </div>
  );
}
