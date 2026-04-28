"""Tests for address validation helpers."""

from pipeline.validate.addresses import (
    GeocodeCandidate,
    classify_address_result,
    haversine_meters,
    is_within_sf_bounds,
    parse_point,
)


def _row(**overrides):
    row = {
        "id": "p1",
        "name": "Test Program",
        "address": "123 Main St, San Francisco, CA",
        "coordinates": "SRID=4326;POINT(-122.41000 37.77000)",
    }
    row.update(overrides)
    return row


def test_parse_point_supports_geojson_and_wkt():
    assert parse_point({"type": "Point", "coordinates": [-122.4, 37.7]}) == (
        -122.4,
        37.7,
    )
    assert parse_point("SRID=4326;POINT(-122.4 37.7)") == (-122.4, 37.7)


def test_sf_bounds():
    assert is_within_sf_bounds(-122.42, 37.77)
    assert not is_within_sf_bounds(-122.1, 37.77)
    assert not is_within_sf_bounds(-122.42, 38.0)


def test_haversine_meters_detects_large_mismatch():
    distance = haversine_meters((-122.41000, 37.77000), (-122.42000, 37.78000))
    assert distance > 1_000


def test_classify_address_result_valid():
    result = classify_address_result(
        _row(),
        GeocodeCandidate(longitude=-122.41001, latitude=37.77001, relevance=0.98),
        checked_at="2026-04-28T00:00:00+00:00",
    )

    assert result.status == "valid"
    assert result.mismatch_meters is not None
    assert result.mismatch_meters < 5


def test_classify_address_result_low_relevance():
    result = classify_address_result(
        _row(),
        GeocodeCandidate(longitude=-122.41001, latitude=37.77001, relevance=0.4),
        checked_at="2026-04-28T00:00:00+00:00",
    )

    assert result.status == "low_relevance"


def test_classify_address_result_outside_sf():
    result = classify_address_result(
        _row(),
        GeocodeCandidate(longitude=-121.9, latitude=37.77, relevance=0.95),
        checked_at="2026-04-28T00:00:00+00:00",
    )

    assert result.status == "outside_sf"


def test_classify_address_result_missing_coordinates_and_mismatch():
    missing = classify_address_result(
        _row(coordinates=None),
        GeocodeCandidate(longitude=-122.41001, latitude=37.77001, relevance=0.95),
        checked_at="2026-04-28T00:00:00+00:00",
    )
    mismatch = classify_address_result(
        _row(),
        GeocodeCandidate(longitude=-122.49, latitude=37.81, relevance=0.95),
        checked_at="2026-04-28T00:00:00+00:00",
    )

    assert missing.status == "missing_coordinates"
    assert mismatch.status == "mismatch"
    assert mismatch.mismatch_meters and mismatch.mismatch_meters > 500


def test_classify_address_result_missing_address_and_failed_geocode():
    missing = classify_address_result(
        _row(address=""),
        None,
        checked_at="2026-04-28T00:00:00+00:00",
    )
    failed = classify_address_result(
        _row(),
        None,
        checked_at="2026-04-28T00:00:00+00:00",
    )

    assert missing.status == "missing_address"
    assert failed.status == "geocode_failed"

