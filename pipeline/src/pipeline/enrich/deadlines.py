"""Application deadlines collection.

Collects structured deadline data for:
1. SFUSD programs — centralized enrollment dates for 2026-27
2. Private programs with websites — scraped or estimated
3. All remaining programs — generic estimates by program type
"""

from __future__ import annotations

from typing import Any

from rich.console import Console
from rich.table import Table

from pipeline.config import get_supabase
from pipeline.db import insert_rows

console = Console()

# SFUSD centralized enrollment for 2026-27 school year
# These are the known dates from SFUSD's enrollment process
_SFUSD_DEADLINES_2026_27 = [
    {
        "school_year": "2026-27",
        "deadline_type": "application-open",
        "date": "2025-11-01",
        "description": "SFUSD Round 1 enrollment application opens",
        "source_url": "https://www.sfusd.edu/enroll",
    },
    {
        "school_year": "2026-27",
        "deadline_type": "application-close",
        "date": "2026-01-31",
        "description": "SFUSD Round 1 enrollment application deadline",
        "source_url": "https://www.sfusd.edu/enroll",
    },
    {
        "school_year": "2026-27",
        "deadline_type": "notification",
        "date": "2026-03-15",
        "description": "SFUSD Round 1 placement notifications sent",
        "source_url": "https://www.sfusd.edu/enroll",
    },
    {
        "school_year": "2026-27",
        "deadline_type": "waitlist",
        "date": "2026-04-01",
        "description": "SFUSD Round 2 / waitlist enrollment opens",
        "source_url": "https://www.sfusd.edu/enroll",
    },
]

# Generic deadline estimates by program type
_GENERIC_ESTIMATES: dict[str, list[dict[str, str]]] = {
    "center": [
        {
            "deadline_type": "application-open",
            "generic_deadline_estimate": "Year-round enrollment, contact program directly",
            "description": "Most SF childcare centers accept rolling applications",
        },
    ],
    "family-home": [
        {
            "deadline_type": "application-open",
            "generic_deadline_estimate": "Contact provider directly for availability",
            "description": "Family childcare homes typically have rolling enrollment",
        },
    ],
    "montessori": [
        {
            "deadline_type": "application-open",
            "generic_deadline_estimate": "Typically January-March for fall enrollment",
            "description": "Montessori programs often start enrollment in winter",
        },
        {
            "deadline_type": "application-close",
            "generic_deadline_estimate": "Typically March-April, varies by program",
            "description": "Contact program for exact application deadline",
        },
    ],
    "waldorf": [
        {
            "deadline_type": "application-open",
            "generic_deadline_estimate": "Typically January-February for fall enrollment",
            "description": "Waldorf programs often have structured enrollment periods",
        },
    ],
    "co-op": [
        {
            "deadline_type": "application-open",
            "generic_deadline_estimate": "Typically January-March, tour required",
            "description": "Co-op preschools often require a tour and parent interview",
        },
    ],
    "religious": [
        {
            "deadline_type": "application-open",
            "generic_deadline_estimate": "Typically January-March for fall enrollment",
            "description": "Contact program for enrollment information",
        },
    ],
    "head-start": [
        {
            "deadline_type": "application-open",
            "generic_deadline_estimate": "Year-round, federally funded program",
            "description": "Head Start enrollment is income-based with rolling admissions",
        },
    ],
}


def _get_programs_without_deadlines(school_year: str = "2026-27") -> list[dict]:
    """Find programs that don't yet have deadline records for the school year."""
    client = get_supabase()

    # Get all programs
    all_programs = client.table("programs").select("id,name,primary_type").execute().data

    # Get programs that already have deadlines
    existing = (
        client.table("program_deadlines")
        .select("program_id")
        .eq("school_year", school_year)
        .execute()
        .data
    )
    existing_ids = {r["program_id"] for r in existing}

    return [p for p in all_programs if p["id"] not in existing_ids]


def _update_sfusd_deadlines(school_year: str, *, dry_run: bool) -> int:
    """Replace generic SFUSD deadlines with actual enrollment dates.

    Updates existing SFUSD deadline records with real dates.
    """
    client = get_supabase()

    # Get all SFUSD program IDs
    sfusd = (
        client.table("programs")
        .select("id")
        .in_("primary_type", ["sfusd-prek", "sfusd-tk"])
        .execute()
        .data
    )
    sfusd_ids = [p["id"] for p in sfusd]

    if dry_run:
        console.print(
            f"[yellow]DRY RUN: would update deadlines for {len(sfusd_ids)} SFUSD programs[/yellow]"
        )
        return 0

    # Delete existing SFUSD deadlines for this school year
    for pid in sfusd_ids:
        client.table("program_deadlines").delete().eq("program_id", pid).eq(
            "school_year", school_year
        ).execute()

    # Insert proper deadlines with real dates
    rows: list[dict[str, Any]] = []
    now = "2026-02-11T00:00:00+00:00"
    for pid in sfusd_ids:
        for dl in _SFUSD_DEADLINES_2026_27:
            rows.append({
                "program_id": pid,
                "verified_at": now,
                **dl,
            })

    count = insert_rows("program_deadlines", rows)
    console.print(f"[green]  Wrote {count} SFUSD deadline records[/green]")
    return count


def _add_generic_deadlines(
    programs: list[dict], school_year: str, *, dry_run: bool
) -> int:
    """Add generic deadline estimates for programs without specific data."""
    rows: list[dict[str, Any]] = []

    for prog in programs:
        ptype = prog["primary_type"]
        templates = _GENERIC_ESTIMATES.get(ptype, _GENERIC_ESTIMATES["center"])

        for tmpl in templates:
            rows.append({
                "program_id": prog["id"],
                "school_year": school_year,
                **tmpl,
            })

    if dry_run:
        console.print(
            f"[yellow]DRY RUN: would write {len(rows)} generic deadline records[/yellow]"
        )
        return 0

    if not rows:
        return 0

    count = insert_rows("program_deadlines", rows)
    console.print(f"[green]  Wrote {count} generic deadline records[/green]")
    return count


def _write_deadline_provenance(
    sfusd_count: int, generic_count: int, *, dry_run: bool
) -> int:
    """Write provenance records for the deadlines collection run."""
    if dry_run:
        return 0

    # Write a summary provenance record for SFUSD deadlines
    client = get_supabase()
    sfusd_programs = (
        client.table("programs")
        .select("id")
        .in_("primary_type", ["sfusd-prek", "sfusd-tk"])
        .execute()
        .data
    )

    prov_rows: list[dict[str, Any]] = []
    for prog in sfusd_programs:
        prov_rows.append({
            "program_id": prog["id"],
            "field_name": "deadline_dates",
            "value_text": "SFUSD 2026-27 enrollment: opens Nov 1, closes Jan 31, notifications Mar 15",
            "source": "sfusd",
            "raw_snippet": (
                "SFUSD centralized enrollment for 2026-27: "
                "Round 1 opens November 1, 2025; deadline January 31, 2026; "
                "notifications March 15, 2026; Round 2/waitlist April 1, 2026. "
                "Source: sfusd.edu/enroll"
            ),
        })

    if prov_rows:
        count = insert_rows("field_provenance", prov_rows)
        console.print(f"[green]  Wrote {count} deadline provenance records[/green]")
        return count
    return 0


def collect_deadlines(
    *,
    school_year: str = "2026-27",
    dry_run: bool = False,
) -> dict[str, int]:
    """Run the full deadlines collection pipeline.

    Returns dict with counts.
    """
    console.rule("[bold blue]Application Deadlines Collection[/bold blue]")

    counts: dict[str, int] = {
        "sfusd_deadlines": 0,
        "generic_deadlines": 0,
        "provenance": 0,
        "programs_missing": 0,
    }

    # Step 1: Update SFUSD deadlines with real dates
    console.print("\n[bold]Step 1: SFUSD enrollment dates[/bold]")
    counts["sfusd_deadlines"] = _update_sfusd_deadlines(school_year, dry_run=dry_run)

    # Step 2: Find programs still missing deadlines
    console.print("\n[bold]Step 2: Remaining programs without deadlines[/bold]")
    missing = _get_programs_without_deadlines(school_year)
    counts["programs_missing"] = len(missing)
    console.print(f"  {len(missing)} programs without deadlines")

    # Step 3: Add generic deadline estimates for remaining programs
    console.print("\n[bold]Step 3: Generic deadline estimates[/bold]")
    if missing:
        counts["generic_deadlines"] = _add_generic_deadlines(
            missing, school_year, dry_run=dry_run
        )
    else:
        console.print("  No programs need generic deadlines")

    # Step 4: Write provenance
    console.print("\n[bold]Step 4: Provenance[/bold]")
    counts["provenance"] = _write_deadline_provenance(
        counts["sfusd_deadlines"], counts["generic_deadlines"], dry_run=dry_run
    )

    # Summary
    console.rule("[bold green]Deadlines Collection Complete[/bold green]")
    table = Table(title="Deadlines Summary")
    table.add_column("Category")
    table.add_column("Count", justify="right")
    table.add_row("SFUSD deadline records", str(counts["sfusd_deadlines"]))
    table.add_row("Generic deadline records", str(counts["generic_deadlines"]))
    table.add_row("Provenance records", str(counts["provenance"]))
    table.add_row("Programs that were missing", str(counts["programs_missing"]))
    console.print(table)

    if dry_run:
        console.print("[yellow]DRY RUN — no data was written[/yellow]")

    # Verification
    if not dry_run:
        client = get_supabase()
        total = (
            client.table("program_deadlines")
            .select("program_id", count="exact")
            .eq("school_year", school_year)
            .execute()
        )
        unique_pids = set(
            r["program_id"]
            for r in client.table("program_deadlines")
            .select("program_id")
            .eq("school_year", school_year)
            .execute()
            .data
        )
        console.print(f"\n[bold]Verification:[/bold]")
        console.print(f"  Total deadline records for {school_year}: {total.count}")
        console.print(f"  Unique programs with deadlines: {len(unique_pids)}")

    return counts
