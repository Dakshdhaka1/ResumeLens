// Logo mark: a lens over two ruled lines, with the accent "found" dot.
export function LensMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <circle cx="13.5" cy="13.5" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M20.2 20.2 28 28" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M8.5 11.5h8M8.5 15.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17.2" cy="15.5" r="1.7" fill="var(--accent)" />
    </svg>
  );
}
