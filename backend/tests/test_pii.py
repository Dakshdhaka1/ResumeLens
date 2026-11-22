from app.pii import strip_pii


def types_of(removed):
    return [r["type"] for r in removed]


def test_removes_email_phone_and_profiles():
    text = "Asha K | asha.k@example.com | +91 98765 43210 | linkedin.com/in/asha-k | https://github.com/ashak"
    clean, removed = strip_pii(text)
    assert "example.com" not in clean
    assert "98765" not in clean
    assert "linkedin" not in clean and "github" not in clean
    assert sorted(types_of(removed)) == ["email", "phone", "profile_url", "profile_url"]
    assert "[EMAIL]" in clean and "[PHONE]" in clean


def test_phone_formats():
    for phone in ["9876543210", "+91-90000-33333", "(+91) 90000 44444", "(555) 123-4567", "98765 00002"]:
        clean, removed = strip_pii(f"Call {phone} today")
        assert "phone" in types_of(removed), phone
        assert "[PHONE]" in clean


def test_bracketed_country_code_fully_removed():
    clean, _ = strip_pii("x | (+91) 90000 44444 | y")
    assert clean == "x | [PHONE] | y"


def test_keeps_years_scores_and_numbers():
    text = "B.Tech 2022-2026, CGPA 8.4, solved 450 problems, 82%, rating 1650\nBCA, 2023-2026. 82%"
    clean, removed = strip_pii(text)
    assert removed == []
    assert clean == text


def test_removes_street_address_and_labelled_address():
    clean, removed = strip_pii("Lives at 14 Lotus Lane, Green Park, Pune 411001")
    assert "Lotus" not in clean and "address" in types_of(removed)

    clean, removed = strip_pii("Address: Flat 3B, Sunshine Apartments, Kochi\nSKILLS: Python")
    assert "Sunshine" not in clean
    assert "SKILLS: Python" in clean


def test_resume_content_is_untouched():
    text = "- Built REST endpoints in Java\n- Wrote 35 JUnit tests"
    clean, removed = strip_pii(text)
    assert clean == text and removed == []
