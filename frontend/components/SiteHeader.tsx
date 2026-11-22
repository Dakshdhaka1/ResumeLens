"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { LensMark } from "./illustrations/LensMark";

const NAV = [
  { href: "/analyze", label: "Analyze" },
  { href: "/compare", label: "Compare" },
  { href: "/eval", label: "Evaluation" },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="relative z-20 border-b border-rule">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-4 px-4 sm:h-16 sm:flex-nowrap sm:px-6">
        <Link href="/" className="group flex h-14 items-center gap-2.5 sm:h-auto" aria-label="ResumeLens home">
          <LensMark className="h-7 w-7 text-ink transition-transform duration-300 ease-out-lens group-hover:-rotate-12" />
          <span className="font-display text-[1.35rem] font-semibold tracking-[-0.03em]">
            Resume<span className="italic text-accent-ink">Lens</span>
          </span>
        </Link>

        <nav aria-label="Main" className="-mx-2.5 flex h-11 w-[calc(100%+1.25rem)] items-center gap-1 border-t border-rule sm:mx-0 sm:h-auto sm:w-auto sm:gap-2 sm:border-t-0">
          {NAV.map((item) => {
            const active = path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative px-2.5 py-1.5 text-sm transition-colors sm:px-3 ${active ? "text-ink" : "text-muted hover:text-ink"}`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-2.5 -bottom-[11px] h-[2px] bg-accent sm:inset-x-3 sm:-bottom-[17px]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </Link>
            );
          })}
          <span className="mx-1 hidden h-5 w-px bg-rule sm:block" />
          <span className="ml-auto sm:ml-0">
            <ThemeToggle />
          </span>
        </nav>
      </div>
    </header>
  );
}
