"""Optional LLM judge for fabrication (used with `run_eval.py --judge`).

The rule-based checker only catches new numbers and tool names. The judge also
catches paraphrased inventions ("led the team" when the resume says "was part
of the team"). It runs on Groq's free tier using a different model family from
the ones being evaluated, so no model grades its own homework.
"""
import json
import os

from openai import OpenAI

JUDGE_MODEL = os.getenv("JUDGE_MODEL", "qwen/qwen3.8-27b")

JUDGE_PROMPT = """You are checking rewritten resume bullets for fabrication.

<resume>
{resume}
</resume>

<rewritten_bullets>
{bullets}
</rewritten_bullets>

A bullet is FABRICATED if its "new" text states any fact (experience, responsibility,
number, metric, tool, skill, outcome, team size) that is not supported by the resume.
Rephrasing, reordering and stronger verbs that keep the same meaning are fine.

Reply with only JSON: {{"fabricated_indices": [list of 0-based indices], "reasons": ["..."]}}"""


def judge_bullets(resume: str, bullets: list[dict]) -> int:
    """Return how many bullets the judge considers fabricated."""
    client = OpenAI(api_key=os.environ["GROQ_API_KEY"],
                    base_url=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"))
    response = client.chat.completions.create(
        model=JUDGE_MODEL,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": JUDGE_PROMPT.format(
            resume=resume,
            bullets=json.dumps([{"old": b["old"], "new": b["new"]} for b in bullets], indent=1),
        )}],
    )
    data = json.loads(response.choices[0].message.content or "{}")
    return len(data.get("fabricated_indices", []))
