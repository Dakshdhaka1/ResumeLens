"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { InputPanel } from "@/components/analyze/InputPanel";
import { MODEL_LABEL, MODEL_OPTIONS, VERSION_OPTIONS } from "@/components/analyze/options";
import { PiiNotice } from "@/components/analyze/PiiNotice";
import { PromptGuide, PromptGuideToggle } from "@/components/analyze/PromptGuide";
import { SamplePicker } from "@/components/analyze/SamplePicker";
import { ScanLoader } from "@/components/analyze/ScanLoader";
import { useSamples } from "@/components/analyze/useSamples";
import { useInputs } from "@/components/InputsProvider";
import { PriorityPill } from "@/components/results/GapList";
import { Disclaimer, ErrorCard, RunMeta, Warnings } from "@/components/results/ResultsView";
import { RubricBars } from "@/components/results/RubricBars";
import { ScoreGauge } from "@/components/results/ScoreGauge";
import { Arrow, MagneticButton } from "@/components/ui/MagneticButton";
import { Segmented } from "@/components/ui/Segmented";
import { api, CRITERIA, type AnalyzeResult, type Model, type Version } from "@/lib/api";

type Side = { model: Model; prompt_version: Version };

const PRESETS: { label: string; left: Side; right: Side }[] = [
  { label: "Gemini vs GPT-OSS (v3)", left: { model: "gemini", prompt_version: "v3" }, right: { model: "groq", prompt_version: "v3" } },
  { label: "Baseline vs guarded (Gemini)", left: { model: "gemini", prompt_version: "v1" }, right: { model: "gemini", prompt_version: "v3" } },
  { label: "Baseline vs guarded (GPT-OSS)", left: { model: "groq", prompt_version: "v1" }, right: { model: "groq", prompt_version: "v3" } },
];

const name = (s: Side) => `${MODEL_LABEL[s.model]} · ${s.prompt_version}`;

function SideConfig({ title, side, onChange }: { title: string; side: Side; onChange: (s: Side) => void }) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-[6px] border border-rule bg-card px-4 py-3">
      <span className="font-display text-lg font-semibold italic">{title}</span>
      <Segmented size="sm" label="Model" options={MODEL_OPTIONS} value={side.model} onChange={(m) => onChange({ ...side, model: m })} />
      <Segmented size="sm" label="Prompt" options={VERSION_OPTIONS} value={side.prompt_version} onChange={(v) => onChange({ ...side, prompt_version: v })} />
    </div>
  );
}

function Delta({ a, b }: { a: number; b: number }) {
  const d = b - a;
  if (d === 0) return <span className="font-mono text-xs text-muted">same</span>;
  return (
    <span className={`rounded-[2px] px-1.5 py-0.5 font-mono text-xs tabular ${Math.abs(d) >= 5 ? "bg-accent text-on-accent" : "bg-paper-2 text-ink"}`}>
      {d > 0 ? "+" : "−"}
      {Math.abs(d)}
    </span>
  );
}

function Column({ result, side, from }: { result: AnalyzeResult; side: Side; from: "left" | "right" }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, x: reduce ? 0 : from === "left" ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: from === "left" ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="grid min-w-0 content-start gap-6"
    >
      <div className="flex items-baseline justify-between border-b border-ink pb-2">
        <h3 className="font-display text-3xl font-semibold tracking-[-0.025em]">{name(side)}</h3>
        <span className="folio">{from === "left" ? "A" : "B"}</span>
      </div>
      {!result.ok || !result.review ? (
        <ErrorCard result={result} />
      ) : (
        <>
          <div className="flex flex-col items-center gap-4 rounded-[6px] border border-rule bg-card p-5 sm:flex-row sm:items-center">
            <ScoreGauge score={result.review.score} size={180} delay={from === "left" ? 0.2 : 0.35} />
            <div className="w-full flex-1">
              <RunMeta result={result} />
              <p className="mt-3 font-mono text-xs text-muted">
                {result.fabrication_flags.length
                  ? `${result.fabrication_flags.length} rewrite(s) flagged for unsupported facts`
                  : "No rewrite flagged for unsupported facts"}
              </p>
            </div>
          </div>
          <Warnings warnings={result.review.warnings} />
          <RubricBars breakdown={result.review.score_breakdown} compact startDelay={from === "left" ? 0.6 : 0.75} />
          <div>
            <p className="folio mb-2">Top gaps</p>
            <ul className="grid gap-2">
              {result.review.gaps.slice(0, 5).map((g, i) => (
                <li key={i} className="flex items-start justify-between gap-3 rounded-[4px] border border-rule bg-card px-3 py-2 text-sm">
                  <span>{g.gap}</span>
                  <PriorityPill priority={g.priority} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="folio mb-2">Rewrites</p>
            <ul className="grid gap-2">
              {result.review.rewritten_bullets.map((b, i) => (
                <li key={i} className="rounded-[4px] border border-rule bg-card px-3 py-2 text-sm">
                  <p className="text-muted line-through decoration-accent/60">{b.old}</p>
                  <p className="mt-1 text-ink">{b.new}</p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function ComparePage() {
  const reduce = useReducedMotion();
  const { resume, jd, setResume, setJd } = useInputs();
  const { samples, selected, setSelected, current, error: samplesError } = useSamples();
  const [left, setLeft] = useState<Side>(PRESETS[0].left);
  const [right, setRight] = useState<Side>(PRESETS[0].right);
  const [guideOpen, setGuideOpen] = useState(false);
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error"; data?: { left: AnalyzeResult; right: AnalyzeResult }; message?: string; sides?: [Side, Side] }>({ status: "idle" });

  const ready = resume.trim().length >= 20 && jd.trim().length >= 20;
  const same = left.model === right.model && left.prompt_version === right.prompt_version;

  const run = async () => {
    setState({ status: "loading" });
    try {
      const data = await api.compare(resume, jd, left, right);
      setState({ status: "done", data, sides: [left, right] });
    } catch (e) {
      setState({ status: "error", message: (e as Error).message });
    }
  };

  const L = state.data?.left.review;
  const R = state.data?.right.review;

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
      <div className="grid gap-6 border-b border-rule pb-8 pt-12 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p className="folio">Compare mode</p>
          <h1 className="display mt-3 text-[clamp(2.6rem,6vw,4.6rem)]">
            Same resume, <span className="italic text-accent-ink">two readings.</span>
          </h1>
          <p className="mt-4 max-w-xl text-ink-2">
            Run one input through two models or two prompt versions side by side. This is the quickest way to see what each prompt change actually does.
          </p>
        </div>
        <div className="md:col-span-5">
          <SamplePicker
            samples={samples}
            selected={selected}
            onSelect={setSelected}
            error={samplesError}
            onLoad={() => {
              if (current) {
                setResume(current.resume);
                setJd(current.job_description);
              }
            }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <InputPanel folio="R" title="Resume" value={resume} onChange={setResume} allowPdf placeholder="Paste a resume, or load a sample above." />
        <InputPanel folio="J" title="Job description" value={jd} onChange={setJd} placeholder="Paste the job description." />
      </div>
      <div className="mt-4">
        <PiiNotice text={`${resume}\n${jd}`} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span className="folio mr-2">Presets</span>
        {PRESETS.map((p) => {
          const active = p.left.model === left.model && p.left.prompt_version === left.prompt_version && p.right.model === right.model && p.right.prompt_version === right.prompt_version;
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setLeft(p.left);
                setRight(p.right);
              }}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${active ? "border-ink bg-ink text-paper" : "border-rule text-ink-2 hover:border-ink hover:text-ink"}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <SideConfig title="A" side={left} onChange={setLeft} />
        <span className="text-center font-display text-2xl italic text-muted">vs</span>
        <SideConfig title="B" side={right} onChange={setRight} />
      </div>
      <div className="mt-3">
        <PromptGuideToggle open={guideOpen} onToggle={() => setGuideOpen((o) => !o)} />
      </div>
      <PromptGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{same ? "Both sides are identical. Change one to compare." : "Both runs happen in parallel."}</p>
        <MagneticButton onClick={run} disabled={!ready || same || state.status === "loading"}>
          {state.status === "loading" ? "Running both…" : `Compare ${name(left)} with ${name(right)}`} <Arrow />
        </MagneticButton>
      </div>

      <div className="pt-14">
        <AnimatePresence mode="wait">
          {state.status === "loading" && (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScanLoader label={`${name(left)} and ${name(right)}`} />
            </motion.div>
          )}
          {state.status === "error" && (
            <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ErrorCard message={state.message} />
            </motion.div>
          )}
          {state.status === "done" && state.data && state.sides && (
            <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-10">
              {L && R && (
                <motion.div
                  initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="overflow-x-auto rounded-[6px] border border-rule bg-card"
                >
                  <table className="w-full min-w-[34rem] text-sm">
                    <caption className="sr-only">Score differences between A and B</caption>
                    <thead>
                      <tr className="border-b border-rule text-left">
                        <th className="px-4 py-3 font-medium text-muted">Criterion</th>
                        <th className="px-4 py-3 text-right font-mono font-medium">A · {name(state.sides[0])}</th>
                        <th className="px-4 py-3 text-right font-mono font-medium">B · {name(state.sides[1])}</th>
                        <th className="px-4 py-3 text-right font-medium text-muted">B − A</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                      {CRITERIA.map((c) => (
                        <tr key={c.key}>
                          <td className="px-4 py-2.5">{c.label}</td>
                          <td className="px-4 py-2.5 text-right font-mono tabular">{L.score_breakdown[c.key].score}<span className="text-muted">/{L.score_breakdown[c.key].max}</span></td>
                          <td className="px-4 py-2.5 text-right font-mono tabular">{R.score_breakdown[c.key].score}<span className="text-muted">/{R.score_breakdown[c.key].max}</span></td>
                          <td className="px-4 py-2.5 text-right"><Delta a={L.score_breakdown[c.key].score} b={R.score_breakdown[c.key].score} /></td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-ink font-medium">
                        <td className="px-4 py-3 font-display text-lg">Total</td>
                        <td className="px-4 py-3 text-right font-mono text-lg tabular">{L.score}</td>
                        <td className="px-4 py-3 text-right font-mono text-lg tabular">{R.score}</td>
                        <td className="px-4 py-3 text-right"><Delta a={L.score} b={R.score} /></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-muted">Gaps found (high)</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular">{L.gaps.length} ({L.gaps.filter((g) => g.priority === "high").length})</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular">{R.gaps.length} ({R.gaps.filter((g) => g.priority === "high").length})</td>
                        <td className="px-4 py-2.5" />
                      </tr>
                    </tbody>
                  </table>
                </motion.div>
              )}
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                <Column result={state.data.left} side={state.sides[0]} from="left" />
                <Column result={state.data.right} side={state.sides[1]} from="right" />
              </div>
              <Disclaimer />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
