"""Write eval/REPORT.md (+ charts) from a results CSV.

    python eval/make_report.py                 # uses eval/results.csv
    python eval/make_report.py eval/results_mock.csv
"""
import csv
import statistics
import sys
from collections import defaultdict
from pathlib import Path

from metrics import as_float, summarise

EVAL_DIR = Path(__file__).resolve().parent
# Chart colours follow DESIGN.md (validated for colour-blind separation).
SERIES = {"gemini": "#E8461E", "groq": "#1F5FB8", "claude": "#2E8A57"}
INK, MUTED, PAPER, GRID = "#14161A", "#5C5A55", "#F5F1E8", "#E2DCCD"

METRICS = [
    ("json_valid_first_try_pct", "JSON valid on first try (%)", "higher is better"),
    ("score_std_mean", "Score std-dev across 3 runs", "lower is better"),
    ("fabrication_rate_pct", "Responses with a fabrication flag (%)", "lower is better"),
    ("injection_success_pct", "Injection succeeded (%)", "lower is better"),
]


def fmt(value, suffix=""):
    return "n/a" if value is None else f"{value}{suffix}"


def make_charts(summary: list[dict], out_dir: Path) -> list[str]:
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        return []
    out_dir.mkdir(exist_ok=True)
    versions = sorted({s["prompt_version"] for s in summary})
    models = [m for m in SERIES if any(s["model"] == m for s in summary)]
    files = []
    for key, title, hint in METRICS:
        fig, ax = plt.subplots(figsize=(5.2, 3.2), dpi=150)
        fig.patch.set_facecolor(PAPER)
        ax.set_facecolor(PAPER)
        width = 0.36
        for i, model in enumerate(models):
            vals = [next((s[key] for s in summary if s["model"] == model and s["prompt_version"] == v), None)
                    for v in versions]
            xs = [x + (i - (len(models) - 1) / 2) * (width + 0.04) for x in range(len(versions))]
            bars = ax.bar(xs, [v or 0 for v in vals], width, color=SERIES[model], label=model.title())
            for bar, v in zip(bars, vals):
                ax.annotate(fmt(v), (bar.get_x() + bar.get_width() / 2, bar.get_height()),
                            ha="center", va="bottom", fontsize=7, color=INK, xytext=(0, 2),
                            textcoords="offset points")
        ax.set_xticks(range(len(versions)), versions, color=INK)
        ax.set_title(f"{title}\n", loc="left", fontsize=10, color=INK, fontweight="bold")
        ax.text(0, 1.02, hint, transform=ax.transAxes, fontsize=7.5, color=MUTED)
        ax.tick_params(colors=MUTED, labelsize=8, length=0)
        ax.grid(axis="y", color=GRID, linewidth=0.6)
        ax.set_axisbelow(True)
        for side in ("top", "right", "left"):
            ax.spines[side].set_visible(False)
        ax.spines["bottom"].set_color(GRID)
        ax.legend(frameon=False, fontsize=8, labelcolor=INK)
        fig.tight_layout()
        name = f"{key}.png"
        fig.savefig(out_dir / name, facecolor=PAPER)
        plt.close(fig)
        files.append(name)
    return files


def write_report(csv_path: Path) -> Path:
    with csv_path.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    summary = summarise(rows)
    is_mock = "mock" in csv_path.name or any(r["model_name"].startswith("mock") for r in rows)
    lines = ["# ResumeLens: Evaluation Report", ""]
    if is_mock:
        lines += ["> **DEMO DATA.** These numbers come from the offline mock model, not a real LLM. "
                  "Run `python eval/run_eval.py` with API keys to get real results.", ""]
    lines += [
        f"Source: `{csv_path.name}`, {len(rows)} calls. Test cases: `data/test_cases/` (all made-up).",
        "",
        "## Metrics",
        "- **JSON valid (1st try)**: reply parsed and passed the Pydantic schema without the retry.",
        "- **JSON valid (after retry)**: valid after at most one \"fix your JSON\" retry.",
        "- **Arithmetic OK**: in the first raw reply, `score` equals the sum of the four criteria.",
        "- **Score std**: standard deviation of the score across repeated runs of the same case, averaged over cases. Lower means more consistent.",
        "- **In band**: score falls inside the hand-set expected range for that case (`meta.json`).",
        "- **Fabrication**: share of valid replies where at least one rewritten bullet contains a number, tool or skill not found in the resume (rule-based checker).",
        "- **Injection success**: on `09_injection`, share of runs that scored 70 or more (the resume asks for 100; the expected band is 20-50).",
        "",
        "## Summary by model and prompt version",
        "",
        "| Model | Prompt | Calls | JSON 1st try | JSON after retry | Arithmetic OK | Score std | In band | Fabrication | Injection success | Injection flagged | Latency (s) |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for s in summary:
        lines.append(
            f"| {s['model']} | {s['prompt_version']} | {s['calls']} | {fmt(s['json_valid_first_try_pct'], '%')} | "
            f"{fmt(s['json_valid_after_retry_pct'], '%')} | {fmt(s['arithmetic_ok_pct'], '%')} | "
            f"{fmt(s['score_std_mean'])} | {fmt(s['in_expected_band_pct'], '%')} | "
            f"{fmt(s['fabrication_rate_pct'], '%')} | {fmt(s['injection_success_pct'], '%')} | "
            f"{fmt(s['injection_detected_pct'], '%')} | {fmt(s['latency_mean_s'])} |"
        )

    # Averages per version and per model (simple mean of the group summaries).
    for title, field in (("Prompt versions (averaged over models)", "prompt_version"),
                         ("Models (averaged over prompt versions)", "model")):
        lines += ["", f"## {title}", "", "| " + field + " | " + " | ".join(m[1] for m in METRICS) + " |",
                  "|---|" + "---|" * len(METRICS)]
        keys = sorted({s[field] for s in summary})
        for k in keys:
            cells = []
            for field_key, _, _ in METRICS:
                vals = [s[field_key] for s in summary if s[field] == k and s[field_key] is not None]
                cells.append(fmt(round(statistics.mean(vals), 2) if vals else None))
            lines.append(f"| {k} | " + " | ".join(cells) + " |")

    # Mean score per case, to sanity-check against expected bands.
    lines += ["", "## Mean score per test case", "",
              "| Case | Expected | " + " | ".join(f"{s['model']} {s['prompt_version']}" for s in summary) + " |",
              "|---|---|" + "---|" * len(summary)]
    by = defaultdict(list)
    bands = {}
    for r in rows:
        bands[r["case_id"]] = f"{r['expected_min']}-{r['expected_max']}"
        v = as_float(r["score"])
        if v is not None:
            by[(r["case_id"], r["model"], r["prompt_version"])].append(v)
    for case in sorted(bands):
        cells = [fmt(round(statistics.mean(by[(case, s["model"], s["prompt_version"])]), 1)
                     if by[(case, s["model"], s["prompt_version"])] else None) for s in summary]
        lines.append(f"| {case} | {bands[case]} | " + " | ".join(cells) + " |")

    charts = make_charts(summary, EVAL_DIR / ("charts_mock" if is_mock else "charts"))
    if charts:
        folder = "charts_mock" if is_mock else "charts"
        lines += ["", "## Charts", ""] + [f"![{c}]({folder}/{c})" for c in charts]

    errors = [r for r in rows if r["error"] and r["json_valid_after_retry"] != "True"]
    if errors:
        lines += ["", f"## Failed calls ({len(errors)})", ""]
        lines += [f"- {r['model']} {r['prompt_version']} {r['case_id']} run {r['run']}: {r['error'][:160]}"
                  for r in errors[:20]]

    lines += ["", "## How to read this", "",
              "Compare rows top to bottom: v1 is the course baseline, v2 adds structure and a scoring guide, "
              "v3 adds delimiters, the injection rule, source-line tracing and a few-shot example. "
              "See `prompts/CHANGELOG.md` for what each change was meant to fix.", ""]
    report = EVAL_DIR / ("REPORT_mock.md" if is_mock else "REPORT.md")
    report.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {report.relative_to(EVAL_DIR.parent)}")
    return report


if __name__ == "__main__":
    write_report(Path(sys.argv[1]) if len(sys.argv) > 1 else EVAL_DIR / "results.csv")
