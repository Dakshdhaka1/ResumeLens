// Typed client for the FastAPI backend (proxied through Next at /api).

export type Model = "gemini" | "groq" | "claude";
export type Version = "v1" | "v2" | "v3";
export type Priority = "high" | "medium" | "low";

export type Criterion = { score: number; max: number; reason: string };
export type CriterionKey = "skills_match" | "projects_experience" | "bullet_clarity" | "formatting_length";

export type Review = {
  requirements: string[];
  gaps: { gap: string; priority: Priority }[];
  rewritten_bullets: { old: string; new: string; source_line?: string | null }[];
  score: number;
  score_breakdown: Record<CriterionKey, Criterion>;
  warnings: string[];
};

export type PiiItem = { type: string; value: string };

export type AnalyzeResult = {
  ok: boolean;
  review: Review | null;
  model: Model;
  model_name: string;
  prompt_version: Version;
  attempts: number;
  valid_first_try: boolean;
  latency_s: number;
  error: string | null;
  pii_removed: PiiItem[];
  raw_reply: string;
  fabrication_flags: { index: number; new: string; unsupported: string[] }[];
};

export type Sample = { id: string; title: string; role: string; resume: string; job_description: string };

export type EvalRow = Record<string, string>;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new Error("Can't reach the ResumeLens backend. Is it running on port 8000?");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    const message = Array.isArray(detail)
      ? detail.map((d: { msg: string }) => d.msg).join("; ")
      : detail ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  analyze: (resume: string, job_description: string, model: Model, prompt_version: Version) =>
    request<AnalyzeResult>("/analyze", json({ resume, job_description, model, prompt_version })),

  compare: (
    resume: string,
    job_description: string,
    left: { model: Model; prompt_version: Version },
    right: { model: Model; prompt_version: Version },
  ) => request<{ left: AnalyzeResult; right: AnalyzeResult }>("/compare", json({ resume, job_description, left, right })),

  piiPreview: (text: string) => request<{ removed: PiiItem[] }>("/pii-preview", json({ text })),

  extractPdf: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ text: string }>("/extract-pdf", { method: "POST", body: form });
  },

  samples: () => request<Sample[]>("/samples"),

  evalResults: () => request<{ rows: EvalRow[]; demo: boolean; source: string | null }>("/eval/results"),

  health: () =>
    request<{ mock_mode: boolean; models: Record<Model, string>; keys: Record<Model, boolean> }>("/health"),
};

export const CRITERIA: { key: CriterionKey; label: string; short: string }[] = [
  { key: "skills_match", label: "Skills match", short: "Skills" },
  { key: "projects_experience", label: "Relevant projects & experience", short: "Projects" },
  { key: "bullet_clarity", label: "Clarity & impact of bullets", short: "Bullets" },
  { key: "formatting_length", label: "Formatting & length", short: "Format" },
];
