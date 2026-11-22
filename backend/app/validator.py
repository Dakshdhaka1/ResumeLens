"""Turn raw model text into a validated ResumeReview (or a clear error)."""
import json
import re

from pydantic import ValidationError

from .schema import RUBRIC, ResumeReview


class InvalidReply(Exception):
    pass


def extract_json(text: str) -> dict:
    """Find the JSON object in a reply. Handles ```json fences and stray prose."""
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, flags=re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise InvalidReply("No JSON object found in the reply.")
    try:
        data = json.loads(text[start : end + 1])
    except json.JSONDecodeError as exc:
        raise InvalidReply(f"JSON syntax error: {exc}") from exc
    if not isinstance(data, dict):
        raise InvalidReply("Top-level JSON value must be an object.")
    return data


def validate_reply(text: str) -> ResumeReview:
    """Parse + schema-check. Raises InvalidReply with a readable message."""
    data = extract_json(text)
    try:
        return ResumeReview.model_validate(data)
    except ValidationError as exc:
        problems = "; ".join(
            f"{'.'.join(str(p) for p in err['loc']) or 'root'}: {err['msg']}" for err in exc.errors()
        )
        raise InvalidReply(f"Schema errors: {problems}") from exc


def arithmetic_ok(data: dict) -> bool | None:
    """True if score == sum of criterion scores. None if the fields are missing.
    Works on raw dicts so the eval can check it even when the schema fails."""
    try:
        breakdown = data["score_breakdown"]
        total = sum(int(breakdown[key]["score"]) for key in RUBRIC)
        return int(data["score"]) == total
    except (KeyError, TypeError, ValueError):
        return None
