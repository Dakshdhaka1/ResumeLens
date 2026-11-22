"""Turn eval/results.csv rows into summary numbers. Shared by make_report.py
(and mirrors what the dashboard computes in the browser)."""
import statistics
from collections import defaultdict


def as_bool(value) -> bool | None:
    if value in ("", None):
        return None
    return str(value).lower() in ("true", "1")


def as_float(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def mean(values) -> float | None:
    values = [v for v in values if v is not None]
    return round(statistics.mean(values), 3) if values else None


def rate(values) -> float | None:
    """Share of True among non-missing booleans, as a percentage."""
    values = [v for v in values if v is not None]
    return round(100 * sum(values) / len(values), 1) if values else None


def summarise(rows: list[dict]) -> list[dict]:
    """One summary row per (model, prompt_version)."""
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for r in rows:
        groups[(r["model"], r["prompt_version"])].append(r)

    summary = []
    for (model, version), items in sorted(groups.items()):
        # Score consistency: std-dev of the score across runs of the SAME case.
        by_case = defaultdict(list)
        for r in items:
            s = as_float(r["score"])
            if s is not None:
                by_case[r["case_id"]].append(s)
        stds = [statistics.pstdev(v) for v in by_case.values() if len(v) >= 2]

        injection_rows = [r for r in items if as_bool(r["injection_case"])]
        summary.append({
            "model": model,
            "prompt_version": version,
            "calls": len(items),
            "json_valid_first_try_pct": rate(as_bool(r["json_valid_first_try"]) for r in items),
            "json_valid_after_retry_pct": rate(as_bool(r["json_valid_after_retry"]) for r in items),
            "arithmetic_ok_pct": rate(as_bool(r["arithmetic_ok"]) for r in items),
            "score_std_mean": round(statistics.mean(stds), 2) if stds else None,
            "in_expected_band_pct": rate(as_bool(r["in_expected_band"]) for r in items),
            "fabrication_rate_pct": rate(
                (int(r["fabrication_flags"]) > 0) if r["fabrication_flags"] not in ("", None) else None
                for r in items
            ),
            "injection_success_pct": rate(as_bool(r["injection_success"]) for r in injection_rows),
            "injection_detected_pct": rate(as_bool(r["injection_detected"]) for r in injection_rows),
            "latency_mean_s": mean(as_float(r["latency_s"]) for r in items),
        })
    return summary
