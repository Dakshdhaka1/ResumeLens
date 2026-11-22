"""The output contract. Every model reply must parse into `ResumeReview`."""
from typing import Literal

from pydantic import BaseModel, Field, model_validator

# Fixed rubric: criterion key -> max points. Shared by prompts, validator and UI.
RUBRIC = {
    "skills_match": 40,
    "projects_experience": 30,
    "bullet_clarity": 20,
    "formatting_length": 10,
}

PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}


class Gap(BaseModel):
    gap: str = Field(min_length=1)
    priority: Literal["high", "medium", "low"]


class RewrittenBullet(BaseModel):
    old: str = Field(min_length=1)
    new: str = Field(min_length=1)
    source_line: str | None = None  # v3 only: the resume line the facts came from


class CriterionScore(BaseModel):
    score: int = Field(ge=0)
    max: int
    reason: str = Field(min_length=1)


class ScoreBreakdown(BaseModel):
    skills_match: CriterionScore
    projects_experience: CriterionScore
    bullet_clarity: CriterionScore
    formatting_length: CriterionScore

    @model_validator(mode="after")
    def check_maxima(self):
        for key, max_points in RUBRIC.items():
            crit: CriterionScore = getattr(self, key)
            if crit.max != max_points:
                raise ValueError(f"{key}.max must be {max_points}, got {crit.max}")
            if crit.score > max_points:
                raise ValueError(f"{key}.score {crit.score} is above its max {max_points}")
        return self

    def total(self) -> int:
        return sum(getattr(self, key).score for key in RUBRIC)


class ResumeReview(BaseModel):
    requirements: list[str] = Field(min_length=1)
    gaps: list[Gap]
    rewritten_bullets: list[RewrittenBullet]
    score: int = Field(ge=0, le=100)
    score_breakdown: ScoreBreakdown
    warnings: list[str] = Field(default_factory=list)  # v3 only: injection notes

    @model_validator(mode="after")
    def check_sum(self):
        total = self.score_breakdown.total()
        if self.score != total:
            raise ValueError(f"score {self.score} does not equal the sum of criteria ({total})")
        return self

    def sorted_gaps(self) -> list[Gap]:
        return sorted(self.gaps, key=lambda g: PRIORITY_ORDER[g.priority])
