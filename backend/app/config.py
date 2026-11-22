"""All settings in one place. Change model names here or in the .env file."""
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]  # ResumeLens/
load_dotenv(ROOT_DIR / ".env")

PROMPTS_DIR = ROOT_DIR / "prompts"
TEST_CASES_DIR = ROOT_DIR / "data" / "test_cases"
EVAL_RESULTS_CSV = ROOT_DIR / "eval" / "results.csv"

# --- Models -----------------------------------------------------------------
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-5-5")

# Low temperature = more consistent scores. (Gemini only: current Claude
# models reject a custom temperature, so for Claude we use low effort instead.)
GEMINI_TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0.2"))
CLAUDE_EFFORT = os.getenv("CLAUDE_EFFORT", "low")
MAX_OUTPUT_TOKENS = 4096

# Requests per minute allowed by your Gemini plan (free tier: 5). 0 = no limit.
GEMINI_RPM = float(os.getenv("GEMINI_RPM", "5"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Groq: free tier, OpenAI-compatible API serving open-weight models (gpt-oss, Qwen).
# Any OpenAI-compatible provider works here by changing the base URL + model.
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_TEMPERATURE = float(os.getenv("GROQ_TEMPERATURE", "0.2"))
GROQ_RPM = float(os.getenv("GROQ_RPM", "3"))  # free tier: 1000 req/day but only 8000 tokens/min

# RESUMELENS_MOCK=1 returns a canned answer without calling any API.
# Useful for UI work, screenshots and tests when you have no keys.
MOCK_MODE = os.getenv("RESUMELENS_MOCK", "0") == "1"

# --- App --------------------------------------------------------------------
PROMPT_VERSIONS = ["v1", "v2", "v3"]
MODELS = ["gemini", "groq", "claude"]  # claude needs paid credits; the UI shows gemini + groq
MAX_INPUT_CHARS = 20_000  # per field; protects cost and latency
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
