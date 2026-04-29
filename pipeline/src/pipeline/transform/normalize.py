"""Normalize CCL records into programs table schema."""

from __future__ import annotations

from typing import Any

from pipeline.extract.ccl import CCLRecord
from pipeline.slug import make_program_slug
from pipeline.transform.completeness import compute_completeness_score

# CCL facility_type -> program primary_type enum
_FACILITY_TYPE_MAP: dict[str, str] = {
    "DAY CARE CENTER": "center",
    "INFANT CENTER": "center",
    "SCHOOL AGE DAY CARE CENTER": "center",
    "SINGLE LICENSED CHILD CARE CENTER": "center",
    "FAMILY CHILD CARE HOME": "family-home",
    "GROUP HOME": "family-home",
    "SMALL FAMILY HOME": "family-home",
    "LARGE FAMILY HOME": "family-home",
}


def _map_facility_type(facility_type: str) -> str:
    normalized = facility_type.strip().upper()
    return _FACILITY_TYPE_MAP.get(normalized, "other")


def _format_address(record: CCLRecord) -> str:
    parts = [
        record.facility_address.strip(),
        record.facility_city.strip(),
        record.facility_state.strip(),
        record.facility_zip.strip(),
    ]
    return ", ".join(p for p in parts if p)


def _format_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return phone.strip() or None


def ccl_to_program(record: CCLRecord, *, slug_suffix: str | None = None) -> dict[str, Any]:
    """Transform a single CCL record into a programs table row dict."""
    address = _format_address(record)
    primary_type = _map_facility_type(record.facility_type)
    name = record.facility_name.strip()

    slug = make_program_slug(name)
    if slug_suffix:
        slug = f"{slug}-{slug_suffix}"

    row: dict[str, Any] = {
        "name": name,
        "slug": slug,
        "address": address,
        "phone": _format_phone(record.facility_telephone_number),
        "primary_type": primary_type,
        "grade_levels": ["prek", "tk"],
        "license_number": record.facility_number.strip(),
        "license_status": record.facility_status.strip(),
        "data_source": "ccl",
    }

    if record.facility_capacity is not None:
        row["age_min_months"] = None
        row["age_max_months"] = None

    row["data_completeness_score"] = compute_completeness_score(row)

    return row


def transform_ccl_records(records: list[CCLRecord]) -> list[dict[str, Any]]:
    """Transform all CCL records into program rows, ensuring unique slugs."""
    # First pass: generate base slugs
    rows: list[dict[str, Any]] = []
    slug_counts: dict[str, int] = {}

    for record in records:
        base_slug = make_program_slug(record.facility_name.strip())
        slug_counts[base_slug] = slug_counts.get(base_slug, 0) + 1

    # Second pass: append license suffix for duplicates
    slug_seen: dict[str, int] = {}
    for record in records:
        base_slug = make_program_slug(record.facility_name.strip())
        suffix: str | None = None
        if slug_counts[base_slug] > 1:
            # Use last 4 chars of license number for uniqueness
            suffix = record.facility_number.strip()[-4:]
        row = ccl_to_program(record, slug_suffix=suffix)
        rows.append(row)

    return rows
