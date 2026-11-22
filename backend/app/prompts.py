"""Load prompt templates from prompts/ and fill in the resume and JD."""
import re
from dataclasses import dataclass

from .config import PROMPTS_DIR

PROMPT_FILES = {
    "v1": "v1_baseline.txt",
    "v2": "v2_structured.txt",
    "v3": "v3_guarded.txt",
}

SYSTEM_MARK = "=== SYSTEM ==="
USER_MARK = "=== USER ==="


@dataclass
class FilledPrompt:
    system: str  # empty string = no system prompt (v1)
    user: str


def load_template(version: str) -> tuple[str, str]:
    """Return (system_template, user_template) for a prompt version."""
    if version not in PROMPT_FILES:
        raise ValueError(f"Unknown prompt version: {version}")
    text = (PROMPTS_DIR / PROMPT_FILES[version]).read_text(encoding="utf-8")
    if USER_MARK not in text:
        return "", text.strip()
    system_part, user_part = text.split(USER_MARK, 1)
    system_part = system_part.replace(SYSTEM_MARK, "")
    return system_part.strip(), user_part.strip()


def neutralise_tags(text: str) -> str:
    """Remove our delimiter tags if a user pastes them, so the resume
    cannot 'close' its own <resume> block (prompt-injection guard for v3)."""
    return re.sub(r"</?\s*(resume|job_description)\s*>", "", text, flags=re.IGNORECASE)


def build_prompt(version: str, resume: str, job_description: str) -> FilledPrompt:
    system, user = load_template(version)
    # str.replace (not str.format) because the templates contain JSON braces.
    user = user.replace("{resume}", neutralise_tags(resume))
    user = user.replace("{job_description}", neutralise_tags(job_description))
    return FilledPrompt(system=system, user=user)


FIX_JSON_MESSAGE = (
    "Your previous reply was not valid for our schema. Error:\n{error}\n\n"
    "Reply again with ONLY one JSON object with exactly these keys: "
    "requirements (list of strings), gaps (list of {{gap, priority}} where priority "
    "is high/medium/low), rewritten_bullets (list of {{old, new}}), score (integer = sum "
    "of the four criterion scores), score_breakdown with skills_match (max 40), "
    "projects_experience (max 30), bullet_clarity (max 20), formatting_length (max 10), "
    "each {{score, max, reason}}. No markdown, no extra text."
)
