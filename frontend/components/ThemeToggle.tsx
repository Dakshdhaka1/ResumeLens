"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme as Theme | undefined;
  if (set) return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme(currentTheme()), []);

  const toggle = () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("rl-theme", next); // a display preference only, never user data
    } catch {}
    setTheme(next);
  };

  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to paper (light) theme" : "Switch to ink (dark) theme"}
      className="group relative grid h-9 w-9 place-items-center rounded-[6px] border border-rule text-ink transition-colors hover:border-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        {/* a half-inked circle: paper on one side, ink on the other */}
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" className="transition-transform duration-300 ease-out-lens origin-center group-hover:rotate-180" style={{ transformBox: "fill-box" }} />
      </svg>
    </button>
  );
}

// Inline script for <head>: applies the saved theme before first paint (no flash).
export const themeInitScript = `try{var t=localStorage.getItem('rl-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;
