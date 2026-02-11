"""SFUSD-specific load helpers: rules + attendance linkage generation."""

from __future__ import annotations

import re
from typing import Any

from rich.console import Console

from pipeline.config import get_supabase
from pipeline.db import insert_rows, upsert_rows

console = Console()

_DEFAULT_RULES = [
    {
        "rule_type": "attendance-area",
        "rule_text": "Students residing within a school's attendance area receive enrollment priority at that school.",
        "explanation_plain": "Living in a school's area generally improves enrollment priority for that school.",
        "confidence": "likely",
    },
    {
        "rule_type": "tiebreaker",
        "rule_text": "When schools are oversubscribed, SFUSD applies enrollment tie-breakers according to current policy.",
        "explanation_plain": "Tie-breakers apply only when demand exceeds seats.",
        "confidence": "uncertain",
    },
    {
        "rule_type": "feeder",
        "rule_text": "TK feeder relationships are determined by current SFUSD school-year policy.",
        "explanation_plain": "Feeder relationships may change by school year and should be verified with SFUSD.",
        "confidence": "uncertain",
    },
]


def _parse_point(geom: Any) -> tuple[float, float] | None:
    """Parse PostGIS point data into (lng, lat)."""
    if isinstance(geom, dict):
        coords = geom.get("coordinates")
        if isinstance(coords, list) and len(coords) >= 2:
            lng, lat = coords[0], coords[1]
            if isinstance(lng, (int, float)) and isinstance(lat, (int, float)):
                return (float(lng), float(lat))

    if isinstance(geom, str) and "POINT" in geom.upper():
        match = re.search(
            r"POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)", geom, re.IGNORECASE
        )
        if match:
            return (float(match.group(1)), float(match.group(2)))

    return None


def ensure_sfusd_rules(
    *,
    school_year: str = "2026-27",
    dry_run: bool = False,
) -> dict[str, str]:
    """Ensure baseline sfusd_rules rows exist for a school year.

    Returns a mapping of rule_type -> rule id.
    """
    client = get_supabase()
    existing = (
        client.table("sfusd_rules")
        .select("id, rule_type")
        .eq("school_year", school_year)
        .execute()
        .data
    )

    existing_map = {row["rule_type"]: row["id"] for row in (existing or [])}
    to_insert = []
    for rule in _DEFAULT_RULES:
        if rule["rule_type"] in existing_map:
            continue
        to_insert.append(
            {
                "school_year": school_year,
                "rule_type": rule["rule_type"],
                "rule_text": rule["rule_text"],
                "explanation_plain": rule["explanation_plain"],
                "source_url": "https://www.sfusd.edu/schools/enroll/student-assignment-policy",
                "confidence": rule["confidence"],
            }
        )

    if dry_run:
        if to_insert:
            console.print(
                f"[yellow]DRY RUN: would insert {len(to_insert)} sfusd_rules rows[/yellow]"
            )
        return existing_map

    if to_insert:
        insert_rows("sfusd_rules", to_insert, batch_size=20)

    final_rows = (
        client.table("sfusd_rules")
        .select("id, rule_type")
        .eq("school_year", school_year)
        .execute()
        .data
    )
    return {row["rule_type"]: row["id"] for row in (final_rows or [])}


def load_sfusd_linkages(
    rows: list[dict[str, Any]],
    *,
    school_year: str = "2026-27",
    dry_run: bool = False,
    rule_ids: dict[str, str] | None = None,
) -> int:
    """Populate program_sfusd_linkage for imported SFUSD programs."""
    client = get_supabase()

    license_numbers = [r.get("license_number") for r in rows if r.get("license_number")]
    if not license_numbers:
        return 0

    programs = (
        client.table("programs")
        .select("id, license_number, primary_type, coordinates")
        .in_("license_number", license_numbers)
        .execute()
        .data
    )
    if not programs:
        return 0

    link_rows: list[dict[str, Any]] = []
    for program in programs:
        point = _parse_point(program.get("coordinates"))
        if not point:
            continue

        lng, lat = point
        area_result = client.rpc(
            "find_attendance_area", {"point_lng": lng, "point_lat": lat}
        ).execute()
        area = area_result.data[0] if area_result.data else None
        if not area:
            continue

        rule_id: str | None = None
        if rule_ids:
            if program.get("primary_type") == "sfusd-tk":
                rule_id = rule_ids.get("feeder") or rule_ids.get("attendance-area")
            else:
                rule_id = rule_ids.get("attendance-area")

        link_rows.append(
            {
                "program_id": program["id"],
                "attendance_area_id": area["id"],
                "school_year": school_year,
                "feeder_elementary_school": None,
                "tiebreaker_eligible": program.get("primary_type") in {"sfusd-prek", "sfusd-tk"},
                "rule_version_id": rule_id,
            }
        )

    if dry_run:
        console.print(
            f"[yellow]DRY RUN: would upsert {len(link_rows)} SFUSD linkage rows[/yellow]"
        )
        return 0

    if not link_rows:
        return 0

    count = upsert_rows(
        "program_sfusd_linkage",
        link_rows,
        on_conflict="program_id,attendance_area_id,school_year",
        batch_size=50,
    )
    return count
