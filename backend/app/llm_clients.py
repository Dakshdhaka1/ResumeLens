"""Thin wrappers around the Gemini, Groq and Claude APIs.

All expose the same function signature so the rest of the app does not care
which model it is talking to:

    call_model(model, system, messages, json_mode) -> ModelReply

Providers: "gemini" (Google AI Studio), "groq" (free, OpenAI-compatible API
serving open-weight models such as gpt-oss) and "claude" (Anthropic, needs credits).
"""
import re
import threading
import time
from dataclasses import dataclass

from . import config


@dataclass
class ModelReply:
    text: str
    latency_s: float
    model_name: str


class ModelError(Exception):
    """Raised when an API call fails (bad key, network, rate limit...)."""


# Clients are created lazily so the app can start without keys (e.g. mock mode).
# The lock stops two threads creating two clients at once (the loser would be
# garbage-collected and closed while still in use).
_gemini_client = None
_claude_client = None
_client_lock = threading.Lock()


def _gemini():
    global _gemini_client
    with _client_lock:
        if _gemini_client is None:
            if not config.GEMINI_API_KEY:
                raise ModelError("GEMINI_API_KEY is not set in .env")
            from google import genai

            _gemini_client = genai.Client(api_key=config.GEMINI_API_KEY)
    return _gemini_client


def _claude():
    global _claude_client
    with _client_lock:
        if _claude_client is None:
            if not config.ANTHROPIC_API_KEY:
                raise ModelError("ANTHROPIC_API_KEY is not set in .env")
            import anthropic

            _claude_client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    return _claude_client


_groq_client = None


def _groq():
    global _groq_client
    with _client_lock:
        if _groq_client is None:
            if not config.GROQ_API_KEY:
                raise ModelError("GROQ_API_KEY is not set in .env (free key: console.groq.com/keys)")
            from openai import OpenAI

            # max_retries=0: rate-limit retries are handled below so waits are visible and capped.
            _groq_client = OpenAI(api_key=config.GROQ_API_KEY, base_url=config.GROQ_BASE_URL, max_retries=0)
    return _groq_client


class RateLimiter:
    """Spaces out request starts so we stay under a requests-per-minute cap
    (the Gemini free tier allows only a few requests per minute)."""

    def __init__(self, rpm: float):
        self.interval = 60.0 / rpm if rpm > 0 else 0.0
        self.next_start = 0.0
        self.lock = threading.Lock()

    def wait(self):
        if not self.interval:
            return
        with self.lock:
            now = time.monotonic()
            start = max(now, self.next_start)
            self.next_start = start + self.interval
        time.sleep(max(0.0, start - now))


LIMITERS = {"gemini": RateLimiter(config.GEMINI_RPM), "groq": RateLimiter(config.GROQ_RPM)}


def _is_daily_limit(exc: Exception) -> bool:
    text = str(exc)
    return "429" in text and ("PerDay" in text or "per day" in text.lower())


def _rate_limit_delay(exc: Exception) -> float | None:
    """For a per-minute 429, return how many seconds the provider asks us to
    wait. Returns None for anything else, including per-day quotas, which
    won't recover by waiting a few seconds."""
    text = str(exc)
    if "429" not in text or _is_daily_limit(exc):
        return None
    headers = getattr(getattr(exc, "response", None), "headers", None) or {}
    if headers.get("retry-after"):  # Groq / OpenAI-style
        return float(headers["retry-after"]) + 1
    match = re.search(r"retryDelay['\"]?:\s*['\"](\d+(?:\.\d+)?)s", text)  # Gemini-style
    if match:
        return float(match.group(1)) + 1
    match = re.search(r"try again in (?:(\d+)m)?(\d+(?:\.\d+)?)s", text)  # Groq message text
    if match:
        return int(match.group(1) or 0) * 60 + float(match.group(2)) + 1
    return 20.0


def call_gemini(system: str, messages: list[dict], json_mode: bool) -> str:
    from google.genai import types

    gen_config = types.GenerateContentConfig(
        temperature=config.GEMINI_TEMPERATURE,
        max_output_tokens=config.MAX_OUTPUT_TOKENS,
        system_instruction=system or None,
        response_mime_type="application/json" if json_mode else None,
    )
    # Gemini calls the assistant role "model".
    contents = [
        {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
        for m in messages
    ]
    response = _gemini().models.generate_content(
        model=config.GEMINI_MODEL, contents=contents, config=gen_config
    )
    return response.text or ""


def call_groq(system: str, messages: list[dict], json_mode: bool) -> str:
    chat = ([{"role": "system", "content": system}] if system else []) + messages
    kwargs = dict(
        model=config.GROQ_MODEL,
        messages=chat,
        temperature=config.GROQ_TEMPERATURE,
        max_tokens=config.MAX_OUTPUT_TOKENS,
    )
    if json_mode:  # same rule as Gemini: native JSON mode for v2/v3 only
        kwargs["response_format"] = {"type": "json_object"}
    if "gpt-oss" in config.GROQ_MODEL:
        # gpt-oss "thinks" before answering; low effort keeps it fast and inside
        # the free tier's tokens-per-minute budget.
        kwargs["reasoning_effort"] = "low"
    response = _groq().chat.completions.create(**kwargs)
    return response.choices[0].message.content or ""


def call_claude(system: str, messages: list[dict], json_mode: bool) -> str:
    # json_mode is unused: for Claude we rely on the prompt alone (see CHANGELOG).
    kwargs = dict(
        model=config.CLAUDE_MODEL,
        max_tokens=config.MAX_OUTPUT_TOKENS,
        messages=messages,
        output_config={"effort": config.CLAUDE_EFFORT},
    )
    if system:
        kwargs["system"] = system
    # Server-side fallback: if the model declines, the API re-runs the request
    # on a fallback model inside the same call.
    response = _claude().beta.messages.create(
        **kwargs, betas=["server-side-fallback-2026-07-01"], fallbacks="default"
    )
    if response.stop_reason == "refusal":
        raise ModelError("Claude declined this request.")
    return "".join(block.text for block in response.content if block.type == "text")


PROVIDERS = {
    "gemini": (call_gemini, lambda: config.GEMINI_MODEL),
    "groq": (call_groq, lambda: config.GROQ_MODEL),
    "claude": (call_claude, lambda: config.CLAUDE_MODEL),
}


def call_model(model: str, system: str, messages: list[dict], json_mode: bool = False) -> ModelReply:
    """Call 'gemini', 'groq' or 'claude' and time it.

    Free tiers have per-minute limits, so requests are spaced out (LIMITERS)
    and a per-minute 429 is retried after the delay the provider asks for.
    Latency covers only the successful request, not time spent waiting."""
    if config.MOCK_MODE:
        from .mock_model import mock_reply

        start = time.perf_counter()
        text = mock_reply(model, messages)
        return ModelReply(text=text, latency_s=time.perf_counter() - start, model_name=f"mock-{model}")
    if model not in PROVIDERS:
        raise ModelError(f"Unknown model: {model}")

    call, model_name = PROVIDERS[model]
    limiter = LIMITERS.get(model)
    for attempt in range(6):
        if limiter:
            limiter.wait()
        start = time.perf_counter()
        try:
            text = call(system, messages, json_mode)
            return ModelReply(text=text, latency_s=time.perf_counter() - start, model_name=model_name())
        except ModelError:
            raise
        except Exception as exc:  # SDK errors: auth, network, rate limit...
            if _is_daily_limit(exc):
                raise ModelError(f"{model}: daily free-tier quota used up. Try again tomorrow.") from exc
            delay = _rate_limit_delay(exc)
            if delay is None or attempt == 5:
                raise ModelError(f"{model} API call failed: {exc}") from exc
            time.sleep(delay)
    raise ModelError(f"{model} API call failed after retries")
