"""Write field_provenance records for imported data."""

from __future__ import annotations

from typing import Any

from rich.console import Console

from pipeline.config import get_supabase
from pipeline.db import insert_rows

console = Console()

# CCL fields that we track provenance for
_CCL_PROVENANCE_FIELDS = [
    "name",
    "address",
    "phone",
    "primary_type",
    "license_number",
    "license_status",
]


def _get_program_id_by_license(license_number: str) -> str | None:
    """Look up program UUID by license_number."""
    client = get_supabase()
    result = (
        client.table("programs")
        .select("id")
        .eq("license_number", license_number)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]["id"]
    return None


def write_provenance(
    rows: list[dict[str, Any]],
    *,
    dry_run: bool = False,
) -> int:
    """Create field_provenance records for each CCL-sourced field.

    Each program gets one provenance record per tracked field.
    Returns total records written.
    """
    provenance_rows: list[dict[str, Any]] = []

    for row in rows:
        license_number = row.get("license_number")
        if not license_number:
            continue

        if dry_run:
            # Count what we would write
            for field in _CCL_PROVENANCE_FIELDS:
                if row.get(field) is not None:
                    provenance_rows.append({})
            continue

        program_id = _get_program_id_by_license(license_number)
        if not program_id:
            continue

        for field in _CCL_PROVENANCE_FIELDS:
            value = row.get(field)
            if value is None:
                continue
            provenance_rows.append(
                {
                    "program_id": program_id,
                    "field_name": field,
                    "value_text": str(value),
                    "source": "ccl",
                    "raw_snippet": str(value),
                }
            )

    if dry_run:
        console.print(f"[yellow]DRY RUN: would write {len(provenance_rows)} provenance records[/yellow]")
        return 0

    if not provenance_rows:
        console.print("[yellow]No provenance records to write[/yellow]")
        return 0

    count = insert_rows("field_provenance", provenance_rows)
    console.print(f"[green]Wrote {count} provenance records[/green]")
    return count
