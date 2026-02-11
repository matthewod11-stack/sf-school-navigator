"""CLI for the SF School Navigator data pipeline."""

from __future__ import annotations

import click
from rich.console import Console
from rich.table import Table

console = Console()


@click.group()
def cli() -> None:
    """SF School Navigator — Data Pipeline."""
    pass


@cli.command("ccl-import")
@click.option("--dry-run", is_flag=True, help="Preview changes without writing to database")
@click.option("--limit", type=int, default=None, help="Limit number of records to process")
def ccl_import(dry_run: bool, limit: int | None) -> None:
    """Import CCL (Community Care Licensing) data for San Francisco."""
    from pipeline.extract.ccl import extract_ccl
    from pipeline.load.programs import load_programs
    from pipeline.load.provenance import write_provenance
    from pipeline.transform.normalize import transform_ccl_records

    console.rule("[bold blue]CCL Data Import[/bold blue]")

    # Extract
    console.print("\n[bold]Step 1: Extract[/bold]")
    records = extract_ccl(limit=limit)
    console.print(f"Extracted {len(records)} CCL records\n")

    # Transform
    console.print("[bold]Step 2: Transform[/bold]")
    program_rows = transform_ccl_records(records)
    console.print(f"Transformed into {len(program_rows)} program rows\n")

    # Preview
    if program_rows:
        table = Table(title="Sample Records (first 5)")
        table.add_column("License #")
        table.add_column("Name")
        table.add_column("Type")
        table.add_column("Address")
        table.add_column("Score")
        for row in program_rows[:5]:
            table.add_row(
                row.get("license_number", ""),
                row.get("name", "")[:40],
                row.get("primary_type", ""),
                (row.get("address", "") or "")[:40],
                str(row.get("data_completeness_score", "")),
            )
        console.print(table)
        console.print()

    # Load
    console.print("[bold]Step 3: Load[/bold]")
    loaded = load_programs(program_rows, dry_run=dry_run)

    # Provenance
    console.print("\n[bold]Step 4: Provenance[/bold]")
    prov = write_provenance(program_rows, source="ccl", dry_run=dry_run)

    # Summary
    console.rule("[bold green]Complete[/bold green]")
    console.print(f"Records extracted: {len(records)}")
    console.print(f"Programs loaded:   {loaded}")
    console.print(f"Provenance records: {prov}")
    if dry_run:
        console.print("[yellow]DRY RUN — no data was written[/yellow]")


@cli.command("attendance-areas")
@click.option("--dry-run", is_flag=True, help="Preview changes without writing to database")
@click.option("--school-year", default="2024-25", help="School year label (default: 2024-25)")
def attendance_areas_import(dry_run: bool, school_year: str) -> None:
    """Import SFUSD attendance area polygons from DataSF."""
    from pipeline.extract.attendance_areas import extract_attendance_areas
    from pipeline.load.attendance_areas import load_attendance_areas

    console.rule("[bold blue]Attendance Area Import[/bold blue]")

    # Extract
    console.print("\n[bold]Step 1: Extract[/bold]")
    records = extract_attendance_areas()
    console.print(f"Extracted {len(records)} attendance areas\n")

    # Preview
    if records:
        table = Table(title="Sample Areas (first 10)")
        table.add_column("Name")
        table.add_column("School")
        table.add_column("School #")
        for r in records[:10]:
            table.add_row(r.aaname, r.e_aa_name, r.e_aa_schno)
        console.print(table)
        console.print()

    # Load
    console.print("[bold]Step 2: Load[/bold]")
    count = load_attendance_areas(records, school_year=school_year, dry_run=dry_run)

    # Summary
    console.rule("[bold green]Complete[/bold green]")
    console.print(f"Areas extracted: {len(records)}")
    console.print(f"Areas loaded:    {count}")
    if dry_run:
        console.print("[yellow]DRY RUN — no data was written[/yellow]")


@cli.command("sfusd-import")
@click.option("--dry-run", is_flag=True, help="Preview changes without writing to database")
@click.option("--limit", type=int, default=None, help="Limit number of records to process")
@click.option("--school-year", default="2026-27", help="School year label (default: 2026-27)")
def sfusd_import(dry_run: bool, limit: int | None, school_year: str) -> None:
    """Import SFUSD Pre-K and TK program data from DataSF."""
    from pipeline.extract.sfusd import extract_sfusd
    from pipeline.load.programs import load_programs
    from pipeline.load.provenance import write_provenance
    from pipeline.load.sfusd import ensure_sfusd_rules, load_sfusd_linkages
    from pipeline.transform.normalize_sfusd import transform_sfusd_records

    console.rule("[bold blue]SFUSD Data Import[/bold blue]")

    # Extract
    console.print("\n[bold]Step 1: Extract[/bold]")
    records = extract_sfusd(limit=limit)
    console.print(f"Extracted {len(records)} SFUSD schools\n")

    # Transform
    console.print("[bold]Step 2: Transform[/bold]")
    program_rows = transform_sfusd_records(records)
    console.print(f"Transformed into {len(program_rows)} program rows\n")

    # Preview
    if program_rows:
        table = Table(title="Sample Records (first 10)")
        table.add_column("CDS Code")
        table.add_column("Name")
        table.add_column("Type")
        table.add_column("Neighborhood")
        table.add_column("Score")
        for row in program_rows[:10]:
            table.add_row(
                row.get("license_number", "")[-6:],
                row.get("name", "")[:35],
                row.get("primary_type", ""),
                row.get("slug", "").split("-")[-1][:15] if "-" in row.get("slug", "") else "",
                str(row.get("data_completeness_score", "")),
            )
        console.print(table)
        console.print()

    # Load
    console.print("[bold]Step 3: Load[/bold]")
    loaded = load_programs(program_rows, dry_run=dry_run)

    # SFUSD rules + linkages
    console.print("\n[bold]Step 4: Provenance[/bold]")
    prov = write_provenance(program_rows, source="sfusd", dry_run=dry_run)

    console.print("\n[bold]Step 5: SFUSD Rules & Linkages[/bold]")
    rule_ids = ensure_sfusd_rules(school_year=school_year, dry_run=dry_run)
    linkage_count = load_sfusd_linkages(
        program_rows,
        school_year=school_year,
        dry_run=dry_run,
        rule_ids=rule_ids,
    )

    # Summary
    console.rule("[bold green]Complete[/bold green]")
    prek = sum(1 for r in program_rows if r.get("primary_type") == "sfusd-prek")
    tk = sum(1 for r in program_rows if r.get("primary_type") == "sfusd-tk")
    console.print(f"Pre-K programs: {prek}")
    console.print(f"TK programs:    {tk}")
    console.print(f"Total loaded:   {loaded}")
    console.print(f"Provenance:     {prov}")
    console.print(f"Linkages:       {linkage_count}")
    console.print(f"Rules loaded:   {len(rule_ids)}")
    if dry_run:
        console.print("[yellow]DRY RUN — no data was written[/yellow]")


@cli.command("enrich")
@click.option("--dry-run", is_flag=True, help="Preview changes without writing to database")
@click.option("--limit", type=int, default=50, help="Number of programs to enrich (default: 50)")
@click.option("--skip-scrape", is_flag=True, help="Skip web scraping, use defaults only")
def enrich(dry_run: bool, limit: int, skip_scrape: bool) -> None:
    """Enrich top programs with schedules, costs, languages, and deadlines."""
    from pipeline.enrich.run import run_enrichment

    run_enrichment(limit=limit, dry_run=dry_run, skip_scrape=skip_scrape)


@cli.group("quality")
def quality_group() -> None:
    """Data quality checks and reports."""
    pass


@quality_group.command("freshness")
@click.option("--max-age", type=int, default=90, help="Max age in days before data is stale")
def quality_freshness(max_age: int) -> None:
    """Check data freshness per source."""
    from pipeline.quality.freshness_checks import check_freshness, print_freshness_report

    console.rule("[bold blue]Freshness Check[/bold blue]")
    report = check_freshness(max_age_days=max_age)
    print_freshness_report(report)


@quality_group.command("schema")
def quality_schema() -> None:
    """Validate program data against schema rules."""
    from pipeline.quality.schema_checks import check_schema, print_schema_report

    console.rule("[bold blue]Schema Validation[/bold blue]")
    issues = check_schema()
    print_schema_report(issues)


@quality_group.command("snapshot")
@click.option("--label", default=None, help="Label for the snapshot")
def quality_snapshot(label: str | None) -> None:
    """Take a snapshot of current programs data."""
    from pipeline.quality.diff_report import take_snapshot

    console.rule("[bold blue]Data Snapshot[/bold blue]")
    take_snapshot(label=label)


@quality_group.command("diff")
@click.argument("before_path")
@click.argument("after_path")
def quality_diff(before_path: str, after_path: str) -> None:
    """Compare two data snapshots."""
    from pipeline.quality.diff_report import diff_snapshots, print_diff_report

    console.rule("[bold blue]Diff Report[/bold blue]")
    diff = diff_snapshots(before_path, after_path)
    print_diff_report(diff)


if __name__ == "__main__":
    cli()
