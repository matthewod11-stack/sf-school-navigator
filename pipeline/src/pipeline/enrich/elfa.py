"""ELFA participation helpers.

The DEC/ELFA source of truth can change by fiscal year. These helpers only mark
positive license-number matches and intentionally leave non-matches unset.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from rich.console import Console

from pipeline.config import get_supabase

console = Console()

DEFAULT_ELFA_SOURCE_URL = "https://www.sf.gov/early-learning-for-all"


def normalize_license_number(value: Any) -> str | None:
    """Return a digits-only license number, or None when no usable value exists."""
    if value is None:
        return None
    normalized = "".join(ch for ch in str(value) if ch.isdigit())
    return normalized or None


def elfa_license_set(rows: list[dict[str, Any]]) -> set[str]:
    """Extract license numbers from DEC/ELFA rows.

    Accepts common column names so CSV/source adapters can stay thin.
    """
    licenses: set[str] = set()
    for row in rows:
        for key in ("license_number", "facility_number", "license", "facility_id"):
            license_number = normalize_license_number(row.get(key))
            if license_number:
                licenses.add(license_number)
                break
    return licenses


def mark_elfa_cost_rows(
    program_rows: list[dict[str, Any]],
    cost_rows: list[dict[str, Any]],
    elfa_rows: list[dict[str, Any]],
    *,
    source_url: str = DEFAULT_ELFA_SOURCE_URL,
    verified_at: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    """Mark cost rows where program license numbers appear in ELFA source rows."""
    licenses = elfa_license_set(elfa_rows)
    if not licenses:
        return cost_rows, 0

    matched_program_ids = {
        row.get("id")
        for row in program_rows
        if normalize_license_number(row.get("license_number")) in licenses
    }
    verified = verified_at or datetime.now(UTC).isoformat()
    marked = 0
    next_rows: list[dict[str, Any]] = []

    for row in cost_rows:
        next_row = dict(row)
        if next_row.get("program_id") in matched_program_ids:
            next_row["elfa_participating"] = True
            next_row["elfa_source_url"] = source_url
            next_row["elfa_verified_at"] = verified
            marked += 1
        next_rows.append(next_row)

    return next_rows, marked


def update_elfa_participation_from_rows(
    elfa_rows: list[dict[str, Any]],
    *,
    source_url: str = DEFAULT_ELFA_SOURCE_URL,
    dry_run: bool = False,
) -> int:
    """Update existing program_costs rows for confirmed ELFA license matches."""
    licenses = elfa_license_set(elfa_rows)
    if not licenses:
        console.print("[yellow]No ELFA license numbers found[/yellow]")
        return 0

    client = get_supabase()
    programs = (
        client.table("programs")
        .select("id,license_number")
        .execute()
        .data
    ) or []
    matched_program_ids = [
        row["id"]
        for row in programs
        if normalize_license_number(row.get("license_number")) in licenses
    ]
    if not matched_program_ids:
        console.print("[yellow]No program license numbers matched ELFA rows[/yellow]")
        return 0

    cost_rows = (
        client.table("program_costs")
        .select("id,program_id")
        .in_("program_id", matched_program_ids)
        .execute()
        .data
    ) or []
    cost_program_ids = sorted({row["program_id"] for row in cost_rows})

    if dry_run:
        console.print(
            "[yellow]DRY RUN: would mark "
            f"{len(cost_rows)} cost rows across {len(cost_program_ids)} programs "
            "as ELFA participants[/yellow]"
        )
        return len(cost_rows)

    if not cost_program_ids:
        console.print("[yellow]No program_costs rows exist for matched ELFA programs[/yellow]")
        return 0

    verified_at = datetime.now(UTC).isoformat()
    client.table("program_costs").update(
        {
            "elfa_participating": True,
            "elfa_source_url": source_url,
            "elfa_verified_at": verified_at,
        }
    ).in_("program_id", cost_program_ids).execute()
    updated = len(cost_rows)

    console.print(
        f"[green]Marked {updated} cost rows across {len(cost_program_ids)} programs as ELFA participants[/green]"
    )
    return updated
