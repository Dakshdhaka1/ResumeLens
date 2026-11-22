"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Priority, Review } from "@/lib/api";

const PILL: Record<Priority, { cls: string; label: string }> = {
  high: { cls: "bg-high-bg text-high-fg", label: "High" },
  medium: { cls: "bg-med-bg text-med-fg", label: "Med" },
  low: { cls: "bg-low-bg text-low-fg", label: "Low" },
};

export function PriorityPill({ priority }: { priority: Priority }) {
  const p = PILL[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] ${p.cls}`}>
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
        {priority === "high" && <path d="M4 0.5 7.5 7.5h-7z" fill="currentColor" />}
        {priority === "medium" && <rect x="0.5" y="0.5" width="7" height="7" fill="currentColor" />}
        {priority === "low" && <circle cx="4" cy="4" r="3.5" fill="currentColor" />}
      </svg>
      {p.label}
      <span className="sr-only"> priority</span>
    </span>
  );
}

export function GapList({ gaps, requirements }: { gaps: Review["gaps"]; requirements: string[] }) {
  const reduce = useReducedMotion();
  const counts = { high: 0, medium: 0, low: 0 } as Record<Priority, number>;
  gaps.forEach((g) => counts[g.priority]++);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        <span className="folio mr-1 self-center">The JD asks for</span>
        {requirements.map((r) => (
          <span key={r} className="rounded-[2px] border border-rule bg-card px-2 py-0.5 text-sm text-ink-2">
            {r}
          </span>
        ))}
      </div>

      {gaps.length === 0 ? (
        <p className="rounded-[6px] border border-rule bg-card p-5 text-ink-2">No gaps found. The resume covers every requirement the model extracted.</p>
      ) : (
        <>
          <p className="mb-3 font-mono text-xs text-muted">
            {counts.high} high · {counts.medium} medium · {counts.low} low, sorted by priority
          </p>
          <ol className="grid gap-3">
            {gaps.map((g, i) => (
              <motion.li
                key={`${g.gap}-${i}`}
                initial={{ opacity: 0, x: reduce ? 0 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: reduce ? 0 : 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduce ? undefined : { y: -3 }}
                className={`group relative flex items-start gap-4 rounded-[6px] border border-rule bg-card px-4 py-4 transition-shadow duration-150 hover:shadow-lift ${
                  g.priority === "high" ? "border-l-[3px] border-l-accent" : ""
                }`}
              >
                <span className="mt-0.5 w-6 shrink-0 font-mono text-xs text-muted tabular">{String(i + 1).padStart(2, "0")}</span>
                <p className="flex-1 text-[0.95rem] text-ink">{g.gap}</p>
                <PriorityPill priority={g.priority} />
              </motion.li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
