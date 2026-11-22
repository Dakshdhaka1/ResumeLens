"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { MetricChart } from "@/components/eval/MetricChart";
import { api, type EvalRow } from "@/lib/api";
import { caseScores, summarise, type Summary } from "@/lib/metrics";

const fmt = (v: number | null, unit = "") => (v === null ? "n/a" : `${v}${unit}`);

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="border-l border-rule pl-4 first:border-l-0 first:pl-0 sm:first:border-l sm:first:pl-4 lg:first:border-l-0 lg:first:pl-0">
      <p className="folio">{label}</p>
      <p className="mt-2 font-mono text-4xl font-medium tracking-[-0.03em] tabular text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{note}</p>
    </div>
  );
}

function best(summary: Summary[], key: keyof Summary, lower = false) {
  const vals = summary.filter((s) => s[key] !== null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => ((lower ? (b[key] as number) < (a[key] as number) : (b[key] as number) > (a[key] as number)) ? b : a));
}

export default function EvalPage() {
  const reduce = useReducedMotion();
  const [data, setData] = useState<{ rows: EvalRow[]; demo: boolean; source: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.evalResults().then(setData).catch((e: Error) => setError(e.message));
  }, []);

  const summary = useMemo(() => (data ? summarise(data.rows) : []), [data]);
  const cases = useMemo(() => (data ? caseScores(data.rows) : []), [data]);
  const total = data?.rows.length ?? 0;
  const mostValid = best(summary, "json_first");
  const steadiest = best(summary, "score_std", true);

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
      <div className="grid gap-6 border-b border-rule pb-8 pt-12 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <p className="folio">Evaluation · eval/results.csv</p>
          <h1 className="display mt-3 text-[clamp(2.6rem,6vw,4.6rem)]">
            Did the prompt changes <span className="italic text-accent-ink">actually help?</span>
          </h1>
        </div>
        <p className="text-ink-2 md:col-span-4">
          Every prompt version × both models × 10 made-up test cases × 3 runs. Lower variance, fewer fabrications and zero successful injections are the goal.
          <span className="mt-2 block font-mono text-xs text-muted">v1 Basic · v2 Structured · v3 Guarded</span>
        </p>
      </div>

      {data?.demo && (
        <div role="note" className="mt-6 flex items-start gap-3 rounded-[6px] border border-med-fg/40 bg-med-bg/60 px-4 py-3 text-sm">
          <span className="folio mt-0.5 !text-med-fg">Demo data</span>
          <p className="text-ink">
            These numbers come from the offline <strong>mock model</strong> ({data.source}), not a real LLM, so every version looks identical. Run{" "}
            <code className="rounded-[2px] bg-card px-1 font-mono text-xs">python eval/run_eval.py</code> with API keys to fill this page with real results.
          </p>
        </div>
      )}
      {error && <p className="mt-6 rounded-[6px] border border-high-fg/40 bg-high-bg/60 p-4 text-sm text-high-fg">{error}</p>}
      {data && !total && (
        <p className="mt-6 rounded-[6px] border border-dashed border-rule p-8 text-ink-2">
          No results yet. Run <code className="font-mono">python eval/run_eval.py</code> (or <code className="font-mono">--mock</code> for a demo).
        </p>
      )}

      {total > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4"
          >
            <Stat label="Calls recorded" value={String(total)} note={`${summary.length} model × prompt groups`} />
            <Stat label="Most valid JSON" value={mostValid ? fmt(mostValid.json_first, "%") : "n/a"} note={mostValid ? `${mostValid.model} ${mostValid.prompt_version}, first try` : ""} />
            <Stat label="Most consistent" value={steadiest ? `±${steadiest.score_std}` : "n/a"} note={steadiest ? `${steadiest.model} ${steadiest.prompt_version}, score std-dev` : "needs ≥2 runs"} />
            <Stat
              label="Injection resisted"
              value={fmt(
                (() => {
                  const v = summary.map((s) => s.injection_success).filter((x): x is number => x !== null);
                  return v.length ? Math.round(10 * (100 - v.reduce((a, b) => a + b, 0) / v.length)) / 10 : null;
                })(),
                "%",
              )}
              note="of runs on the injection case, all groups"
            />
          </motion.div>

          <section className="mt-12 grid gap-4 md:grid-cols-2" aria-label="Charts">
            <MetricChart title="Valid JSON on first try" hint="Higher is better. Parsed and passed the schema without a retry." metric="json_first" summary={summary} unit="%" domain={[0, 100]} />
            <MetricChart title="Score consistency" hint="Std-dev of the score across 3 runs of the same case. Lower is better." metric="score_std" summary={summary} />
            <MetricChart title="Fabrication flags" hint="Share of replies where a rewrite adds a number/tool not in the resume. Lower is better." metric="fabrication" summary={summary} unit="%" domain={[0, 100]} />
            <MetricChart title="Injection succeeded" hint="Runs on 09_injection scoring 70 or more. Lower is better." metric="injection_success" summary={summary} unit="%" domain={[0, 100]} />
            <MetricChart title="Arithmetic correct" hint="First reply's score equals the sum of the criteria. Higher is better." metric="arithmetic" summary={summary} unit="%" domain={[0, 100]} />
            <MetricChart title="Latency per call" hint="Mean seconds, including any retry. Lower is faster." metric="latency" summary={summary} unit="s" />
          </section>

          <section className="mt-14" aria-labelledby="table-h">
            <div className="mb-4 flex items-baseline justify-between border-b border-ink pb-2">
              <h2 id="table-h" className="font-display text-3xl font-semibold tracking-[-0.025em]">
                Summary <span className="italic">table</span>
              </h2>
              <span className="folio">same numbers as eval/REPORT.md</span>
            </div>
            <div className="overflow-x-auto rounded-[6px] border border-rule bg-card">
              <table className="w-full min-w-[56rem] text-sm">
                <thead className="border-b border-rule text-left text-xs text-muted">
                  <tr>
                    {["Model", "Prompt", "Calls", "JSON 1st", "JSON retry", "Arithmetic", "Score std", "In band", "Fabrication", "Injection ok?", "Injection flagged", "Latency"].map((h) => (
                      <th key={h} className="px-3 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular">
                  {summary.map((s) => (
                    <tr key={`${s.model}${s.prompt_version}`} className="transition-colors hover:bg-paper-2/60">
                      <td className="px-3 py-2.5 font-sans">
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-[2px] align-middle" style={{ background: `var(--series-${s.model})` }} />
                        {s.model}
                      </td>
                      <td className="px-3 py-2.5">{s.prompt_version}</td>
                      <td className="px-3 py-2.5">{s.calls}</td>
                      <td className="px-3 py-2.5">{fmt(s.json_first, "%")}</td>
                      <td className="px-3 py-2.5">{fmt(s.json_retry, "%")}</td>
                      <td className="px-3 py-2.5">{fmt(s.arithmetic, "%")}</td>
                      <td className="px-3 py-2.5">{fmt(s.score_std)}</td>
                      <td className="px-3 py-2.5">{fmt(s.in_band, "%")}</td>
                      <td className="px-3 py-2.5">{fmt(s.fabrication, "%")}</td>
                      <td className="px-3 py-2.5">{s.injection_success === null ? "n/a" : `${Math.round(100 - s.injection_success)}% resisted`}</td>
                      <td className="px-3 py-2.5">{fmt(s.injection_detected, "%")}</td>
                      <td className="px-3 py-2.5">{fmt(s.latency, "s")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-14" aria-labelledby="cases-h">
            <div className="mb-4 flex items-baseline justify-between border-b border-ink pb-2">
              <h2 id="cases-h" className="font-display text-3xl font-semibold tracking-[-0.025em]">
                Score per <span className="italic">test case</span>
              </h2>
              <span className="folio">mean of runs · outlined = outside expected band</span>
            </div>
            <div className="overflow-x-auto rounded-[6px] border border-rule bg-card">
              <table className="w-full min-w-[52rem] text-sm">
                <thead className="border-b border-rule text-left text-xs text-muted">
                  <tr>
                    <th className="px-3 py-3 font-medium">Case</th>
                    <th className="px-3 py-3 font-medium">Expected</th>
                    {summary.map((s) => (
                      <th key={`${s.model}${s.prompt_version}`} className="px-3 py-3 text-right font-mono font-medium">
                        {s.model.slice(0, 3)} {s.prompt_version}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {cases.map(([id, c]) => (
                    <tr key={id}>
                      <td className="px-3 py-2.5 font-mono text-xs">{id}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-muted">{c.band[0]}–{c.band[1]}</td>
                      {summary.map((s) => {
                        const vals = c.scores.get(`${s.model}|${s.prompt_version}`);
                        const m = vals?.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
                        const out = m !== null && (m < c.band[0] || m > c.band[1]);
                        return (
                          <td key={s.model + s.prompt_version} className="px-3 py-2 text-right font-mono tabular">
                            <span className={`inline-block min-w-[2.4rem] rounded-[2px] px-1.5 py-0.5 ${out ? "outline outline-1 outline-accent text-accent-ink" : ""}`}>
                              {m ?? "n/a"}
                            </span>
                            {out && <span className="sr-only"> (outside expected band)</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
