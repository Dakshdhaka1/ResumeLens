import json

import pytest

from app.validator import InvalidReply, arithmetic_ok, extract_json, validate_reply


def good_reply(**overrides):
    data = {
        "requirements": ["SQL", "Python"],
        "gaps": [
            {"gap": "No visualisation tool", "priority": "medium"},
            {"gap": "No SQL project", "priority": "high"},
        ],
        "rewritten_bullets": [{"old": "Made a website", "new": "Built a website"}],
        "score": 58,
        "score_breakdown": {
            "skills_match": {"score": 22, "max": 40, "reason": "Python yes, SQL no"},
            "projects_experience": {"score": 18, "max": 30, "reason": "One project"},
            "bullet_clarity": {"score": 10, "max": 20, "reason": "Task lists"},
            "formatting_length": {"score": 8, "max": 10, "reason": "One page"},
        },
    }
    data.update(overrides)
    return data


def test_valid_reply_passes_and_gaps_sort_high_first():
    review = validate_reply(json.dumps(good_reply()))
    assert review.score == 58
    assert [g.priority for g in review.sorted_gaps()] == ["high", "medium"]


def test_extracts_json_from_markdown_fence_and_prose():
    text = "Sure! Here is the review:\n```json\n" + json.dumps(good_reply()) + "\n```\nHope it helps."
    assert extract_json(text)["score"] == 58


def test_wrong_sum_is_rejected():
    with pytest.raises(InvalidReply, match="sum"):
        validate_reply(json.dumps(good_reply(score=90)))


def test_wrong_max_and_over_max_rejected():
    bad = good_reply()
    bad["score_breakdown"]["skills_match"]["max"] = 50
    with pytest.raises(InvalidReply, match="max"):
        validate_reply(json.dumps(bad))

    bad = good_reply(score=78)
    bad["score_breakdown"]["skills_match"]["score"] = 42
    with pytest.raises(InvalidReply):
        validate_reply(json.dumps(bad))


def test_bad_priority_and_missing_keys_rejected():
    with pytest.raises(InvalidReply):
        validate_reply(json.dumps(good_reply(gaps=[{"gap": "x", "priority": "urgent"}])))
    v1_style = {"requirements": ["SQL"], "gaps": ["SQL"], "score": 50, "score_reasons": {}}
    with pytest.raises(InvalidReply):
        validate_reply(json.dumps(v1_style))


def test_not_json_rejected():
    with pytest.raises(InvalidReply):
        validate_reply("I think this resume is good, maybe 70/100.")
    with pytest.raises(InvalidReply, match="syntax"):
        validate_reply('{"score": 50,,}')


def test_arithmetic_check_on_raw_dicts():
    assert arithmetic_ok(good_reply()) is True
    assert arithmetic_ok(good_reply(score=60)) is False
    assert arithmetic_ok({"score": 50}) is None
