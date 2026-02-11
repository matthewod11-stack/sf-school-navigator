"""Tests for program enrichment extraction logic."""

from pipeline.enrich.extract_fields import (
    EnrichmentData,
    enrich_from_website,
    enrich_sfusd_program,
    enrich_with_defaults,
    _detect_language_from_name,
    _normalize_time,
    _parse_cost,
)


def _make_program(**overrides) -> dict:
    defaults = {
        "id": "test-id-001",
        "name": "Test Program",
        "primary_type": "center",
        "website": "https://example.com",
        "data_completeness_score": 50,
    }
    defaults.update(overrides)
    return defaults


class TestParseHelpers:
    def test_parse_cost_basic(self):
        assert _parse_cost("1234") == 1234.0

    def test_parse_cost_with_comma(self):
        assert _parse_cost("1,234") == 1234.0

    def test_parse_cost_with_dollar(self):
        assert _parse_cost("$2,500") == 2500.0

    def test_parse_cost_invalid(self):
        assert _parse_cost("free") is None

    def test_normalize_time_am(self):
        assert _normalize_time("7:30 am") == "07:30:00"

    def test_normalize_time_pm(self):
        assert _normalize_time("5:30 pm") == "17:30:00"

    def test_normalize_time_24h(self):
        assert _normalize_time("14:30") == "14:30:00"

    def test_normalize_time_noon(self):
        assert _normalize_time("12:00 pm") == "12:00:00"

    def test_normalize_time_midnight(self):
        assert _normalize_time("12:00 am") == "00:00:00"


class TestLanguageDetection:
    def test_english_default(self):
        result = _detect_language_from_name("Sunshine Preschool")
        assert result["language"] == "English"

    def test_chinese_immersion(self):
        result = _detect_language_from_name("Chinese Immersion School at DeAvila")
        assert result["language"] == "Mandarin"
        assert result["immersion_type"] == "full"

    def test_spanish_bilingual(self):
        result = _detect_language_from_name("Buena Vista Bilingual Academy")
        assert result["language"] == "Spanish"
        assert result["immersion_type"] == "dual"

    def test_japanese_school(self):
        result = _detect_language_from_name("Rosa Parks Japanese Bilingual")
        assert result["language"] == "Japanese"


class TestSFUSDEnrichment:
    def test_tk_program(self):
        program = _make_program(
            primary_type="sfusd-tk",
            name="Alamo Elementary",
        )
        data = enrich_sfusd_program(program)
        assert data.program_id == "test-id-001"
        assert len(data.schedules) == 1
        assert data.schedules[0]["schedule_type"] == "full-day"
        assert data.schedules[0]["open_time"] == "07:50:00"

    def test_prek_program(self):
        program = _make_program(
            primary_type="sfusd-prek",
            name="Cooper Children Center",
        )
        data = enrich_sfusd_program(program)
        # Pre-K gets both full and half day
        assert len(data.schedules) == 2
        types = {s["schedule_type"] for s in data.schedules}
        assert types == {"full-day", "half-day-am"}

    def test_sfusd_is_free(self):
        program = _make_program(primary_type="sfusd-tk", name="Test TK")
        data = enrich_sfusd_program(program)
        assert len(data.costs) == 1
        assert data.costs[0]["tuition_monthly_low"] == 0
        assert data.costs[0]["tuition_monthly_high"] == 0

    def test_sfusd_has_deadlines(self):
        program = _make_program(primary_type="sfusd-tk", name="Test TK")
        data = enrich_sfusd_program(program)
        assert len(data.deadlines) == 2
        dtypes = {d["deadline_type"] for d in data.deadlines}
        assert "application-open" in dtypes
        assert "application-close" in dtypes

    def test_sfusd_has_provenance(self):
        program = _make_program(primary_type="sfusd-tk", name="Test TK")
        data = enrich_sfusd_program(program)
        assert "schedule" in data.provenance
        assert "cost" in data.provenance
        assert "language" in data.provenance
        assert "deadline" in data.provenance

    def test_immersion_detection_in_sfusd(self):
        program = _make_program(
            primary_type="sfusd-tk",
            name="Chinese Immersion School at DeAvila",
        )
        data = enrich_sfusd_program(program)
        assert data.languages[0]["language"] == "Mandarin"
        assert data.languages[0]["immersion_type"] == "full"


class TestWebsiteExtraction:
    def test_cost_extraction(self):
        text = "Our tuition is $1,850/month for full-day preschool. Registration fee: $200."
        program = _make_program()
        data = enrich_from_website(program, text)
        assert len(data.costs) == 1
        assert data.costs[0]["tuition_monthly_low"] == 1850.0
        assert data.costs[0]["registration_fee"] == 200.0

    def test_schedule_extraction(self):
        text = "Full-day program runs 7:30 am - 5:30 pm Monday through Friday. Extended care available."
        program = _make_program()
        data = enrich_from_website(program, text)
        assert len(data.schedules) == 1
        assert data.schedules[0]["open_time"] == "07:30:00"
        assert data.schedules[0]["close_time"] == "17:30:00"
        assert data.schedules[0]["extended_care_available"] is True

    def test_language_detection(self):
        text = "We offer a Spanish immersion program alongside our English curriculum."
        program = _make_program()
        data = enrich_from_website(program, text)
        langs = {l["language"] for l in data.languages}
        assert "Spanish" in langs

    def test_summer_program_detection(self):
        text = "We offer a full-day program 8:00 am - 5:00 pm. Summer camp available June-August."
        program = _make_program()
        data = enrich_from_website(program, text)
        assert data.schedules[0]["summer_program"] is True
        assert data.schedules[0]["operates"] == "full-year"

    def test_subsidy_detection(self):
        text = "Tuition: $2,000/month. We accept subsidies and vouchers. Sliding scale available."
        program = _make_program()
        data = enrich_from_website(program, text)
        assert data.costs[0]["accepts_subsidies"] is True

    def test_no_schedule_info(self):
        text = "Welcome to our school. We love children."
        program = _make_program()
        data = enrich_from_website(program, text)
        # No schedule signal found
        assert len(data.schedules) == 0

    def test_default_english_when_no_language(self):
        text = "Welcome to our preschool."
        program = _make_program()
        data = enrich_from_website(program, text)
        assert data.languages[0]["language"] == "English"


class TestDefaultEnrichment:
    def test_has_schedule(self):
        program = _make_program()
        data = enrich_with_defaults(program)
        assert len(data.schedules) == 1
        assert data.schedules[0]["schedule_type"] == "full-day"

    def test_has_language(self):
        program = _make_program()
        data = enrich_with_defaults(program)
        assert len(data.languages) == 1

    def test_has_cost(self):
        program = _make_program()
        data = enrich_with_defaults(program)
        assert len(data.costs) == 1

    def test_has_deadline(self):
        program = _make_program()
        data = enrich_with_defaults(program)
        assert len(data.deadlines) == 1
        assert data.deadlines[0]["generic_deadline_estimate"] == "Contact program for dates"

    def test_has_provenance(self):
        program = _make_program()
        data = enrich_with_defaults(program)
        assert len(data.provenance) >= 3

    def test_has_data_property(self):
        program = _make_program()
        data = enrich_with_defaults(program)
        assert data.has_data is True

    def test_empty_enrichment_has_no_data(self):
        data = EnrichmentData(program_id="x", program_name="x")
        assert data.has_data is False
