"use client";

import type { Sample } from "@/lib/api";

type Props = {
  samples: Sample[];
  selected: string;
  onSelect: (id: string) => void;
  onLoad: () => void;
  error?: string | null;
};

export function SamplePicker({ samples, selected, onSelect, onLoad, error }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="sample" className="folio">
        Made-up sample
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <select
            id="sample"
            value={selected}
            onChange={(e) => onSelect(e.target.value)}
            disabled={!samples.length}
            className="w-full appearance-none truncate rounded-[6px] border border-rule bg-card py-1.5 pl-3 pr-8 text-sm text-ink transition-colors hover:border-ink disabled:opacity-50"
          >
            {!samples.length && <option>{error ? "Backend offline" : "Loading…"}</option>}
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
        <button
          type="button"
          onClick={onLoad}
          disabled={!samples.length}
          className="shrink-0 rounded-[6px] border border-ink px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
        >
          Load both
        </button>
      </div>
    </div>
  );
}
