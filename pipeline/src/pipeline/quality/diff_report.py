"""Diff report — compare data snapshots for change tracking."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

from rich.console import Console
from rich.table import Table

from pipeline.config import get_supabase

console = Console()

_SNAPSHOTS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "data",
    "snapshots",
)


def take_snapshot(label: str | None = None) -> str:
    """Take a snapshot of current programs data. Returns snapshot file path."""
    client = get_supabase()
    result = client.table("programs").select("*").execute()
    programs = result.data

    os.makedirs(_SNAPSHOTS_DIR, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"programs_{label}_{timestamp}.json" if label else f"programs_{timestamp}.json"
    filepath = os.path.join(_SNAPSHOTS_DIR, filename)

    with open(filepath, "w") as f:
        json.dump(programs, f, indent=2, default=str)

    console.print(f"[green]Snapshot saved: {filepath} ({len(programs)} programs)[/green]")
    return filepath


def load_snapshot(filepath: str) -> list[dict[str, Any]]:
    """Load a snapshot from disk."""
    with open(filepath) as f:
        return json.load(f)


def diff_snapshots(before_path: str, after_path: str) -> dict[str, Any]:
    """Compare two snapshots and return a diff report.

    Returns dict with 'added', 'removed', 'modified' lists.
    """
    before = load_snapshot(before_path)
    after = load_snapshot(after_path)

    before_by_license = {p["license_number"]: p for p in before if p.get("license_number")}
    after_by_license = {p["license_number"]: p for p in after if p.get("license_number")}

    before_keys = set(before_by_license.keys())
    after_keys = set(after_by_license.keys())

    added = [after_by_license[k] for k in after_keys - before_keys]
    removed = [before_by_license[k] for k in before_keys - after_keys]

    # Check for field-level changes
    modified: list[dict[str, Any]] = []
    compare_fields = ["name", "address", "phone", "primary_type", "data_completeness_score"]
    for key in before_keys & after_keys:
        b = before_by_license[key]
        a = after_by_license[key]
        changes = {}
        for field in compare_fields:
            if b.get(field) != a.get(field):
                changes[field] = {"before": b.get(field), "after": a.get(field)}
        if changes:
            modified.append({
                "license_number": key,
                "name": a.get("name"),
                "changes": changes,
            })

    return {
        "before_count": len(before),
        "after_count": len(after),
        "added": added,
        "removed": removed,
        "modified": modified,
    }


def print_diff_report(diff: dict[str, Any]) -> None:
    """Print a formatted diff report."""
    console.print(f"\n[bold]Diff Report[/bold]")
    console.print(f"  Before: {diff['before_count']} programs")
    console.print(f"  After:  {diff['after_count']} programs")
    console.print(f"  Added:    {len(diff['added'])}")
    console.print(f"  Removed:  {len(diff['removed'])}")
    console.print(f"  Modified: {len(diff['modified'])}")

    if diff["added"]:
        table = Table(title="Added Programs")
        table.add_column("License #")
        table.add_column("Name")
        for p in diff["added"][:10]:
            table.add_row(p.get("license_number", ""), p.get("name", "")[:40])
        console.print(table)

    if diff["removed"]:
        table = Table(title="Removed Programs")
        table.add_column("License #")
        table.add_column("Name")
        for p in diff["removed"][:10]:
            table.add_row(p.get("license_number", ""), p.get("name", "")[:40])
        console.print(table)

    if diff["modified"]:
        table = Table(title="Modified Programs (first 10)")
        table.add_column("Name")
        table.add_column("Changed Fields")
        for m in diff["modified"][:10]:
            fields = ", ".join(m["changes"].keys())
            table.add_row(m.get("name", "")[:30], fields)
        console.print(table)
