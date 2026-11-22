"""Rule-based fabrication check for rewritten bullets.

A rewritten bullet is flagged if it contains a NUMBER, a known TOOL/SKILL, or a
tech-looking TOKEN (acronym, CamelCase, dotted name like Node.js) that does not
appear anywhere in the original resume. This is deliberately simple so it is
easy to explain: it can miss paraphrased fabrications (the optional LLM judge in
eval/ covers those) and it never needs an API call.
"""
import re

# Common tools and skills in student resumes. Lower-case; matched on word boundaries.
SKILL_LEXICON = {
    # languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "golang", "rust", "kotlin",
    "swift", "php", "ruby", "r", "matlab", "scala", "sql", "html", "css", "bash",
    # data / ml
    "pandas", "numpy", "scikit-learn", "sklearn", "tensorflow", "pytorch", "keras", "opencv",
    "nlp", "llm", "transformers", "hugging face", "xgboost", "spark", "hadoop", "airflow",
    "tableau", "power bi", "excel", "looker", "matplotlib", "seaborn", "plotly", "statistics",
    "a/b testing", "regression", "deep learning", "machine learning", "computer vision",
    # web / backend
    "react", "next.js", "node.js", "express", "django", "flask", "fastapi", "spring", "spring boot",
    "angular", "vue", "tailwind", "bootstrap", "graphql", "rest", "redux", "jquery",
    # infra / tools
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "git", "github", "linux", "ci/cd",
    "terraform", "firebase", "mongodb", "mysql", "postgresql", "postgres", "redis", "kafka",
    "figma", "jira", "selenium", "junit", "pytest", "postman",
    # business / non-tech
    "salesforce", "hubspot", "google analytics", "seo", "sem", "canva", "crm", "sap",
}

NUMBER = re.compile(r"\d+(?:[.,]\d+)?")
# Acronyms (AWS, ETL), CamelCase (PowerBI, TensorFlow), dotted names (Node.js).
TECH_TOKEN = re.compile(r"\b(?:[A-Z]{2,}[A-Za-z]*|[A-Z][a-z]+[A-Z][A-Za-z]*|[A-Za-z]+\.(?:js|py|io|net))\b")


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower())


def _contains_term(haystack: str, term: str) -> bool:
    # Custom boundaries so "c++" and "next.js" work and "r" doesn't match "react".
    return re.search(rf"(?<![\w+#.]){re.escape(term)}(?![\w+#])", haystack) is not None


def unsupported_facts(new_bullet: str, resume: str) -> list[str]:
    """Return the facts in `new_bullet` that are not found in `resume`."""
    resume_n = _norm(resume)
    bullet_n = _norm(new_bullet)
    resume_numbers = {n.replace(",", "") for n in NUMBER.findall(resume_n)}
    problems: list[str] = []

    for num in NUMBER.findall(bullet_n):
        if num.replace(",", "") not in resume_numbers:
            problems.append(num)

    for term in SKILL_LEXICON:
        if _contains_term(bullet_n, term) and not _contains_term(resume_n, term):
            problems.append(term)

    for token in TECH_TOKEN.findall(new_bullet):
        t = token.lower()
        if t not in resume_n and t not in problems:
            problems.append(token)

    # De-duplicate, keep order.
    return list(dict.fromkeys(problems))


def check_bullets(rewritten: list[dict], resume: str) -> list[dict]:
    """Check every rewritten bullet. Returns only the flagged ones:
    [{"index": 0, "new": "...", "unsupported": ["40%", "tableau"]}, ...]"""
    flags = []
    for i, bullet in enumerate(rewritten):
        missing = unsupported_facts(bullet.get("new", ""), resume)
        if missing:
            flags.append({"index": i, "new": bullet.get("new", ""), "unsupported": missing})
    return flags
