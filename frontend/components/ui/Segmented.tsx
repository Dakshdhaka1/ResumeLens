"use client";

// Segmented control = an accessible radio group with a sliding indicator
// (Framer Motion layoutId). Arrow keys move the selection.
import { motion } from "framer-motion";
import { useId, useRef, type KeyboardEvent } from "react";

type Option<T extends string> = { value: T; label: string; hint?: string };

type Props<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
};

export function Segmented<T extends string>({ label, options, value, onChange, size = "md" }: Props<T>) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, index: number) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="folio">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={`${id}-label`} className="relative inline-flex w-fit rounded-[6px] border border-rule bg-paper-2 p-1">
        {options.map((opt, i) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              title={opt.hint}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => onKey(e, i)}
              className={`relative z-10 rounded-[4px] font-mono tracking-wide transition-colors duration-150 ${
                size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-[0.8rem]"
              } ${active ? "text-paper" : "text-muted hover:text-ink"}`}
            >
              {active && (
                <motion.span
                  layoutId={`seg-${id}`}
                  className="absolute inset-0 -z-10 rounded-[4px] bg-ink"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
