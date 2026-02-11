"""Load attendance area polygons into Supabase."""

from __future__ import annotations

from typing import Any

from rich.console import Console

from pipeline.config import get_supabase
from pipeline.db import insert_rows
from pipeline.extract.attendance_areas import (
    AttendanceAreaRecord,
    area_to_db_row,
)

console = Console()


def load_attendance_areas(
    records: list[AttendanceAreaRecord],
    *,
    school_year: str = "2024-25",
    dry_run: bool = False,
) -> int:
    """Replace attendance areas for a given school year.

    Deletes existing areas for the school_year, then inserts new ones.
    Returns count of inserted rows.
    """
    rows: list[dict[str, Any]] = [
        area_to_db_row(r, school_year=school_year) for r in records
    ]

    if dry_run:
        console.print(f"[yellow]DRY RUN: would load {len(rows)} attendance areas[/yellow]")
        for r in rows[:5]:
            console.print(f"  {r['name']} (school_year={r['school_year']})")
        return 0

    # Delete existing areas for this school year, then insert fresh
    client = get_supabase()
    client.table("attendance_areas").delete().eq("school_year", school_year).execute()
    console.print(f"[blue]Cleared existing areas for {school_year}[/blue]")

    count = insert_rows("attendance_areas", rows, batch_size=20)
    console.print(f"[green]Inserted {count} attendance areas[/green]")
    return count
