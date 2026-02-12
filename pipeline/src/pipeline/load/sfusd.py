"""SFUSD-specific load helpers: rules + attendance linkage generation."""

from __future__ import annotations

import math
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


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Compute great-circle distance in kilometers."""
    lng1, lat1 = a
    lng2, lat2 = b
    to_rad = math.radians
    d_lat = to_rad(lat2 - lat1)
    d_lng = to_rad(lng2 - lng1)
    lat1_r = to_rad(lat1)
    lat2_r = to_rad(lat2)

    h = (
        math.sin(d_lat / 2) ** 2
        + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(d_lng / 2) ** 2
    )
    return 2 * 6371 * math.asin(math.sqrt(h))


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


def _format_feeder_name(area_name: Any) -> str | None:
    if not isinstance(area_name, str):
        return None
    stripped = area_name.strip()
    if not stripped:
        return None
    return stripped.title() if stripped.isupper() else stripped


def filter_sfusd_overlaps(
    rows: list[dict[str, Any]],
    *,
    dry_run: bool = False,
    max_distance_km: float = 0.12,
) -> tuple[list[dict[str, Any]], int]:
    """Drop SFUSD rows that strongly overlap existing CCL records.

    Overlap criteria are intentionally conservative:
    1) coordinates within `max_distance_km`
    2) and normalized name OR normalized address exact match
    """
    client = get_supabase()
    ccl_rows = (
        client.table("programs")
        .select("id, name, address, coordinates")
        .eq("data_source", "ccl")
        .execute()
        .data
    ) or []

    ccl_candidates: list[dict[str, Any]] = []
    for ccl in ccl_rows:
        point = _parse_point(ccl.get("coordinates"))
        if not point:
            continue
        ccl_candidates.append(
            {
                "id": ccl.get("id"),
                "name": ccl.get("name"),
                "address": ccl.get("address"),
                "name_norm": _normalize_text(ccl.get("name")),
                "address_norm": _normalize_text(ccl.get("address")),
                "point": point,
            }
        )

    filtered: list[dict[str, Any]] = []
    skipped = 0

    for row in rows:
        point = _parse_point(row.get("coordinates"))
        if not point:
            filtered.append(row)
            continue

        row_name_norm = _normalize_text(row.get("name"))
        row_address_norm = _normalize_text(row.get("address"))
        match = None

        for ccl in ccl_candidates:
            distance_km = _haversine_km(point, ccl["point"])
            if distance_km > max_distance_km:
                continue

            same_name = bool(row_name_norm and row_name_norm == ccl["name_norm"])
            same_address = bool(
                row_address_norm
                and ccl["address_norm"]
                and row_address_norm == ccl["address_norm"]
            )
            if same_name or same_address:
                match = ccl
                break

        if not match:
            filtered.append(row)
            continue

        skipped += 1
        mode_prefix = "DRY RUN: would skip" if dry_run else "Skipping"
        console.print(
            "[yellow]"
            f"{mode_prefix} overlapping SFUSD row '{row.get('name')}' "
            f"(CDS {row.get('license_number')}) due to CCL match '{match.get('name')}'"
            "[/yellow]"
        )

    return filtered, skipped


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

        feeder_name = None
        if program.get("primary_type") == "sfusd-tk":
            feeder_name = _format_feeder_name(area.get("name"))

        link_rows.append(
            {
                "program_id": program["id"],
                "attendance_area_id": area["id"],
                "school_year": school_year,
                "feeder_elementary_school": feeder_name,
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
