"""Normalize CDE school records into programs table rows."""

from __future__ import annotations

from typing import Any

from pipeline.extract.cde import CDEPrivateSchoolRecord, CDEPublicSchoolRecord
from pipeline.slug import make_program_slug
from pipeline.transform.completeness import compute_completeness_score


def _clean_no_data(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = value.strip()
    if not cleaned or cleaned.lower() in {"no data", "n/a", "na", "none", "null"}:
        return None
    return cleaned


def _format_address(record: CDEPublicSchoolRecord) -> str | None:
    street = _clean_no_data(record.street)
    city = _clean_no_data(record.city)
    state = _clean_no_data(record.state)
    zip_code = _clean_no_data(record.zip_code)
    parts = [street, city, state, zip_code]
    if not street:
        return None
    return ", ".join(p for p in parts if p)


def _format_website(website: str | None) -> str | None:
    site = _clean_no_data(website)
    if not site:
        return None
    if not site.startswith("http"):
        return f"https://{site}"
    return site


def private_to_program(record: CDEPrivateSchoolRecord) -> dict[str, Any]:
    row: dict[str, Any] = {
        "name": record.school_name.strip(),
        "slug": make_program_slug(record.school_name.strip()),
        "primary_type": "private-elementary",
        "grade_levels": record.grade_levels,
        "license_number": record.cds_code.strip(),
        "license_status": "Active",
        "data_source": "cde",
    }
    row["data_completeness_score"] = compute_completeness_score(row)
    return row


def charter_to_program(record: CDEPublicSchoolRecord) -> dict[str, Any]:
    address = _format_address(record)
    row: dict[str, Any] = {
        "name": record.school_name.strip(),
        "slug": make_program_slug(record.school_name.strip()),
        "address": address,
        "phone": _clean_no_data(record.phone),
        "website": _format_website(record.website),
        "primary_type": "charter-elementary",
        "grade_levels": record.grade_levels,
        "license_number": record.cds_code.strip(),
        "license_status": record.status,
        "data_source": "cde",
    }

    if record.latitude and record.longitude:
        try:
            lat = float(record.latitude)
            lng = float(record.longitude)
            row["coordinates"] = f"SRID=4326;POINT({lng} {lat})"
        except ValueError:
            pass

    row["data_completeness_score"] = compute_completeness_score(row)
    return row


def transform_cde_records(
    private_records: list[CDEPrivateSchoolRecord],
    charter_records: list[CDEPublicSchoolRecord],
) -> list[dict[str, Any]]:
    rows = [private_to_program(record) for record in private_records]
    rows.extend(charter_to_program(record) for record in charter_records)

    slug_counts: dict[str, int] = {}
    for row in rows:
        slug = row["slug"]
        slug_counts[slug] = slug_counts.get(slug, 0) + 1

    for row in rows:
        if slug_counts[row["slug"]] > 1:
            row["slug"] = f"{row['slug']}-{str(row['license_number'])[-4:]}"

    return rows
