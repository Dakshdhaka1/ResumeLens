"use client";

// Before/after card for one rewritten bullet. Flipping between them plays a
// left-to-right "wipe" (a clip-path reveal with an accent edge). Words that
// changed are highlighted using a simple word-level diff (LCS).
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

type Token = { word: string; changed: boolean };

function tokens(s: string) {
  return s.split(/(\s+)/).filter(Boolean);
}
const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}+#.]/gu, "");

/** Marks words in `a` that are not part of the longest common subsequence with `b`. */
function diff(a: string, b: string): Token[] {
  const A = tokens(a);
  const B = tokens(b).filter((t) => t.trim());
  const words = A.filter((t) => t.trim());
  const n = words.length;
  const m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = norm(words[i]) === norm(B[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const keep = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (norm(words[i]) === norm(B[j])) {
      keep.add(i);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  let w = -1;
  return A.map((t) => {
    if (!t.trim()) return { word: t, changed: false };
    w++;
    return { word: t, changed: !keep.has(w) };
  });
}

type Props = {
  index: number;
  old: string;
  next: string;
  sourceLine?: string | null;
  unsupported?: string[];
};

export function BulletRewrite({ index, old, next, sourceLine, unsupported = [] }: Props) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<"new" | "old">("new");
  const shown = view === "new" ? diff(next, old) : diff(old, next);

  return (
    <motion.article
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: reduce ? 0 : 0.15 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col rounded-[6px] border border-rule bg-card"
    >
      <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
        <span className="font-mono text-xs text-muted">Bullet {String(index + 1).padStart(2, "0")}</span>
        <div role="group" aria-label={`Show original or rewritten bullet ${index + 1}`} className="relative flex rounded-[4px] bg-paper-2 p-0.5">
          {(["old", "new"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`relative z-10 rounded-[3px] px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${view === v ? "text-paper" : "text-muted hover:text-ink"}`}
            >
              {view === v && (
                <motion.span layoutId={`bullet-toggle-${index}`} className="absolute inset-0 -z-10 rounded-[3px] bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
              )}
              {v === "old" ? "Before" : "After"}
            </button>
          ))}
        </div>
      </header>

      <div className="relative min-h-[6.5rem] flex-1 overflow-hidden px-4 py-4">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={view}
            className={`relative text-[1.02rem] leading-relaxed ${view === "old" ? "text-ink-2" : "text-ink"}`}
            initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 100% 0 0)" }}
            animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0% 0 0)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: reduce ? 0.2 : 0.55, ease: [0.65, 0, 0.35, 1] }}
          >
            {view === "old" && <span className="sr-only">Original: </span>}
            {view === "new" && <span className="sr-only">Rewritten: </span>}
            {shown.map((t, i) =>
              t.changed ? (
                view === "new" ? (
                  <mark key={i} className="rounded-[2px] bg-accent/15 px-0.5 text-ink underline decoration-accent decoration-2 underline-offset-[5px]">
                    {t.word}
                  </mark>
                ) : (
                  <span key={i} className="text-muted line-through decoration-accent/70">
                    {t.word}
                  </span>
                )
              ) : (
                <span key={i}>{t.word}</span>
              ),
            )}
          </motion.p>
        </AnimatePresence>
        {!reduce && (
          <motion.span
            key={`edge-${view}`}
            aria-hidden
            className="pointer-events-none absolute inset-y-3 w-[2px] bg-accent"
            initial={{ left: "0%", opacity: 1 }}
            animate={{ left: "100%", opacity: [1, 1, 0] }}
            transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
          />
        )}
      </div>

      <footer className="flex flex-col gap-1.5 border-t border-rule px-4 py-2.5 text-xs">
        {unsupported.length > 0 ? (
          <p className="flex items-start gap-2 text-high-fg">
            <svg width="14" height="14" viewBox="0 0 14 14" className="mt-px shrink-0" aria-hidden>
              <path d="M7 1 13 12.5H1z" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <path d="M7 5.5v3M7 10.2v.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span>
              Check before using: <strong className="font-mono">{unsupported.join(", ")}</strong> isn&apos;t in your resume.
            </span>
          </p>
        ) : (
          <p className="text-muted">
            <span className="text-low-fg">✓</span> Every number and tool in the rewrite appears in your resume.
          </p>
        )}
        {sourceLine && sourceLine !== old && (
          <p className="truncate text-muted" title={sourceLine}>
            Source line: <span className="font-mono">{sourceLine}</span>
          </p>
        )}
      </footer>
    </motion.article>
  );
}
