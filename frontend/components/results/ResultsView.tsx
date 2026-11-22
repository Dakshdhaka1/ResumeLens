"use client";

import { motion } from "framer-motion";
import type { AnalyzeResult } from "@/lib/api";
import { BulletRewrite } from "./BulletRewrite";
import { GapList } from "./GapList";
import { JsonViewer } from "./JsonViewer";
import { RubricBars } from "./RubricBars";
import { ScoreGauge } from "./ScoreGauge";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`border-l-2 border-accent pl-3 text-sm text-ink-2 ${className}`}>
      <strong className="font-medium text-ink">Guidance, not a hiring decision.</strong> This score shows how well your resume
      matches this job against our rubric. Recruiters weigh things no rubric can see.
    </p>
  );
}

export function RunMeta({ result }: { result: AnalyzeResult }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
      <dt className="text-muted">Model</dt>
      <dd className="truncate text-right text-ink" title={result.model_name}>{result.model_name}</dd>
      <dt className="text-muted">Prompt</dt>
      <dd className="text-right text-ink">{result.prompt_version}</dd>
      <dt className="text-muted">Valid JSON</dt>
      <dd className="text-right text-ink">{result.valid_first_try ? "first try" : `after retry (${result.attempts})`}</dd>
      <dt className="text-muted">Latency</dt>
      <dd className="text-right tabular text-ink">{result.latency_s.toFixed(1)}s</dd>
    </dl>
  );
}

export function ErrorCard({ result, message }: { result?: AnalyzeResult; message?: string }) {
  return (
    <div role="alert" className="rounded-[6px] border border-high-fg/40 bg-high-bg/60 p-5">
      <p className="font-display text-xl font-semibold text-high-fg">
        {result ? "The model's reply didn't pass validation" : "The analysis didn't run"}
      </p>
      <p className="mt-2 text-sm text-ink-2">
        {message ?? result?.error ?? "Unknown error"}
        {result && ` (after ${result.attempts} attempt${result.attempts > 1 ? "s" : ""}, including one "fix your JSON" retry).`}
      </p>
      {result?.raw_reply && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-ink">Show the raw reply</summary>
          <pre className="scroll-quiet mt-2 max-h-64 overflow-auto rounded-[4px] bg-card p-3 font-mono text-xs text-ink-2">{result.raw_reply}</pre>
        </details>
      )}
      <p className="mt-3 text-sm text-muted">Try again, or switch to prompt v2/v3, which include the exact schema.</p>
    </div>
  );
}

export function Warnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[6px] border border-med-fg/40 bg-med-bg/60 p-4">
      <p className="folio !text-med-fg">Injection guard</p>
      <ul className="mt-1.5 list-disc pl-5 text-sm text-ink">
        {warnings.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </motion.div>
  );
}

function Section({ folio, title, children }: { folio: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="grid gap-5">
      <div className="flex items-baseline gap-4 border-b border-ink pb-2">
        <span className="font-mono text-xs text-accent-ink">{folio}</span>
        <h3 className="font-display text-3xl font-semibold tracking-[-0.025em]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function ResultsView({ result }: { result: AnalyzeResult }) {
  if (!result.ok || !result.review) return <ErrorCard result={result} />;
  const r = result.review;
  const flagsByIndex = new Map(result.fabrication_flags.map((f) => [f.index, f.unsupported]));

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <aside className="min-w-0 lg:col-span-4">
        <div className="grid gap-6 lg:sticky lg:top-6">
          <div className="rounded-[6px] border border-rule bg-card p-6">
            <div className="flex justify-center">
              <ScoreGauge score={r.score} />
            </div>
            <div className="mt-4 border-t border-rule pt-4">
              <RunMeta result={result} />
            </div>
          </div>
          <Disclaimer />
          <div>
            <p className="folio mb-2">Score breakdown</p>
            <RubricBars breakdown={r.score_breakdown} />
          </div>
        </div>
      </aside>

      <div className="grid min-w-0 content-start gap-14 lg:col-span-8">
        <Warnings warnings={r.warnings} />
        <Section folio="A" title={<>What&apos;s <span className="italic">missing</span></>}>
          <GapList gaps={r.gaps} requirements={r.requirements} />
        </Section>
        <Section folio="B" title={<>Bullets, <span className="italic">rewritten</span></>}>
          <p className="-mt-2 text-sm text-ink-2">
            Rephrased using only facts already in your resume. Highlighted words are new wording, not new claims. Toggle to compare.
          </p>
          {r.rewritten_bullets.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {r.rewritten_bullets.map((b, i) => (
                <BulletRewrite key={i} index={i} old={b.old} next={b.new} sourceLine={b.source_line} unsupported={flagsByIndex.get(i)} />
              ))}
            </div>
          ) : (
            <p className="text-ink-2">The model didn&apos;t return any rewrites.</p>
          )}
        </Section>
        <JsonViewer data={r} />
      </div>
    </div>
  );
}
