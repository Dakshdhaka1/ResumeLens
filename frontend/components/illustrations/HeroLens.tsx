"use client";

// Hero illustration: a stylised resume sheet with a lens sweeping over it.
// Under the lens the content is "inked" in the accent colour, like the lens is
// highlighting what matters. The clip circle and the lens share keyframes.
import { motion, useReducedMotion } from "framer-motion";

type Line = { x: number; y: number; w: number; h?: number; strong?: boolean };

// Sheet content, in sheet coordinates (sheet is 300 x 400, placed at 90,70).
const LINES: Line[] = [
  { x: 28, y: 34, w: 130, h: 12, strong: true }, // name
  { x: 28, y: 54, w: 190, h: 4 },
  // section: education
  { x: 28, y: 86, w: 64, h: 6, strong: true },
  { x: 28, y: 102, w: 220, h: 4 },
  { x: 28, y: 114, w: 160, h: 4 },
  // section: skills
  { x: 28, y: 146, w: 48, h: 6, strong: true },
  { x: 28, y: 162, w: 40, h: 10 }, { x: 74, y: 162, w: 52, h: 10 }, { x: 132, y: 162, w: 36, h: 10 },
  { x: 174, y: 162, w: 58, h: 10 },
  // section: projects
  { x: 28, y: 198, w: 72, h: 6, strong: true },
  { x: 40, y: 216, w: 208, h: 4 }, { x: 40, y: 228, w: 170, h: 4 },
  { x: 40, y: 246, w: 220, h: 4 }, { x: 40, y: 258, w: 120, h: 4 },
  { x: 40, y: 276, w: 196, h: 4 },
  // section: experience
  { x: 28, y: 308, w: 86, h: 6, strong: true },
  { x: 40, y: 326, w: 214, h: 4 }, { x: 40, y: 338, w: 150, h: 4 },
  { x: 40, y: 356, w: 182, h: 4 },
];
const BULLETS = [216, 246, 276, 326, 356];

const SHEET_X = 90;
const SHEET_Y = 70;

// Lens path (centre points in svg coords) and timing.
const PATH_X = [200, 300, 220, 310, 200];
const PATH_Y = [180, 250, 330, 400, 180];
const DURATION = 14;

function SheetContent({ ink, highlight = false }: { ink: string; highlight?: boolean }) {
  return (
    <g transform={`translate(${SHEET_X} ${SHEET_Y})`}>
      {LINES.map((l, i) => (
        <rect
          key={i}
          x={l.x}
          y={l.y}
          width={l.w}
          height={l.h ?? 4}
          rx={l.h && l.h >= 10 ? 5 : 1.5}
          fill={l.h === 10 ? "none" : ink}
          stroke={l.h === 10 ? ink : "none"}
          strokeWidth={l.h === 10 ? 1.2 : 0}
          opacity={l.strong || highlight ? 1 : 0.55}
        />
      ))}
      {BULLETS.map((y) => (
        <circle key={y} cx={31} cy={y + 2} r={2.2} fill={ink} />
      ))}
    </g>
  );
}

export function HeroLens({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const anim = reduce
    ? undefined
    : { duration: DURATION, repeat: Infinity, ease: "easeInOut" as const, times: [0, 0.25, 0.5, 0.75, 1] };

  return (
    <svg viewBox="0 0 480 560" className={className} role="img" aria-labelledby="hero-title">
      <title id="hero-title">A resume sheet under a magnifying lens that highlights its key lines</title>
      <defs>
        <clipPath id="lens-clip">
          <motion.circle
            r="62"
            initial={{ cx: PATH_X[0], cy: PATH_Y[0] }}
            animate={reduce ? undefined : { cx: PATH_X, cy: PATH_Y }}
            transition={anim}
          />
        </clipPath>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--rule)" strokeWidth="1.2" />
        </pattern>
      </defs>

      {/* back sheet, offset like a stack of paper */}
      <rect x={SHEET_X + 16} y={SHEET_Y + 14} width="300" height="400" rx="4" fill="url(#hatch)" stroke="var(--rule)" />
      {/* the resume sheet */}
      <rect x={SHEET_X} y={SHEET_Y} width="300" height="400" rx="4" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.5" />
      <path d={`M${SHEET_X + 300 - 34} ${SHEET_Y} v26 a8 8 0 0 0 8 8 h26`} fill="var(--paper-2)" stroke="var(--ink)" strokeWidth="1.5" />
      <SheetContent ink="var(--ink)" />

      {/* margin note in accent: the "gap" the lens found */}
      <g transform={`translate(${SHEET_X + 300 + 10} ${SHEET_Y + 238})`}>
        <path d="M0 12 h18" stroke="var(--accent)" strokeWidth="1.5" />
        <rect x="20" y="0" width="54" height="24" rx="12" fill="var(--high-bg)" stroke="var(--accent)" strokeWidth="1.2" />
        <text x="47" y="16" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--high-fg)" letterSpacing="1">
          GAP
        </text>
      </g>

      {/* magnified / highlighted content inside the lens */}
      <g clipPath="url(#lens-clip)">
        <rect x="0" y="0" width="480" height="560" fill="var(--card)" />
        <SheetContent ink="var(--accent)" highlight />
      </g>

      {/* the lens itself */}
      <motion.g
        initial={{ x: PATH_X[0], y: PATH_Y[0] }}
        animate={reduce ? undefined : { x: PATH_X, y: PATH_Y }}
        transition={anim}
      >
        <circle r="62" fill="none" stroke="var(--ink)" strokeWidth="7" />
        <circle r="56" fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.8" />
        <path d="M-34 -30 a46 46 0 0 1 22 -16" stroke="var(--card)" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9" />
        <g transform="rotate(42)">
          <rect x="64" y="-9" width="18" height="18" rx="2" fill="var(--ink)" />
          <rect x="80" y="-11" width="84" height="22" rx="11" fill="var(--ink)" />
          <rect x="92" y="-3" width="56" height="6" rx="3" fill="var(--accent)" opacity="0.85" />
        </g>
      </motion.g>

      {/* score stamp */}
      <g transform="translate(78 438) rotate(-8)">
        <circle r="38" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
        <circle r="31" fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 3" />
        <text y="6" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="20" fontWeight="600" fill="var(--ink)">
          72
        </text>
        <text y="22" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" letterSpacing="1.5" fill="var(--muted)">
          /100
        </text>
      </g>
    </svg>
  );
}
