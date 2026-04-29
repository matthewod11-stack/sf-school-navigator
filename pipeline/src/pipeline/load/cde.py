"""CDE-specific load helpers."""

from __future__ import annotations

import re
from typing import Any

from rich.console import Console

from pipeline.config import get_supabase

console = Console()


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def filter_cde_overlaps(
    rows: list[dict[str, Any]],
    *,
    dry_run: bool = False,
) -> tuple[list[dict[str, Any]], int]:
    """Drop CDE rows that are exact name/address matches for existing CCL rows."""
    client = get_supabase()
    ccl_rows = (
        client.table("programs")
        .select("id, name, address")
        .eq("data_source", "ccl")
        .execute()
        .data
    ) or []

    ccl_names = {_normalize_text(row.get("name")) for row in ccl_rows}
    ccl_addresses = {_normalize_text(row.get("address")) for row in ccl_rows if row.get("address")}

    filtered: list[dict[str, Any]] = []
    skipped = 0
    for row in rows:
        name_match = _normalize_text(row.get("name")) in ccl_names
        address = _normalize_text(row.get("address"))
        address_match = bool(address and address in ccl_addresses)
        if name_match or address_match:
            skipped += 1
            mode_prefix = "DRY RUN: would skip" if dry_run else "Skipping"
            console.print(f"[yellow]{mode_prefix} overlapping CDE row '{row.get('name')}'[/yellow]")
            continue
        filtered.append(row)

    return filtered, skipped
