"use client";

// Grouped bars: x = prompt version, one bar per model. Colours are the
// validated series tokens from DESIGN.md. Values are direct-labelled and a
// hover tooltip shows the exact numbers.
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { VERSION_INFO } from "@/components/analyze/options";
import type { Version } from "@/lib/api";
import type { Summary } from "@/lib/metrics";

const MODELS = [
  { key: "gemini", label: "Gemini", color: "var(--series-gemini)" },
  { key: "groq", label: "GPT-OSS (Groq)", color: "var(--series-groq)" },
  { key: "claude", label: "Claude", color: "var(--series-claude)" },
];

type Props = {
  title: string;
  hint: string;
  metric: keyof Summary;
  summary: Summary[];
  unit?: string;
  domain?: [number, number];
};

type TooltipProps = { active?: boolean; payload?: { dataKey: string; value: number | null; color: string }[]; label?: string; unit?: string };

function ChartTooltip({ active, payload, label, unit = "" }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[4px] border border-rule bg-card px-3 py-2 text-xs shadow-lift">
      <p className="mb-1 font-mono text-muted">Prompt {label} {VERSION_INFO[label as Version]?.name}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-ink">
          <span className="h-2 w-2 rounded-[1px]" style={{ background: p.color }} />
          {MODELS.find((m) => m.key === p.dataKey)?.label}
          <span className="ml-auto pl-4 font-mono tabular">{p.value === null ? "n/a" : `${p.value}${unit}`}</span>
        </p>
      ))}
    </div>
  );
}

export function MetricChart({ title, hint, metric, summary, unit = "", domain }: Props) {
  const versions = [...new Set(summary.map((s) => s.prompt_version))].sort();
  const data = versions.map((v) => {
    const row: Record<string, string | number | null> = { version: v };
    MODELS.forEach((m) => {
      const s = summary.find((x) => x.model === m.key && x.prompt_version === v);
      row[m.key] = s ? (s[metric] as number | null) : null;
    });
    return row;
  });
  const present = MODELS.filter((m) => summary.some((s) => s.model === m.key));

  return (
    <figure className="flex flex-col rounded-[6px] border border-rule bg-card p-5">
      <figcaption>
        <h3 className="font-display text-xl font-semibold tracking-[-0.015em]">{title}</h3>
        <p className="mt-0.5 text-xs text-muted">{hint}</p>
      </figcaption>
      <div className="mt-3 flex gap-4 text-xs text-ink-2" aria-hidden>
        {present.map((m) => (
          <span key={m.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: m.color }} />
            {m.label}
          </span>
        ))}
      </div>
      <div className="mt-2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 18, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--rule)" strokeWidth={0.6} />
            <XAxis dataKey="version" tickFormatter={(v: string) => `${v} ${VERSION_INFO[v as Version]?.name ?? ""}`} tickLine={false} axisLine={{ stroke: "var(--rule)" }} tick={{ fill: "var(--ink-2)", fontSize: 12, fontFamily: "var(--font-mono)" }} />
            <YAxis tickLine={false} axisLine={false} domain={domain ?? [0, "auto"]} tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} width={44} />
            <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: "var(--paper-2)", opacity: 0.7 }} />
            {present.map((m) => (
              <Bar key={m.key} dataKey={m.key} fill={m.color} radius={[4, 4, 0, 0]} maxBarSize={34} isAnimationActive animationDuration={700}>
                <LabelList
                  dataKey={m.key}
                  position="top"
                  formatter={(v: number | null) => (v === null || v === undefined ? "n/a" : `${v}${unit}`)}
                  style={{ fill: "var(--ink-2)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
