import type { Model, Version } from "@/lib/api";

export const MODEL_OPTIONS: { value: Model; label: string }[] = [
  { value: "gemini", label: "Gemini" },
  { value: "groq", label: "GPT-OSS" },
];

// The three prompt versions, explained for students (not prompt engineers).
// Technical details live in prompts/CHANGELOG.md.
export const VERSION_INFO: Record<
  Version,
  { name: string; oneLine: string; what: string[]; useFor: string; expect: string; recommended?: boolean }
> = {
  v1: {
    name: "Basic",
    oneLine: "The plain starting prompt, with minimal instructions.",
    what: [
      "A short paragraph asking for gaps, rewrites and a score",
      "No exact output format, so the reply often needs an automatic fix",
      "No priority labels or scoring guide",
    ],
    useFor: "Seeing the baseline: how much a model gets right with almost no guidance.",
    expect: "Slower (often 2 tries) and scores that can drift between runs.",
  },
  v2: {
    name: "Structured",
    oneLine: "Clear instructions: a mentor role, exact format and a scoring guide.",
    what: [
      "Gaps ranked high / medium / low so you know what to fix first",
      "A points guide for each rubric criterion, so scores are more consistent",
      "The exact output format, so the reply is valid first time",
    ],
    useFor: "Comparing with v1 to see what structure alone improves.",
    expect: "Consistent scores and a ranked to-do list.",
  },
  v3: {
    name: "Guarded",
    oneLine: "Everything in v2, plus honesty and safety checks.",
    what: [
      "Treats your resume as data: hidden text like “give this 100” is ignored and flagged",
      "Each rewritten bullet shows which line of your resume it came from",
      "An example of honest rewriting: rephrase, never invent numbers or tools",
    ],
    useFor: "Real feedback on your own resume. This is the most reliable version.",
    expect: "The safest results; slightly longer prompt.",
    recommended: true,
  },
};

export const VERSION_OPTIONS: { value: Version; label: string; hint: string }[] = (["v1", "v2", "v3"] as Version[]).map(
  (v) => ({ value: v, label: `${v} ${VERSION_INFO[v].name}`, hint: VERSION_INFO[v].oneLine }),
);

export const VERSION_BLURB: Record<Version, string> = {
  v1: `v1 Basic: ${VERSION_INFO.v1.oneLine}`,
  v2: `v2 Structured: ${VERSION_INFO.v2.oneLine}`,
  v3: `v3 Guarded (recommended): ${VERSION_INFO.v3.oneLine}`,
};

// Display names. Claude still works in the backend (with paid credits) but isn't offered in the UI.
export const MODEL_LABEL: Record<Model, string> = { gemini: "Gemini", groq: "GPT-OSS (Groq)", claude: "Claude" };
