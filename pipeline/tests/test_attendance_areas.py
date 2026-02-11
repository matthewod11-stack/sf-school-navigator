"""Tests for attendance area extraction and transformation."""

from pipeline.extract.attendance_areas import (
    AttendanceAreaRecord,
    _multipolygon_to_polygon_wkt,
    area_to_db_row,
)


def _make_area(**overrides) -> AttendanceAreaRecord:
    defaults = {
        "aaname": "Mission",
        "e_aa_name": "MISSION",
        "e_aa_schno": "507.0",
        "the_geom": {
            "type": "MultiPolygon",
            "coordinates": [
                [
                    [
                        [-122.42, 37.76],
                        [-122.41, 37.76],
                        [-122.41, 37.77],
                        [-122.42, 37.77],
                        [-122.42, 37.76],
                    ]
                ]
            ],
        },
    }
    defaults.update(overrides)
    return AttendanceAreaRecord.model_validate(defaults)


class TestAttendanceAreaRecord:
    def test_valid_record(self):
        record = _make_area()
        assert record.aaname == "Mission"
        assert record.e_aa_schno == "507"

    def test_float_school_number(self):
        record = _make_area(e_aa_schno=507.0)
        assert record.e_aa_schno == "507"

    def test_string_school_number(self):
        record = _make_area(e_aa_schno="614")
        assert record.e_aa_schno == "614"


class TestGeometryConversion:
    def test_multipolygon_to_wkt(self):
        geom = {
            "type": "MultiPolygon",
            "coordinates": [
                [
                    [
                        [-122.42, 37.76],
                        [-122.41, 37.76],
                        [-122.41, 37.77],
                        [-122.42, 37.77],
                        [-122.42, 37.76],
                    ]
                ]
            ],
        }
        wkt = _multipolygon_to_polygon_wkt(geom)
        assert wkt.startswith("SRID=4326;POLYGON((")
        assert "-122.42 37.76" in wkt
        assert wkt.endswith("))")


class TestAreaToDbRow:
    def test_basic_transform(self):
        record = _make_area()
        row = area_to_db_row(record)
        assert row["name"] == "Mission"
        assert row["school_year"] == "2024-25"
        assert row["linked_elementary_school_ids"] == ["507"]
        assert "POLYGON" in row["geometry"]

    def test_custom_school_year(self):
        record = _make_area()
        row = area_to_db_row(record, school_year="2025-26")
        assert row["school_year"] == "2025-26"
