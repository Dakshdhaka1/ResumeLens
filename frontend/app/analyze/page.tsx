"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { InputPanel } from "@/components/analyze/InputPanel";
import { MODEL_LABEL, MODEL_OPTIONS, VERSION_BLURB, VERSION_OPTIONS } from "@/components/analyze/options";
import { PiiNotice } from "@/components/analyze/PiiNotice";
import { PromptGuide, PromptGuideToggle } from "@/components/analyze/PromptGuide";
import { SamplePicker } from "@/components/analyze/SamplePicker";
import { ScanLoader } from "@/components/analyze/ScanLoader";
import { useSamples } from "@/components/analyze/useSamples";
import { EmptyStateArt } from "@/components/illustrations/EmptyState";
import { useInputs } from "@/components/InputsProvider";
import { ErrorCard, ResultsView } from "@/components/results/ResultsView";
import { Arrow, MagneticButton } from "@/components/ui/MagneticButton";
import { Segmented } from "@/components/ui/Segmented";
import { api, type AnalyzeResult, type Model, type Version } from "@/lib/api";

export default function AnalyzePage() {
  const { resume, jd, setResume, setJd } = useInputs();
  const { samples, selected, setSelected, current, error: samplesError } = useSamples();
  const [model, setModel] = useState<Model>("gemini");
  const [version, setVersion] = useState<Version>("v3");
  const [guideOpen, setGuideOpen] = useState(false);
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error"; result?: AnalyzeResult; message?: string }>({ status: "idle" });
  const resultsRef = useRef<HTMLDivElement>(null);

  const ready = resume.trim().length >= 20 && jd.trim().length >= 20;

  const run = async () => {
    if (!ready) return;
    setState({ status: "loading" });
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    try {
      const result = await api.analyze(resume, jd, model, version);
      setState({ status: "done", result });
    } catch (e) {
      setState({ status: "error", message: (e as Error).message });
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
      {/* Title + controls */}
      <div className="grid gap-8 border-b border-rule pb-8 pt-12 md:grid-cols-12 md:items-end">
        <div className="md:col-span-6">
          <p className="folio">01 / Inputs</p>
          <h1 className="display mt-3 text-[clamp(2.6rem,6vw,4.6rem)]">
            Put your resume <span className="italic text-accent-ink">under the lens.</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 md:col-span-6 md:justify-end">
          <Segmented label="Model" options={MODEL_OPTIONS} value={model} onChange={setModel} />
          <div className="flex flex-col gap-1.5">
            <Segmented label="Prompt version" options={VERSION_OPTIONS} value={version} onChange={setVersion} />
            <PromptGuideToggle open={guideOpen} onToggle={() => setGuideOpen((o) => !o)} />
          </div>
          <div className="w-full sm:w-72">
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
      </div>

      <PromptGuide open={guideOpen} value={version} onSelect={setVersion} onClose={() => setGuideOpen(false)} />

      {/* Inputs */}
      <div className="mt-8 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <InputPanel
            folio="R"
            title="Resume"
            value={resume}
            onChange={setResume}
            allowPdf
            onLoadSample={current ? () => setResume(current.resume) : undefined}
            placeholder={"Paste your resume as plain text, or drop a PDF here.\n\nEDUCATION\nB.Tech, Computer Science, 2022-2026\n\nPROJECTS\n- Built a …"}
          />
        </div>
        <div className="lg:col-span-5">
          <InputPanel
            folio="J"
            title="Job description"
            value={jd}
            onChange={setJd}
            onLoadSample={current ? () => setJd(current.job_description) : undefined}
            placeholder={"Paste the job posting.\n\nData Analyst Intern\nRequirements\n- SQL (must have)\n- …"}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-8">
          <PiiNotice text={`${resume}\n${jd}`} />
        </div>
        <div className="flex flex-col items-start gap-2 lg:col-span-4 lg:items-end">
          <MagneticButton onClick={run} disabled={!ready || state.status === "loading"} className="w-full justify-between sm:w-auto">
            {state.status === "loading" ? "Analysing…" : `Analyse with ${MODEL_LABEL[model]} · ${version}`} <Arrow />
          </MagneticButton>
          <p className="max-w-xs text-xs text-muted lg:text-right">{VERSION_BLURB[version]}</p>
        </div>
      </div>

      {/* Results */}
      <div ref={resultsRef} className="scroll-mt-6 pt-16">
        <div className="mb-8 flex items-baseline justify-between border-b border-ink pb-3">
          <h2 className="display text-4xl">
            02 / <span className="italic">Findings</span>
          </h2>
          {state.status === "done" && <span className="folio hidden sm:block">Gaps · rewrites · score</span>}
        </div>
        <AnimatePresence mode="wait">
          {state.status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid items-center gap-6 rounded-[6px] border border-dashed border-rule p-8 sm:grid-cols-[14rem_1fr] sm:p-12">
              <EmptyStateArt className="mx-auto w-full max-w-[14rem]" />
              <div>
                <p className="font-display text-3xl font-semibold tracking-[-0.02em]">Nothing under the lens yet.</p>
                <p className="mt-2 max-w-md text-ink-2">
                  Paste a resume and a job description above, or load one of the made-up samples, then press Analyse. Your findings appear here.
                </p>
              </div>
            </motion.div>
          )}
          {state.status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScanLoader label={`${MODEL_LABEL[model]} · prompt ${version}`} />
            </motion.div>
          )}
          {state.status === "done" && state.result && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultsView result={state.result} />
            </motion.div>
          )}
          {state.status === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ErrorCard message={state.message} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
