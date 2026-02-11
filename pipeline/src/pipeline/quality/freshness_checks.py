"""Freshness checks — verify data recency per source."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from rich.console import Console
from rich.table import Table

from pipeline.config import get_supabase

console = Console()


def check_freshness(*, max_age_days: int = 90) -> list[dict[str, Any]]:
    """Check data freshness per source.

    Returns a list of freshness report rows with source, count,
    oldest/newest timestamps, and whether they're stale.
    """
    client = get_supabase()

    # Get programs grouped by data_source with last_verified_at stats
    result = client.table("programs").select("data_source, last_verified_at, updated_at").execute()
    rows = result.data

    if not rows:
        console.print("[yellow]No programs found in database[/yellow]")
        return []

    # Group by source
    by_source: dict[str, list[dict]] = {}
    for row in rows:
        src = row.get("data_source", "unknown")
        by_source.setdefault(src, []).append(row)

    cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    report: list[dict[str, Any]] = []

    for source, programs in sorted(by_source.items()):
        timestamps = []
        for p in programs:
            ts = p.get("last_verified_at") or p.get("updated_at")
            if ts:
                if isinstance(ts, str):
                    ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                timestamps.append(ts)

        oldest = min(timestamps) if timestamps else None
        newest = max(timestamps) if timestamps else None
        stale_count = sum(1 for t in timestamps if t < cutoff) if timestamps else len(programs)

        report.append({
            "source": source,
            "total": len(programs),
            "oldest": oldest,
            "newest": newest,
            "stale_count": stale_count,
            "is_stale": stale_count > 0,
        })

    return report


def print_freshness_report(report: list[dict[str, Any]]) -> None:
    """Print a formatted freshness report table."""
    table = Table(title="Data Freshness Report")
    table.add_column("Source")
    table.add_column("Total", justify="right")
    table.add_column("Oldest")
    table.add_column("Newest")
    table.add_column("Stale", justify="right")
    table.add_column("Status")

    for row in report:
        oldest = row["oldest"].strftime("%Y-%m-%d") if row["oldest"] else "never"
        newest = row["newest"].strftime("%Y-%m-%d") if row["newest"] else "never"
        status = "[red]STALE[/red]" if row["is_stale"] else "[green]OK[/green]"
        table.add_row(
            row["source"],
            str(row["total"]),
            oldest,
            newest,
            str(row["stale_count"]),
            status,
        )

    console.print(table)
