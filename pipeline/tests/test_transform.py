"""Tests for CCL data transformation."""

from pipeline.extract.ccl import CCLRecord
from pipeline.slug import make_program_slug
from pipeline.transform.completeness import compute_completeness_score
from pipeline.transform.normalize import ccl_to_program, transform_ccl_records


def _make_record(**overrides) -> CCLRecord:
    defaults = {
        "facility_number": "384001234",
        "facility_name": "Sunshine Day Care Center",
        "facility_type": "DAY CARE CENTER",
        "facility_address": "123 Main St",
        "facility_city": "San Francisco",
        "facility_state": "CA",
        "facility_zip": "94110",
        "facility_telephone_number": "4155551234",
        "facility_capacity": 30,
        "facility_status": "LICENSED",
        "county_name": "SAN FRANCISCO",
    }
    defaults.update(overrides)
    return CCLRecord.model_validate(defaults)


class TestSlug:
    def test_basic_slug(self):
        assert make_program_slug("Sunshine Day Care") == "sunshine-day-care"

    def test_slug_with_neighborhood(self):
        slug = make_program_slug("Sunshine Day Care", "Mission")
        assert slug == "sunshine-day-care-mission"

    def test_slug_special_chars(self):
        slug = make_program_slug("St. Mary's Pre-K & Kindergarten")
        assert slug == "st-mary-s-pre-k-kindergarten"


class TestCompleteness:
    def test_empty_row(self):
        assert compute_completeness_score({}) == 0

    def test_ccl_row(self):
        row = {
            "name": "Test",
            "address": "123 Main",
            "primary_type": "center",
            "license_number": "123",
        }
        score = compute_completeness_score(row)
        # name(15) + address(15) + primary_type(10) + license_number(10) = 50
        assert score == 50

    def test_full_row(self):
        row = {
            "name": "Test",
            "address": "123 Main",
            "coordinates": "POINT(1 2)",
            "phone": "555-1234",
            "website": "https://example.com",
            "primary_type": "center",
            "license_number": "123",
            "age_min_months": 24,
            "age_max_months": 60,
            "potty_training_required": True,
            "logo_url": "https://example.com/logo.png",
            "featured_image_url": "https://example.com/photo.jpg",
        }
        assert compute_completeness_score(row) == 100

    def test_other_type_not_counted(self):
        row = {"primary_type": "other"}
        assert compute_completeness_score(row) == 0


class TestNormalize:
    def test_basic_transform(self):
        record = _make_record()
        row = ccl_to_program(record)
        assert row["name"] == "Sunshine Day Care Center"
        assert row["license_number"] == "384001234"
        assert row["primary_type"] == "center"
        assert row["data_source"] == "ccl"
        assert row["license_status"] == "LICENSED"
        assert row["slug"] == "sunshine-day-care-center"

    def test_family_home_type(self):
        record = _make_record(facility_type="FAMILY CHILD CARE HOME")
        row = ccl_to_program(record)
        assert row["primary_type"] == "family-home"

    def test_phone_formatting(self):
        record = _make_record(facility_telephone_number="4155551234")
        row = ccl_to_program(record)
        assert row["phone"] == "(415) 555-1234"

    def test_address_formatting(self):
        record = _make_record()
        row = ccl_to_program(record)
        assert row["address"] == "123 Main St, San Francisco, CA, 94110"

    def test_transform_batch(self):
        records = [_make_record(facility_number=f"38400{i}") for i in range(10)]
        rows = transform_ccl_records(records)
        assert len(rows) == 10
        assert all(r["data_source"] == "ccl" for r in rows)


class TestCCLRecord:
    def test_valid_record(self):
        record = _make_record()
        assert record.facility_number == "384001234"
        assert record.facility_capacity == 30

    def test_empty_capacity(self):
        record = _make_record(facility_capacity="")
        assert record.facility_capacity is None

    def test_non_numeric_capacity(self):
        record = _make_record(facility_capacity="N/A")
        assert record.facility_capacity is None
