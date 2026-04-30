from pipeline.enrich.elfa import (
    elfa_license_set,
    mark_elfa_cost_rows,
    normalize_license_number,
)


def test_normalize_license_number_digits_only():
    assert normalize_license_number("LIC-3800 001") == "3800001"
    assert normalize_license_number(None) is None


def test_elfa_license_set_accepts_common_columns():
    rows = [
        {"facility_number": "380000001"},
        {"license": "380000002"},
        {"name": "Missing"},
    ]

    assert elfa_license_set(rows) == {"380000001", "380000002"}


def test_mark_elfa_cost_rows_marks_only_confirmed_license_matches():
    program_rows = [
        {"id": "program-1", "license_number": "380000001"},
        {"id": "program-2", "license_number": "380000009"},
    ]
    cost_rows = [
        {"program_id": "program-1", "tuition_monthly_low": 2000},
        {"program_id": "program-2", "tuition_monthly_low": 2100},
    ]
    elfa_rows = [{"facility_number": "380000001"}]

    marked_rows, marked_count = mark_elfa_cost_rows(
        program_rows,
        cost_rows,
        elfa_rows,
        source_url="https://example.test/elfa",
        verified_at="2026-04-30T00:00:00+00:00",
    )

    assert marked_count == 1
    assert marked_rows[0]["elfa_participating"] is True
    assert marked_rows[0]["elfa_source_url"] == "https://example.test/elfa"
    assert marked_rows[0]["elfa_verified_at"] == "2026-04-30T00:00:00+00:00"
    assert "elfa_participating" not in marked_rows[1]
