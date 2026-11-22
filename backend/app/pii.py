"""Strip contact details before any text leaves the machine.

Removes: emails, phone numbers, LinkedIn/GitHub (and other profile) URLs,
and street addresses. Each match is replaced with a tag like [EMAIL] and
reported back so the UI can show the user exactly what was removed.
"""
import re

EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")

PROFILE_URL = re.compile(
    r"(?:https?://)?(?:www\.)?(?:linkedin\.com|github\.com|gitlab\.com|leetcode\.com)/[^\s,;|)]*",
    re.IGNORECASE,
)

# Candidate phone numbers: optional +country code, then digits with spaces,
# dots, dashes or brackets. We keep only matches with 10-13 digits so that
# years ("2021-2025"), CGPAs and dates are left alone.
PHONE_CANDIDATE = re.compile(r"(?<![\w(])(?:\(?\+\d{1,3}\)?[\s.-]?)?(?:\(?\d[\d\s().-]{8,16}\d)(?![\w])")
YEAR_RANGE = re.compile(r"(19|20)\d\d\s*[-–]\s*(19|20)\d\d")

STREET_WORDS = (
    r"Street|St\.?|Road|Rd\.?|Lane|Ln\.?|Avenue|Ave\.?|Marg|Nagar|Colony|Sector|"
    r"Block|Apartments?|Apt\.?|Flat|Layout|Cross|Main|Boulevard|Blvd\.?|Drive|Dr\.?"
)
# "12 MG Road, Indiranagar, Bengaluru 560038" -> up to the end of the line.
STREET_ADDRESS = re.compile(
    rf"\b(?:No\.?\s*|#\s*)?\d{{1,5}}[A-Za-z]?(?:/\d+)?,?\s+(?:[A-Z][\w.'-]*\s+){{0,4}}(?:{STREET_WORDS})\b[^\n]*",
)
# "Address: anything" -> the rest of the line.
ADDRESS_LABEL = re.compile(r"(?im)^\s*(?:address|addr\.?)\s*[:\-][^\n]*")


def _phone_matches(text: str) -> list[str]:
    found = []
    for match in PHONE_CANDIDATE.finditer(text):
        value = match.group().strip()
        digits = re.sub(r"\D", "", value)
        # Skip "2022-2026. 82" style matches (year range followed by a score).
        if 10 <= len(digits) <= 13 and not YEAR_RANGE.search(value):
            found.append(value)
    return found


def strip_pii(text: str) -> tuple[str, list[dict]]:
    """Return (clean_text, removed) where removed is [{"type", "value"}, ...]."""
    removed: list[dict] = []

    def replace_all(pattern, label, current):
        def _sub(match):
            removed.append({"type": label.lower(), "value": match.group().strip()})
            return f"[{label}]"

        return pattern.sub(_sub, current)

    # Order matters: emails and URLs first so their digits aren't read as phones.
    text = replace_all(EMAIL, "EMAIL", text)
    text = replace_all(PROFILE_URL, "PROFILE_URL", text)
    text = replace_all(ADDRESS_LABEL, "ADDRESS", text)
    text = replace_all(STREET_ADDRESS, "ADDRESS", text)
    for phone in _phone_matches(text):
        if phone in text:
            removed.append({"type": "phone", "value": phone})
            text = text.replace(phone, "[PHONE]", 1)
    return text, removed
