"""Tests for SFUSD load helpers."""

from pipeline.load import sfusd


class _FakeQuery:
    def __init__(self, rows):
        self._rows = rows

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def execute(self):
        return type("Result", (), {"data": self._rows})()


class _FakeClient:
    def __init__(self, rows):
        self._rows = rows

    def table(self, _name: str):
        return _FakeQuery(self._rows)


def test_filter_sfusd_overlaps_skips_matching_rows(monkeypatch):
    ccl_rows = [
        {
            "id": "ccl-1",
            "name": "Mission Preschool",
            "address": "123 Main St, San Francisco, CA, 94110",
            "coordinates": "SRID=4326;POINT(-122.41000 37.77000)",
        }
    ]

    monkeypatch.setattr(sfusd, "get_supabase", lambda: _FakeClient(ccl_rows))

    sfusd_rows = [
        {
            "name": "Mission Preschool",
            "address": "123 Main St, San Francisco, CA, 94110",
            "license_number": "1234567",
            "coordinates": "SRID=4326;POINT(-122.41001 37.77001)",
        }
    ]

    filtered, skipped = sfusd.filter_sfusd_overlaps(sfusd_rows, dry_run=True)

    assert skipped == 1
    assert filtered == []


def test_filter_sfusd_overlaps_keeps_non_matching_rows(monkeypatch):
    ccl_rows = [
        {
            "id": "ccl-1",
            "name": "Mission Preschool",
            "address": "123 Main St, San Francisco, CA, 94110",
            "coordinates": "SRID=4326;POINT(-122.41000 37.77000)",
        }
    ]

    monkeypatch.setattr(sfusd, "get_supabase", lambda: _FakeClient(ccl_rows))

    sfusd_rows = [
        {
            "name": "Different School",
            "address": "999 Elsewhere Ave, San Francisco, CA, 94110",
            "license_number": "7654321",
            "coordinates": "SRID=4326;POINT(-122.39000 37.75000)",
        }
    ]

    filtered, skipped = sfusd.filter_sfusd_overlaps(sfusd_rows, dry_run=True)

    assert skipped == 0
    assert len(filtered) == 1


def test_format_feeder_name_normalizes_uppercase():
    assert sfusd._format_feeder_name("ALAMO ELEMENTARY SCHOOL") == "Alamo Elementary School"
