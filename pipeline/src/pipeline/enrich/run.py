"""Orchestrate the full enrichment pipeline.

1. Select top 50 programs
2. For each program:
   - If SFUSD: apply known defaults
   - If has real website: scrape and extract
   - Otherwise: apply generic defaults
3. Write all enrichment data to DB
4. Report results
"""

from __future__ import annotations

import time

from rich.console import Console
from rich.table import Table

from pipeline.enrich.extract_fields import (
    EnrichmentData,
    enrich_from_website,
    enrich_sfusd_program,
    enrich_with_defaults,
)
from pipeline.enrich.scraper import fetch_page_text
from pipeline.enrich.select_top50 import select_top_programs
from pipeline.enrich.writer import write_enrichment

console = Console()


def _has_real_website(program: dict) -> bool:
    """Check if a program has a scrapeable website URL."""
    url = program.get("website") or ""
    if not url or "No Data" in url:
        return False
    if not url.startswith("http"):
        return False
    return True


def run_enrichment(
    *,
    limit: int = 50,
    dry_run: bool = False,
    skip_scrape: bool = False,
) -> dict[str, int]:
    """Run the full enrichment pipeline.

    Args:
        limit: Max programs to enrich.
        dry_run: Preview without writing.
        skip_scrape: Skip web scraping (use defaults only).

    Returns:
        Dict with counts of records written.
    """
    console.rule("[bold blue]Program Enrichment[/bold blue]")

    # Step 1: Select programs
    console.print("\n[bold]Step 1: Select top programs[/bold]")
    programs = select_top_programs(limit=limit)
    console.print(f"Selected {len(programs)} programs for enrichment")

    sfusd_count = sum(1 for p in programs if p["primary_type"] in ("sfusd-prek", "sfusd-tk"))
    web_count = sum(
        1 for p in programs
        if p["primary_type"] not in ("sfusd-prek", "sfusd-tk") and _has_real_website(p)
    )
    other_count = len(programs) - sfusd_count - web_count
    console.print(f"  SFUSD: {sfusd_count}, With websites: {web_count}, Other: {other_count}")

    # Step 2: Enrich each program
    console.print("\n[bold]Step 2: Enrich programs[/bold]")
    results: list[EnrichmentData] = []
    scraped = 0
    scrape_errors = 0

    for i, program in enumerate(programs, 1):
        ptype = program["primary_type"]
        name = program["name"]

        if ptype in ("sfusd-prek", "sfusd-tk"):
            # SFUSD — use known defaults
            data = enrich_sfusd_program(program)
            results.append(data)
            console.print(f"  [{i}/{len(programs)}] {name[:40]} — SFUSD defaults")

        elif _has_real_website(program) and not skip_scrape:
            # Has a real website — try to scrape
            url = program["website"]
            console.print(f"  [{i}/{len(programs)}] {name[:40]} — scraping {url[:50]}...")

            page_text = fetch_page_text(url)
            if page_text:
                data = enrich_from_website(program, page_text)
                scraped += 1
            else:
                data = enrich_with_defaults(program)
                scrape_errors += 1

            results.append(data)
            # Rate limit scraping
            time.sleep(0.5)

        else:
            # No website — use defaults
            data = enrich_with_defaults(program)
            results.append(data)
            console.print(f"  [{i}/{len(programs)}] {name[:40]} — defaults")

    console.print(f"\n  Scraped: {scraped}, Scrape errors: {scrape_errors}")

    # Step 3: Write to DB
    console.print("\n[bold]Step 3: Write enrichment data[/bold]")
    counts = write_enrichment(results, dry_run=dry_run)

    # Step 4: Summary
    console.rule("[bold green]Enrichment Complete[/bold green]")
    table = Table(title="Enrichment Summary")
    table.add_column("Table")
    table.add_column("Records", justify="right")
    table.add_row("Schedules", str(counts["schedules"]))
    table.add_row("Costs", str(counts["costs"]))
    table.add_row("Languages", str(counts["languages"]))
    table.add_row("Deadlines", str(counts["deadlines"]))
    table.add_row("Provenance", str(counts["provenance"]))
    table.add_row("Programs updated", str(counts["programs_updated"]))
    console.print(table)

    if dry_run:
        console.print("[yellow]DRY RUN — no data was written[/yellow]")

    return counts
