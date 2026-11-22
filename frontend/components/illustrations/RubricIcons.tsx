// Line icons for the four rubric criteria (1.5px ink strokes + one accent detail).
import type { CriterionKey } from "@/lib/api";

const common = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-full w-full",
};

function Skills() {
  // two interlocking tags
  return (
    <svg {...common} aria-hidden>
      <path d="M4 9.5V5h4.5l9 9-4.5 4.5z" />
      <circle cx="7.5" cy="8.5" r="1" />
      <path d="M13 12.5V8h4.5l9 9-4.5 4.5-9-9z" />
      <circle cx="16.5" cy="11.5" r="1.3" fill="var(--accent)" stroke="none" />
      <path d="M8 27h16" />
    </svg>
  );
}

function Projects() {
  // stacked sheets
  return (
    <svg {...common} aria-hidden>
      <rect x="9" y="4" width="16" height="20" rx="1.5" />
      <path d="M6 8v18.5A1.5 1.5 0 0 0 7.5 28H21" />
      <path d="M13 10h8M13 14h8M13 18h4" />
      <path d="M19 18h2" stroke="var(--accent)" strokeWidth="2" />
    </svg>
  );
}

function Bullets() {
  // a list with a pen
  return (
    <svg {...common} aria-hidden>
      <circle cx="6" cy="8" r="1.2" fill="currentColor" />
      <circle cx="6" cy="15" r="1.2" fill="currentColor" />
      <circle cx="6" cy="22" r="1.2" fill="currentColor" />
      <path d="M10 8h10M10 15h6M10 22h5" />
      <path d="M19 25l1-4 7-7 3 3-7 7z" />
      <path d="M25 16l3 3" stroke="var(--accent)" strokeWidth="2" />
    </svg>
  );
}

function Formatting() {
  // ruler + page margins
  return (
    <svg {...common} aria-hidden>
      <rect x="5" y="5" width="16" height="22" rx="1.5" />
      <path d="M9 5v22" strokeDasharray="1.5 2" stroke="var(--accent)" />
      <path d="M12 10h6M12 14h6M12 18h4" />
      <rect x="23" y="5" width="5" height="22" rx="1" />
      <path d="M23 9h2M23 13h3M23 17h2M23 21h3" />
    </svg>
  );
}

export function RubricIcon({ criterion, className = "" }: { criterion: CriterionKey; className?: string }) {
  const Icon = { skills_match: Skills, projects_experience: Projects, bullet_clarity: Bullets, formatting_length: Formatting }[criterion];
  return (
    <span className={`inline-block ${className}`}>
      <Icon />
    </span>
  );
}
