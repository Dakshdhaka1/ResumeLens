"""A fake model for RESUMELENS_MOCK=1. It builds a plausible, schema-valid reply
from simple keyword matching so the UI and tests work without API keys.
It is NOT used in the real evaluation."""
import json
import re

from .fabrication import SKILL_LEXICON, _contains_term, _norm

WEAK_STARTS = {
    "made": "Built", "did": "Completed", "worked on": "Developed", "helped with": "Supported",
    "helped": "Supported", "was part of": "Contributed to", "responsible for": "Handled",
    "did a": "Completed a", "learnt": "Learned",
}


def _extract(prompt: str) -> tuple[str, str]:
    """Pull the resume and JD back out of any of the three prompt templates."""
    def grab(patterns):
        for p in patterns:
            m = re.search(p, prompt, flags=re.DOTALL)
            if m:
                return m.group(1).strip()
        return ""

    resume = grab([r"<resume>\n(.*?)\n</resume>", r"RESUME:\n(.*?)\n\n## Your tasks", r"Resume: (.*?)\n\n1\."])
    jd = grab([r"<job_description>\n(.*?)\n</job_description>", r"JOB DESCRIPTION:\n(.*?)\n\nRESUME:",
               r"Job description: (.*?)\nResume:"])
    return resume, jd


def _rewrite(line: str) -> str:
    text = line.strip().rstrip(".")
    lower = text.lower()
    for weak, strong in sorted(WEAK_STARTS.items(), key=lambda kv: -len(kv[0])):
        if lower.startswith(weak + " "):
            return strong + text[len(weak):]
    return text[0].upper() + text[1:]


def mock_reply(model: str, messages: list[dict]) -> str:
    resume, jd = _extract(messages[0]["content"])
    resume_n, jd_n = _norm(resume), _norm(jd)
    reqs = [t for t in sorted(SKILL_LEXICON, key=lambda t: jd_n.find(t)) if _contains_term(jd_n, t)][:8]
    if not reqs:
        reqs = ["communication", "teamwork"]
    present = [r for r in reqs if _contains_term(resume_n, r)]
    missing = [r for r in reqs if r not in present]

    bullets = [re.sub(r"^\s*[-•*]\s*", "", ln) for ln in resume.splitlines() if re.match(r"^\s*[-•*]\s+", ln)]
    weakest = sorted(bullets, key=len)[:3]
    strict = 0 if model == "gemini" else 2  # make the mock "models" differ a little

    skills = max(0, round(40 * len(present) / len(reqs)) - strict)
    projects = max(0, min(30, 8 + 6 * len(present) - strict))
    clarity = min(20, 6 + 2 * sum(1 for b in bullets if re.search(r"\d", b)) + (4 if len(bullets) > 4 else 0))
    formatting = 8 if len(resume.splitlines()) > 8 else 5

    gaps = [{"gap": f"{m.upper() if len(m) <= 4 else m.title()} is asked for in the JD but not shown in the resume",
             "priority": "high" if i < 2 else "medium"} for i, m in enumerate(missing)]
    if clarity < 12:
        gaps.append({"gap": "Bullets list tasks but rarely state what changed as a result", "priority": "low"})

    reply = {
        "requirements": reqs,
        "gaps": gaps[:8],
        "rewritten_bullets": [{"old": b, "source_line": b, "new": _rewrite(b)} for b in weakest],
        "score": skills + projects + clarity + formatting,
        "score_breakdown": {
            "skills_match": {"score": skills, "max": 40,
                             "reason": f"{len(present)} of {len(reqs)} key requirements shown"},
            "projects_experience": {"score": projects, "max": 30,
                                    "reason": "Projects partly match the role" if present else "No closely relevant project"},
            "bullet_clarity": {"score": clarity, "max": 20,
                               "reason": "Some bullets give outcomes" if clarity >= 12 else "Bullets describe tasks, not results"},
            "formatting_length": {"score": formatting, "max": 10,
                                  "reason": "Clear sections, about one page" if formatting > 6 else "Very short, sections missing"},
        },
        "warnings": ["Resume contains an instruction about scoring; it was ignored."]
        if "ignore previous" in resume_n else [],
    }
    return json.dumps(reply)
