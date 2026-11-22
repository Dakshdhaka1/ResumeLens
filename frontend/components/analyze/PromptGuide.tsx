"use client";

// Explains the three prompt versions in plain language. Clicking a card
// selects that version. Opened from the "What do these mean?" link.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Version } from "@/lib/api";
import { VERSION_INFO } from "./options";

type Props = {
  open: boolean;
  value?: Version; // highlights the selected card
  onSelect?: (v: Version) => void; // omit to make the cards read-only
  onClose: () => void;
};

export function PromptGuide({ open, value, onSelect, onClose }: Props) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.section
          id="prompt-guide"
          aria-label="What the prompt versions mean"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="mt-6 rounded-[6px] border border-rule bg-paper-2/60 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <p className="folio">Prompt versions</p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
                  Same task, written three ways
                </h2>
                <p className="mt-1.5 text-sm text-ink-2">
                  A <em>prompt</em> is the instruction ResumeLens sends to the AI along with your resume. Each version is a better-written
                  instruction than the one before. <strong className="font-medium text-ink">For feedback on your resume, use v3.</strong> v1 and v2
                  are there so you can see how prompt design changes the result.
                </p>
              </div>
              <button type="button" onClick={onClose} className="rounded-[4px] px-2 py-1 text-sm text-muted transition-colors hover:text-ink">
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {(["v1", "v2", "v3"] as Version[]).map((v, i) => {
                const info = VERSION_INFO[v];
                const active = v === value;
                const Card = onSelect ? motion.button : motion.div;
                return (
                  <Card
                    key={v}
                    {...(onSelect ? { type: "button" as const, "aria-pressed": active, onClick: () => onSelect(v) } : {})}
                    initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: reduce ? 0 : 0.08 + i * 0.06 }}
                    className={`group relative flex flex-col rounded-[6px] border bg-card p-4 text-left transition-[border-color,box-shadow] duration-150 ${onSelect ? "hover:shadow-lift" : ""} ${
                      active ? "border-ink ring-1 ring-ink" : "border-rule hover:border-ink/60"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex items-baseline gap-2">
                        <span className="font-mono text-sm text-accent-ink">{v}</span>
                        <span className="font-display text-xl font-semibold tracking-[-0.015em]">{info.name}</span>
                      </span>
                      {info.recommended && (
                        <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-on-accent">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-ink">{info.oneLine}</p>
                    <ul className="mt-3 grid gap-1.5 text-sm text-ink-2">
                      {info.what.map((w) => (
                        <li key={w} className="flex gap-2">
                          <span aria-hidden className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-ink-2" />
                          {w}
                        </li>
                      ))}
                    </ul>
                    <dl className="mt-auto grid gap-1 border-t border-rule pt-3 text-xs">
                      <div>
                        <dt className="folio inline">Use it for </dt>
                        <dd className="inline text-ink">{info.useFor}</dd>
                      </div>
                      <div>
                        <dt className="folio inline">Expect </dt>
                        <dd className="inline text-ink-2">{info.expect}</dd>
                      </div>
                    </dl>
                    {onSelect && (
                      <span className={`mt-3 text-xs font-medium ${active ? "text-ink" : "text-muted group-hover:text-ink"}`}>
                        {active ? "Selected" : `Use ${v}`}
                      </span>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

export function PromptGuideToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="prompt-guide"
      className="inline-flex items-center gap-1.5 text-xs text-muted underline decoration-rule underline-offset-4 transition-colors hover:text-ink hover:decoration-accent"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6.3 6.2a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.7.6-.7 1.1v.3M8 11.2v.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      {open ? "Hide explanation" : "What do v1, v2, v3 mean?"}
    </button>
  );
}
