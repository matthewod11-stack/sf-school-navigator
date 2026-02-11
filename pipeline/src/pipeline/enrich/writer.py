"""Write enrichment data to Supabase tables.

Upserts into: program_schedules, program_costs, program_languages,
program_deadlines, field_provenance. Updates programs table for
completeness score and last_verified_at.
"""

from __future__ import annotations

from typing import Any

from rich.console import Console

from pipeline.config import get_supabase
from pipeline.db import insert_rows, upsert_rows
from pipeline.enrich.extract_fields import EnrichmentData
from pipeline.transform.completeness import compute_completeness_score

console = Console()


def _clear_existing_enrichment(program_ids: list[str]) -> None:
    """Delete existing enrichment rows for programs about to be re-enriched.

    This prevents duplicate records on re-runs.
    """
    client = get_supabase()
    for table in ["program_schedules", "program_costs", "program_languages", "program_deadlines"]:
        for pid in program_ids:
            client.table(table).delete().eq("program_id", pid).execute()


def write_enrichment(
    results: list[EnrichmentData],
    *,
    dry_run: bool = False,
) -> dict[str, int]:
    """Write all enrichment data to the database.

    Returns dict with counts per table.
    """
    counts: dict[str, int] = {
        "schedules": 0,
        "costs": 0,
        "languages": 0,
        "deadlines": 0,
        "provenance": 0,
        "programs_updated": 0,
    }

    if not results:
        return counts

    # Gather all data
    all_schedules: list[dict[str, Any]] = []
    all_costs: list[dict[str, Any]] = []
    all_languages: list[dict[str, str]] = []
    all_deadlines: list[dict[str, Any]] = []
    all_provenance: list[dict[str, Any]] = []
    program_ids: list[str] = []

    for enrichment in results:
        if not enrichment.has_data:
            continue
        program_ids.append(enrichment.program_id)
        all_schedules.extend(enrichment.schedules)
        all_costs.extend(enrichment.costs)
        all_languages.extend(enrichment.languages)
        all_deadlines.extend(enrichment.deadlines)

        for field_name, raw_snippet in enrichment.provenance.items():
            all_provenance.append({
                "program_id": enrichment.program_id,
                "field_name": field_name,
                "value_text": raw_snippet[:500],
                "source": "website-scrape",
                "raw_snippet": raw_snippet[:1000],
            })

    if dry_run:
        console.print(f"[yellow]DRY RUN: would write {len(all_schedules)} schedules[/yellow]")
        console.print(f"[yellow]DRY RUN: would write {len(all_costs)} costs[/yellow]")
        console.print(f"[yellow]DRY RUN: would write {len(all_languages)} languages[/yellow]")
        console.print(f"[yellow]DRY RUN: would write {len(all_deadlines)} deadlines[/yellow]")
        console.print(f"[yellow]DRY RUN: would write {len(all_provenance)} provenance records[/yellow]")
        counts["schedules"] = len(all_schedules)
        counts["costs"] = len(all_costs)
        counts["languages"] = len(all_languages)
        counts["deadlines"] = len(all_deadlines)
        counts["provenance"] = len(all_provenance)
        return counts

    # Clear existing enrichment to avoid duplicates on re-run
    console.print(f"[blue]Clearing existing enrichment for {len(program_ids)} programs...[/blue]")
    _clear_existing_enrichment(program_ids)

    # Write schedules
    if all_schedules:
        counts["schedules"] = insert_rows("program_schedules", all_schedules)
        console.print(f"[green]  Wrote {counts['schedules']} schedules[/green]")

    # Write costs
    if all_costs:
        counts["costs"] = insert_rows("program_costs", all_costs)
        console.print(f"[green]  Wrote {counts['costs']} costs[/green]")

    # Write languages
    if all_languages:
        counts["languages"] = insert_rows("program_languages", all_languages)
        console.print(f"[green]  Wrote {counts['languages']} languages[/green]")

    # Write deadlines
    if all_deadlines:
        counts["deadlines"] = insert_rows("program_deadlines", all_deadlines)
        console.print(f"[green]  Wrote {counts['deadlines']} deadlines[/green]")

    # Write provenance
    if all_provenance:
        counts["provenance"] = insert_rows("field_provenance", all_provenance)
        console.print(f"[green]  Wrote {counts['provenance']} provenance records[/green]")

    # Update programs: completeness score and last_verified_at
    _update_program_scores(results)
    counts["programs_updated"] = len(program_ids)

    return counts


def _update_program_scores(results: list[EnrichmentData]) -> None:
    """Update completeness scores for enriched programs."""
    client = get_supabase()

    for enrichment in results:
        if not enrichment.has_data:
            continue

        # Fetch current program row to recompute score
        current = (
            client.table("programs")
            .select("*")
            .eq("id", enrichment.program_id)
            .single()
            .execute()
            .data
        )

        # Merge enrichment updates
        updates: dict[str, Any] = {}
        updates.update(enrichment.program_updates)

        # The existing completeness function only checks the programs table fields.
        # If we have schedules/costs/languages, that means additional data exists,
        # so we boost the score accordingly.
        base_score = compute_completeness_score(current)
        bonus = 0
        if enrichment.schedules:
            bonus += 5
        if enrichment.costs:
            bonus += 5
        if enrichment.languages:
            bonus += 5
        if enrichment.deadlines:
            bonus += 5

        new_score = min(base_score + bonus, 100)
        updates["data_completeness_score"] = new_score

        client.table("programs").update(updates).eq("id", enrichment.program_id).execute()
