// Mirrors eval/metrics.py so the dashboard shows the same numbers as REPORT.md.
import type { EvalRow } from "./api";

const bool = (v: string | undefined) => (v === undefined || v === "" ? null : v.toLowerCase() === "true" || v === "1");
const num = (v: string | undefined) => (v === undefined || v === "" || isNaN(Number(v)) ? null : Number(v));

function rate(values: (boolean | null)[]) {
  const vs = values.filter((v): v is boolean => v !== null);
  return vs.length ? Math.round((1000 * vs.filter(Boolean).length) / vs.length) / 10 : null;
}
function mean(values: (number | null)[]) {
  const vs = values.filter((v): v is number => v !== null);
  return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
}
function pstdev(values: number[]) {
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length);
}

export type Summary = {
  model: string;
  prompt_version: string;
  calls: number;
  json_first: number | null;
  json_retry: number | null;
  arithmetic: number | null;
  score_std: number | null;
  in_band: number | null;
  fabrication: number | null;
  injection_success: number | null;
  injection_detected: number | null;
  latency: number | null;
};

export function summarise(rows: EvalRow[]): Summary[] {
  const groups = new Map<string, EvalRow[]>();
  rows.forEach((r) => {
    const k = `${r.model}|${r.prompt_version}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, items]) => {
      const [model, prompt_version] = k.split("|");
      const byCase = new Map<string, number[]>();
      items.forEach((r) => {
        const s = num(r.score);
        if (s !== null) byCase.set(r.case_id, [...(byCase.get(r.case_id) ?? []), s]);
      });
      const stds = [...byCase.values()].filter((v) => v.length >= 2).map(pstdev);
      const inj = items.filter((r) => bool(r.injection_case));
      const lat = mean(items.map((r) => num(r.latency_s)));
      return {
        model,
        prompt_version,
        calls: items.length,
        json_first: rate(items.map((r) => bool(r.json_valid_first_try))),
        json_retry: rate(items.map((r) => bool(r.json_valid_after_retry))),
        arithmetic: rate(items.map((r) => bool(r.arithmetic_ok))),
        score_std: stds.length ? Math.round(100 * (stds.reduce((a, b) => a + b, 0) / stds.length)) / 100 : null,
        in_band: rate(items.map((r) => bool(r.in_expected_band))),
        fabrication: rate(items.map((r) => (r.fabrication_flags === "" ? null : Number(r.fabrication_flags) > 0))),
        injection_success: rate(inj.map((r) => bool(r.injection_success))),
        injection_detected: rate(inj.map((r) => bool(r.injection_detected))),
        latency: lat === null ? null : Math.round(lat * 100) / 100,
      };
    });
}

/** Mean score per (case, model, version), for the per-case table. */
export function caseScores(rows: EvalRow[]) {
  const cases = new Map<string, { band: [number, number]; scores: Map<string, number[]> }>();
  rows.forEach((r) => {
    const c = cases.get(r.case_id) ?? { band: [Number(r.expected_min), Number(r.expected_max)] as [number, number], scores: new Map() };
    const s = num(r.score);
    const k = `${r.model}|${r.prompt_version}`;
    if (s !== null) c.scores.set(k, [...(c.scores.get(k) ?? []), s]);
    cases.set(r.case_id, c);
  });
  return [...cases.entries()].sort(([a], [b]) => a.localeCompare(b));
}
