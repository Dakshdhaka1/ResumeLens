"""FastAPI routes. All logic lives in the other modules; this file only wires
HTTP requests to them. Nothing the user sends is ever written to disk."""
import csv
import json
from concurrent.futures import ThreadPoolExecutor
from typing import Literal

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import config
from .analyzer import analyze
from .fabrication import check_bullets
from .llm_clients import ModelError
from .pdf_text import pdf_bytes_to_text
from .pii import strip_pii

app = FastAPI(title="ResumeLens API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

ModelName = Literal["gemini", "groq", "claude"]
Version = Literal["v1", "v2", "v3"]


class AnalyzeRequest(BaseModel):
    resume: str = Field(min_length=20, max_length=config.MAX_INPUT_CHARS)
    job_description: str = Field(min_length=20, max_length=config.MAX_INPUT_CHARS)
    model: ModelName = "gemini"
    prompt_version: Version = "v3"


class RunConfig(BaseModel):
    model: ModelName
    prompt_version: Version


class CompareRequest(BaseModel):
    resume: str = Field(min_length=20, max_length=config.MAX_INPUT_CHARS)
    job_description: str = Field(min_length=20, max_length=config.MAX_INPUT_CHARS)
    left: RunConfig
    right: RunConfig


class TextIn(BaseModel):
    text: str = Field(max_length=config.MAX_INPUT_CHARS)


def run_one(resume: str, jd: str, model: str, version: str) -> dict:
    try:
        result = analyze(resume, jd, model, version)
    except ModelError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    out = result.to_dict()
    clean_resume, _ = strip_pii(resume)
    out["fabrication_flags"] = (
        check_bullets(out["review"]["rewritten_bullets"], clean_resume) if out["ok"] else []
    )
    return out


@app.get("/health")
def health():
    return {
        "status": "ok",
        "mock_mode": config.MOCK_MODE,
        "models": {"gemini": config.GEMINI_MODEL, "groq": config.GROQ_MODEL, "claude": config.CLAUDE_MODEL},
        "keys": {"gemini": bool(config.GEMINI_API_KEY), "groq": bool(config.GROQ_API_KEY),
                 "claude": bool(config.ANTHROPIC_API_KEY)},
    }


@app.post("/analyze")
def analyze_route(req: AnalyzeRequest):
    return run_one(req.resume, req.job_description, req.model, req.prompt_version)


@app.post("/compare")
def compare_route(req: CompareRequest):
    # Run both sides in parallel so compare takes about as long as one analysis.
    with ThreadPoolExecutor(max_workers=2) as pool:
        left = pool.submit(run_one, req.resume, req.job_description, req.left.model, req.left.prompt_version)
        right = pool.submit(run_one, req.resume, req.job_description, req.right.model, req.right.prompt_version)
        return {"left": left.result(), "right": right.result()}


@app.post("/pii-preview")
def pii_preview(body: TextIn):
    """Lets the UI show what will be removed before the user presses Analyze."""
    _, removed = strip_pii(body.text)
    return {"removed": removed}


@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=415, detail="Please upload a PDF file.")
    data = await file.read()  # stays in memory only
    try:
        return {"text": pdf_bytes_to_text(data)}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Could not read this PDF.") from exc


@app.get("/samples")
def samples():
    """Made-up test cases from data/test_cases, for the 'Load sample' buttons."""
    items = []
    for case_dir in sorted(p for p in config.TEST_CASES_DIR.iterdir() if p.is_dir()):
        meta = json.loads((case_dir / "meta.json").read_text(encoding="utf-8"))
        items.append({
            "id": case_dir.name,
            "title": meta.get("title", case_dir.name),
            "role": meta.get("role", ""),
            "resume": (case_dir / "resume.txt").read_text(encoding="utf-8"),
            "job_description": (case_dir / "jd.txt").read_text(encoding="utf-8"),
        })
    return items


@app.get("/eval/results")
def eval_results():
    """Rows from eval/results.csv for the dashboard. If the real eval has not
    been run yet, falls back to results_mock.csv and marks it as demo data."""
    path, demo = config.EVAL_RESULTS_CSV, False
    if not path.exists():
        path, demo = path.with_name("results_mock.csv"), True
    if not path.exists():
        return {"rows": [], "demo": False, "source": None}
    with path.open(encoding="utf-8") as f:
        return {"rows": list(csv.DictReader(f)), "demo": demo, "source": path.name}
