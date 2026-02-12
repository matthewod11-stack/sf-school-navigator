"""Tests for CCL extraction helpers."""

from pipeline.extract import ccl


def test_download_ccl_rows_dedupes_across_resources(monkeypatch):
    calls: list[str] = []

    def fake_download(resource_id: str, *, page_size: int = 5000):
        calls.append(resource_id)
        if resource_id == ccl.CCL_CENTER_RESOURCE_ID:
            return [
                {"facility_number": "100", "facility_name": "Center A"},
                {"facility_number": "200", "facility_name": "Center B"},
            ]
        return [
            {"facility_number": "200", "facility_name": "Center B Duplicate"},
            {"facility_number": "300", "facility_name": "Family Home C"},
        ]

    monkeypatch.setattr(ccl, "_download_ccl_resource_rows", fake_download)

    rows = ccl.download_ccl_rows()

    assert calls == [ccl.CCL_CENTER_RESOURCE_ID, ccl.CCL_FAMILY_HOME_RESOURCE_ID]
    assert [r["facility_number"] for r in rows] == ["100", "200", "300"]


def test_filter_sf_licensed():
    rows = [
        {"county_name": "SAN FRANCISCO", "facility_status": "LICENSED"},
        {"county_name": "SAN FRANCISCO", "facility_status": "PENDING"},
        {"county_name": "ALAMEDA", "facility_status": "LICENSED"},
    ]

    filtered = ccl.filter_sf_licensed(rows)
    assert len(filtered) == 1
