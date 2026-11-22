"""The analysis pipeline used by both the API and the eval script:

    strip PII -> build prompt -> call model -> validate -> (retry once) -> result
"""
from dataclasses import dataclass, field

from .llm_clients import call_model
from .pii import strip_pii
from .prompts import FIX_JSON_MESSAGE, build_prompt
from .schema import ResumeReview
from .validator import InvalidReply, validate_reply


@dataclass
class AnalysisResult:
    review: ResumeReview | None
    model: str
    model_name: str
    prompt_version: str
    attempts: int
    valid_first_try: bool
    latency_s: float  # total across attempts
    raw_replies: list[str] = field(default_factory=list)
    error: str | None = None
    pii_removed: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        review = None
        if self.review:
            review = self.review.model_dump()
            review["gaps"] = [g.model_dump() for g in self.review.sorted_gaps()]
        return {
            "ok": self.review is not None,
            "review": review,
            "model": self.model,
            "model_name": self.model_name,
            "prompt_version": self.prompt_version,
            "attempts": self.attempts,
            "valid_first_try": self.valid_first_try,
            "latency_s": round(self.latency_s, 2),
            "error": self.error,
            "pii_removed": self.pii_removed,
            "raw_reply": self.raw_replies[-1] if self.raw_replies else "",
        }


def analyze(resume: str, job_description: str, model: str, version: str) -> AnalysisResult:
    clean_resume, removed_r = strip_pii(resume)
    clean_jd, removed_j = strip_pii(job_description)
    prompt = build_prompt(version, clean_resume, clean_jd)
    json_mode = version != "v1"  # baseline stays as close to the brief as possible

    messages = [{"role": "user", "content": prompt.user}]
    result = AnalysisResult(
        review=None, model=model, model_name="", prompt_version=version,
        attempts=0, valid_first_try=False, latency_s=0.0,
        pii_removed=removed_r + removed_j,
    )

    for attempt in (1, 2):  # first try + one "fix your JSON" retry
        reply = call_model(model, prompt.system, messages, json_mode)
        result.attempts = attempt
        result.latency_s += reply.latency_s
        result.model_name = reply.model_name
        result.raw_replies.append(reply.text)
        try:
            result.review = validate_reply(reply.text)
            result.valid_first_try = attempt == 1
            result.error = None
            return result
        except InvalidReply as exc:
            result.error = str(exc)
            messages = messages + [
                {"role": "assistant", "content": reply.text or "(empty)"},
                {"role": "user", "content": FIX_JSON_MESSAGE.format(error=exc)},
            ]
    return result
