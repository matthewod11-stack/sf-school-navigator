"""Normalize SFUSD school records into programs table schema."""

from __future__ import annotations

from typing import Any

from pipeline.extract.sfusd import SFUSDSchoolRecord
from pipeline.slug import make_program_slug
from pipeline.transform.completeness import compute_completeness_score


def _map_program_type(record: SFUSDSchoolRecord) -> str:
    """Map SFUSD school to program type enum."""
    if record.low_grade == "P":
        return "sfusd-prek"
    return "sfusd-tk"


def _format_address(record: SFUSDSchoolRecord) -> str:
    parts = [
        record.street_address.strip(),
        record.street_city.strip(),
        record.street_state.strip(),
        record.street_zip.strip(),
    ]
    return ", ".join(p for p in parts if p)


def _format_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    return phone.strip() or None


def _format_website(website: str | None) -> str | None:
    if not website:
        return None
    w = website.strip()
    if w and not w.startswith("http"):
        w = f"https://{w}"
    return w or None


def sfusd_to_program(record: SFUSDSchoolRecord) -> dict[str, Any]:
    """Transform a single SFUSD school into a programs table row dict."""
    name = record.school.strip()
    address = _format_address(record)
    neighborhood = record.analysis_neighborhood

    row: dict[str, Any] = {
        "name": name,
        "slug": make_program_slug(name, neighborhood),
        "address": address,
        "phone": _format_phone(record.phone),
        "website": _format_website(record.website),
        "primary_type": _map_program_type(record),
        "license_number": record.cds_code,  # Use CDS code as stable key
        "license_status": record.status,
        "data_source": "sfusd",
    }

    # Add coordinates if available
    if record.latitude and record.longitude:
        try:
            lng = float(record.longitude)
            lat = float(record.latitude)
            row["coordinates"] = f"SRID=4326;POINT({lng} {lat})"
        except (ValueError, TypeError):
            pass

    row["data_completeness_score"] = compute_completeness_score(row)

    return row


def transform_sfusd_records(records: list[SFUSDSchoolRecord]) -> list[dict[str, Any]]:
    """Transform all SFUSD records into program rows, ensuring unique slugs."""
    rows: list[dict[str, Any]] = []
    slug_counts: dict[str, int] = {}

    # First pass: count base slugs
    for record in records:
        name = record.school.strip()
        neighborhood = record.analysis_neighborhood
        base_slug = make_program_slug(name, neighborhood)
        slug_counts[base_slug] = slug_counts.get(base_slug, 0) + 1

    # Second pass: append CDS suffix for duplicates
    for record in records:
        row = sfusd_to_program(record)
        base_slug = row["slug"]
        if slug_counts.get(base_slug, 0) > 1:
            suffix = record.cds_code[-4:]
            row["slug"] = f"{base_slug}-{suffix}"
        rows.append(row)

    return rows
