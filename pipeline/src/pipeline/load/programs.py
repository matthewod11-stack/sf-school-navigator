"""Load program data into Supabase programs table."""

from __future__ import annotations

from typing import Any

from rich.console import Console

from pipeline.db import upsert_rows
from pipeline.geocode import geocode_address
from pipeline.transform.completeness import compute_completeness_score

console = Console()


def _geocode_programs(rows: list[dict[str, Any]], *, dry_run: bool = False) -> list[dict[str, Any]]:
    """Add coordinates to program rows via geocoding."""
    geocoded = 0
    skipped = 0
    for row in rows:
        address = row.get("address")
        if not address:
            skipped += 1
            continue

        if dry_run:
            skipped += 1
            continue

        result = geocode_address(address)
        if result:
            lng, lat = result
            row["coordinates"] = f"SRID=4326;POINT({lng} {lat})"
            geocoded += 1
        else:
            skipped += 1

    # Recompute completeness after coordinates may have been added/updated.
    for row in rows:
        row["data_completeness_score"] = compute_completeness_score(row)

    console.print(f"[green]Geocoded {geocoded} addresses ({skipped} skipped)[/green]")
    return rows


def load_programs(
    rows: list[dict[str, Any]],
    *,
    dry_run: bool = False,
) -> int:
    """Geocode and upsert programs into Supabase.

    Uses license_number as the ON CONFLICT key.
    Returns count of upserted rows.
    """
    rows = _geocode_programs(rows, dry_run=dry_run)

    if dry_run:
        console.print(f"[yellow]DRY RUN: would upsert {len(rows)} programs[/yellow]")
        return 0

    count = upsert_rows("programs", rows, on_conflict="license_number")
    console.print(f"[green]Upserted {count} programs[/green]")
    return count
