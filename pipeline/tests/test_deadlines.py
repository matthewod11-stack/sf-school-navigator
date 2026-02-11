"""Tests for application deadlines collection logic."""

from pipeline.enrich.deadlines import (
    _SFUSD_DEADLINES_2026_27,
    _GENERIC_ESTIMATES,
)


class TestSFUSDDeadlines:
    def test_has_four_deadline_types(self):
        types = {d["deadline_type"] for d in _SFUSD_DEADLINES_2026_27}
        assert types == {"application-open", "application-close", "notification", "waitlist"}

    def test_all_have_dates(self):
        for d in _SFUSD_DEADLINES_2026_27:
            assert d.get("date") is not None, f"Missing date for {d['deadline_type']}"

    def test_all_have_source_url(self):
        for d in _SFUSD_DEADLINES_2026_27:
            assert "sfusd.edu" in d.get("source_url", "")

    def test_dates_are_chronological(self):
        dates = [d["date"] for d in _SFUSD_DEADLINES_2026_27]
        assert dates == sorted(dates), "SFUSD deadlines should be in chronological order"

    def test_school_year(self):
        for d in _SFUSD_DEADLINES_2026_27:
            assert d["school_year"] == "2026-27"


class TestGenericEstimates:
    def test_center_has_estimate(self):
        assert "center" in _GENERIC_ESTIMATES
        assert len(_GENERIC_ESTIMATES["center"]) >= 1

    def test_all_types_have_deadline_type(self):
        for ptype, templates in _GENERIC_ESTIMATES.items():
            for tmpl in templates:
                assert "deadline_type" in tmpl, f"Missing deadline_type for {ptype}"

    def test_all_have_description(self):
        for ptype, templates in _GENERIC_ESTIMATES.items():
            for tmpl in templates:
                assert "description" in tmpl, f"Missing description for {ptype}"

    def test_all_have_estimate_text(self):
        for ptype, templates in _GENERIC_ESTIMATES.items():
            for tmpl in templates:
                assert (
                    "generic_deadline_estimate" in tmpl
                ), f"Missing generic_deadline_estimate for {ptype}"

    def test_covers_main_program_types(self):
        expected = {"center", "family-home", "montessori", "head-start"}
        covered = set(_GENERIC_ESTIMATES.keys())
        assert expected.issubset(covered)
