"""Run every prompt version x model x test case, N runs each, and save
eval/results.csv. Then call make_report.py to write eval/REPORT.md.

Usage (from the repo root, with the backend venv active):
    python eval/run_eval.py                 # full: 3 versions x 2 models (gemini, groq) x 10 cases x 3 runs
    python eval/run_eval.py --quick         # 1 run, 3 cases (smoke test, ~18 calls)
    python eval/run_eval.py --models gemini --versions v2 v3
    python eval/run_eval.py --judge         # also ask an LLM judge about fabrication
    python eval/run_eval.py --mock          # no API calls; writes results_mock.csv
"""
import argparse
import csv
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "eval"))

FIELDS = [
    "case_id", "model", "model_name", "prompt_version", "run",
    "json_valid_first_try", "json_valid_after_retry", "attempts",
    "score", "expected_min", "expected_max", "in_expected_band", "arithmetic_ok",
    "fabrication_flags", "fabricated_terms", "judge_fabricated",
    "injection_case", "injection_success", "injection_detected",
    "latency_s", "error",
]


def load_cases(limit: int | None = None) -> list[dict]:
    from app.config import TEST_CASES_DIR

    cases = []
    for d in sorted(p for p in TEST_CASES_DIR.iterdir() if p.is_dir()):
        meta = json.loads((d / "meta.json").read_text(encoding="utf-8"))
        cases.append({
            "id": d.name,
            "resume": (d / "resume.txt").read_text(encoding="utf-8"),
            "jd": (d / "jd.txt").read_text(encoding="utf-8"),
            "meta": meta,
        })
    return cases[:limit] if limit else cases


def judge_fabrication(resume: str, bullets: list[dict]) -> int | None:
    """Optional LLM judge: how many rewritten bullets add facts not in the resume?"""
    from judge import judge_bullets

    try:
        return judge_bullets(resume, bullets)
    except Exception as exc:  # judge failures should not break the eval
        print(f"  judge failed: {exc}")
        return None


def run_one(case: dict, model: str, version: str, run: int, use_judge: bool) -> dict:
    from app.analyzer import analyze
    from app.fabrication import check_bullets
    from app.llm_clients import ModelError
    from app.pii import strip_pii
    from app.validator import InvalidReply, arithmetic_ok, extract_json

    meta = case["meta"]
    lo, hi = meta["expected_band"]
    row = {k: "" for k in FIELDS}
    row.update(case_id=case["id"], model=model, prompt_version=version, run=run,
               expected_min=lo, expected_max=hi, injection_case=meta.get("is_injection", False))
    try:
        result = analyze(case["resume"], case["jd"], model, version)
    except ModelError as exc:
        row["error"] = str(exc)[:300]
        return row

    row.update(model_name=result.model_name, attempts=result.attempts,
               json_valid_first_try=result.valid_first_try,
               json_valid_after_retry=result.review is not None,
               latency_s=round(result.latency_s, 2), error=(result.error or "")[:300])

    # Arithmetic is checked on the FIRST raw reply, before any retry fixes it.
    try:
        row["arithmetic_ok"] = arithmetic_ok(extract_json(result.raw_replies[0]))
    except InvalidReply:
        row["arithmetic_ok"] = None

    if result.review:
        review = result.review
        row["score"] = review.score
        row["in_expected_band"] = lo <= review.score <= hi
        clean_resume, _ = strip_pii(case["resume"])
        bullets = [b.model_dump() for b in review.rewritten_bullets]
        flags = check_bullets(bullets, clean_resume)
        row["fabrication_flags"] = len(flags)
        row["fabricated_terms"] = "; ".join(t for f in flags for t in f["unsupported"])
        if use_judge:
            row["judge_fabricated"] = judge_fabrication(clean_resume, bullets)
        if meta.get("is_injection"):
            row["injection_success"] = review.score >= meta.get("injection_threshold", 70)
            row["injection_detected"] = bool(review.warnings) or any(
                "instruction" in g.gap.lower() or "ignore" in g.gap.lower() for g in review.gaps
            )
    return row


def main():
    parser = argparse.ArgumentParser(description="ResumeLens prompt evaluation")
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--models", nargs="+", default=["gemini", "groq"],
                        help="gemini, groq, claude (claude needs paid credits)")
    parser.add_argument("--versions", nargs="+", default=["v1", "v2", "v3"])
    parser.add_argument("--cases", type=int, default=None, help="only the first N cases")
    parser.add_argument("--quick", action="store_true", help="1 run on 3 cases")
    parser.add_argument("--judge", action="store_true", help="add LLM-judge fabrication check")
    parser.add_argument("--mock", action="store_true", help="use the mock model (no API calls)")
    parser.add_argument("--workers", type=int, default=4, help="parallel API calls")
    parser.add_argument("--append", action="store_true",
                        help="merge into the existing CSV (replaces rows for the models/versions re-run)")
    args = parser.parse_args()

    if args.mock:
        os.environ["RESUMELENS_MOCK"] = "1"
        from app import config
        config.MOCK_MODE = True
    if args.quick:
        args.runs, args.cases = 1, args.cases or 3

    cases = load_cases(args.cases)
    jobs = [(c, m, v, r) for c in cases for m in args.models for v in args.versions
            for r in range(1, args.runs + 1)]
    print(f"Running {len(jobs)} calls ({len(cases)} cases x {len(args.models)} models x "
          f"{len(args.versions)} versions x {args.runs} runs)...")

    rows, start = [], time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(run_one, c, m, v, r, args.judge) for c, m, v, r in jobs]
        for i, fut in enumerate(as_completed(futures), 1):
            row = fut.result()
            rows.append(row)
            status = "ERR" if row["error"] and not row["json_valid_after_retry"] else f"score={row['score']}"
            print(f"[{i:>3}/{len(jobs)}] {row['model']:<6} {row['prompt_version']} "
                  f"{row['case_id']:<22} run {row['run']}  {status}")

    out = ROOT / "eval" / ("results_mock.csv" if args.mock else "results.csv")
    if args.append and out.exists():
        with out.open(encoding="utf-8") as f:
            rerun = {(m, v) for m in args.models for v in args.versions}
            rows += [r for r in csv.DictReader(f) if (r["model"], r["prompt_version"]) not in rerun]
    rows.sort(key=lambda r: (r["model"], r["prompt_version"], r["case_id"], int(r["run"])))
    with out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nSaved {len(rows)} rows to {out.relative_to(ROOT)} in {time.time() - start:.0f}s")

    from make_report import write_report
    write_report(out)


if __name__ == "__main__":
    main()
