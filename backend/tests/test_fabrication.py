from app.fabrication import check_bullets, unsupported_facts

RESUME = """SKILLS: Python, Pandas, Excel
- Made python script to collect IPL match data from public CSV files
- Created 6 charts in Matplotlib comparing team performance across 5 seasons
"""


def test_faithful_rewrite_is_not_flagged():
    new = "Built a Python script that collects IPL match data from public CSV files"
    assert unsupported_facts(new, RESUME) == []


def test_invented_number_is_flagged():
    assert "40" in unsupported_facts("Cut data collection time by 40% with a Python script", RESUME)


def test_numbers_already_in_resume_are_fine():
    assert unsupported_facts("Visualised 5 seasons of team performance in 6 Matplotlib charts", RESUME) == []


def test_invented_tool_is_flagged():
    flags = unsupported_facts("Built a Tableau dashboard of IPL data using SQL", RESUME)
    assert "tableau" in flags and "sql" in flags


def test_invented_tech_token_is_flagged():
    flags = unsupported_facts("Deployed the script on AWS Lambda with FastAPI", RESUME)
    assert "aws" in flags or "AWS" in flags
    assert "fastapi" in flags


def test_short_skill_names_do_not_match_inside_words():
    # 'r' and 'go' must not match inside 'React' or 'good'
    resume = "- Built a React app\n- Good teamwork"
    assert unsupported_facts("Built a React app with good structure", resume) == []


def test_check_bullets_returns_only_flagged():
    bullets = [
        {"old": "a", "new": "Built a Python script for CSV files"},
        {"old": "b", "new": "Improved accuracy by 25% using PyTorch"},
    ]
    flags = check_bullets(bullets, RESUME)
    assert len(flags) == 1 and flags[0]["index"] == 1
