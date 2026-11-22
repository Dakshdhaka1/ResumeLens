// Empty state: a blank ruled sheet with the lens resting on it, waiting.
export function EmptyStateArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 180" fill="none" className={className} aria-hidden>
      <rect x="44" y="18" width="120" height="150" rx="3" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.5" />
      {[44, 60, 76, 92, 108, 124, 140].map((y) => (
        <path key={y} d={`M58 ${y}h92`} stroke="var(--rule)" strokeWidth="1.2" />
      ))}
      <path d="M58 30v130" stroke="var(--accent)" strokeOpacity="0.45" />
      <path d="M66 44h40" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.2" />
      <g transform="translate(160 112) rotate(-18)">
        <circle r="30" fill="var(--paper)" fillOpacity="0.6" stroke="var(--ink)" strokeWidth="5" />
        <circle r="25" stroke="var(--accent)" strokeOpacity="0.7" />
        <rect x="31" y="-6" width="44" height="12" rx="6" fill="var(--ink)" />
      </g>
      <path d="M20 168h200" stroke="var(--rule)" strokeWidth="1.2" />
    </svg>
  );
}
