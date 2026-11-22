"use client";

// The four rubric criteria fill one after another; each reason fades in after its bar.
import { motion, useReducedMotion } from "framer-motion";
import { RubricIcon } from "@/components/illustrations/RubricIcons";
import { CRITERIA, type CriterionKey, type Review } from "@/lib/api";

export function RubricBars({ breakdown, startDelay = 0.6, compact = false }: { breakdown: Review["score_breakdown"]; startDelay?: number; compact?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <ol className="divide-y divide-rule border-y border-rule">
      {CRITERIA.map((c, i) => {
        const crit = breakdown[c.key as CriterionKey];
        const pct = Math.min(100, (crit.score / crit.max) * 100);
        const delay = reduce ? 0 : startDelay + i * 0.35;
        return (
          <li key={c.key} className={`grid grid-cols-[2rem_1fr] gap-x-3 ${compact ? "py-3" : "py-4"}`}>
            <RubricIcon criterion={c.key} className="mt-0.5 h-7 w-7 text-ink" />
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <h4 className={`font-medium text-ink ${compact ? "text-sm" : "text-[0.95rem]"}`}>{c.label}</h4>
                <span className="font-mono text-sm tabular text-ink">
                  <span className="text-base font-medium">{crit.score}</span>
                  <span className="text-muted">/{crit.max}</span>
                </span>
              </div>
              <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-rule/70" aria-hidden>
                <motion.div
                  className="h-full origin-left rounded-full bg-ink"
                  initial={{ scaleX: reduce ? pct / 100 : 0 }}
                  animate={{ scaleX: pct / 100 }}
                  transition={{ duration: reduce ? 0 : 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <motion.p
                className={`mt-2 text-ink-2 ${compact ? "text-xs" : "text-sm"}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: delay + (reduce ? 0 : 0.45) }}
              >
                {crit.reason}
              </motion.p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
