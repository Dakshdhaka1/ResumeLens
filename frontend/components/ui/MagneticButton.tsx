"use client";

// A button (or link) that leans a few pixels toward the cursor on hover.
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "accent" | "ink" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

const STYLES = {
  accent: "bg-accent text-on-accent hover:shadow-lift",
  ink: "bg-ink text-paper hover:shadow-lift",
  ghost: "border border-rule text-ink hover:border-ink",
};

export function MagneticButton({ children, href, onClick, variant = "accent", type = "button", disabled, className = "", ariaLabel }: Props) {
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 420, damping: 34 });
  const y = useSpring(useMotionValue(0), { stiffness: 420, damping: 34 });

  const onMove = (e: MouseEvent<HTMLElement>) => {
    if (reduce || disabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.18);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.28);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const cls = `group inline-flex items-center justify-center gap-2.5 rounded-[6px] px-5 py-3 text-[0.95rem] font-medium transition-[box-shadow,border-color,opacity] duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${STYLES[variant]} ${className}`;
  const inner = (
    <>
      {children}
    </>
  );

  return (
    <motion.span style={{ x, y }} className="inline-flex" onMouseMove={onMove} onMouseLeave={reset}>
      {href ? (
        <Link href={href} className={cls} aria-label={ariaLabel}>
          {inner}
        </Link>
      ) : (
        <motion.button type={type} onClick={onClick} disabled={disabled} className={cls} aria-label={ariaLabel} whileTap={reduce ? undefined : { scale: 0.97 }}>
          {inner}
        </motion.button>
      )}
    </motion.span>
  );
}

export function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
