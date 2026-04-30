"""CLI for the SF School Navigator data pipeline."""

from __future__ import annotations

import csv

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
    from pipeline.load.sfusd import (
        ensure_sfusd_rules,
        filter_sfusd_overlaps,
        load_sfusd_linkages,
    )
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

    console.print("[bold]Step 2b: Cross-source dedupe[/bold]")
    program_rows, overlap_skips = filter_sfusd_overlaps(program_rows, dry_run=dry_run)
    console.print(
        f"Retained {len(program_rows)} rows after overlap filtering "
        f"({overlap_skips} skipped)\n"
    )

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
    console.print(f"Overlap skips:  {overlap_skips}")
    if dry_run:
        console.print("[yellow]DRY RUN — no data was written[/yellow]")


@cli.command("sfusd-elementary-import")
@click.option("--dry-run", is_flag=True, help="Preview changes without writing to database")
@click.option("--limit", type=int, default=None, help="Limit number of records to process")
@click.option("--school-year", default="2026-27", help="School year label (default: 2026-27)")
def sfusd_elementary_import(dry_run: bool, limit: int | None, school_year: str) -> None:
    """Import SFUSD elementary schools from DataSF."""
    from pipeline.extract.sfusd import extract_sfusd_elementary
    from pipeline.load.programs import load_programs
    from pipeline.load.provenance import write_provenance
    from pipeline.load.sfusd import ensure_sfusd_rules, load_sfusd_linkages
    from pipeline.transform.normalize_sfusd import transform_sfusd_records

    console.rule("[bold blue]SFUSD Elementary Import[/bold blue]")

    console.print("\n[bold]Step 1: Extract[/bold]")
    records = extract_sfusd_elementary(limit=limit)
    console.print(f"Extracted {len(records)} SFUSD elementary schools\n")

    console.print("[bold]Step 2: Transform[/bold]")
    program_rows = transform_sfusd_records(records, elementary=True)
    console.print(f"Transformed into {len(program_rows)} program rows\n")

    if program_rows:
        table = Table(title="Sample Records (first 10)")
        table.add_column("CDS Code")
        table.add_column("Name")
        table.add_column("Grades")
        table.add_column("Score")
        for row in program_rows[:10]:
            table.add_row(
                row.get("license_number", "")[-6:],
                row.get("name", "")[:35],
                ", ".join(row.get("grade_levels", [])),
                str(row.get("data_completeness_score", "")),
            )
        console.print(table)
        console.print()

    console.print("[bold]Step 3: Load[/bold]")
    loaded = load_programs(program_rows, dry_run=dry_run)

    console.print("\n[bold]Step 4: Provenance[/bold]")
    prov = write_provenance(program_rows, source="sfusd", dry_run=dry_run)

    console.print("\n[bold]Step 5: SFUSD Linkages[/bold]")
    rule_ids = ensure_sfusd_rules(school_year=school_year, dry_run=dry_run)
    linkage_count = load_sfusd_linkages(
        program_rows,
        school_year=school_year,
        dry_run=dry_run,
        rule_ids=rule_ids,
    )

    console.rule("[bold green]Complete[/bold green]")
    console.print(f"Elementary schools: {len(program_rows)}")
    console.print(f"Total loaded:       {loaded}")
    console.print(f"Provenance:         {prov}")
    console.print(f"Linkages:           {linkage_count}")
    console.print(f"Rules loaded:       {len(rule_ids)}")
    if dry_run:
        console.print("[yellow]DRY RUN — no data was written[/yellow]")


@cli.command("cde-private-charter-import")
@click.option("--dry-run", is_flag=True, help="Preview changes without writing to database")
@click.option("--limit", type=int, default=None, help="Limit private and charter records separately")
def cde_private_charter_import(dry_run: bool, limit: int | None) -> None:
    """Import CDE private elementary and public charter elementary schools."""
    from pipeline.extract.cde import (
        extract_cde_charter_elementary,
        extract_cde_private_elementary,
    )
    from pipeline.load.cde import filter_cde_overlaps
    from pipeline.load.programs import load_programs
    from pipeline.load.provenance import write_provenance
    from pipeline.transform.normalize_cde import transform_cde_records

    console.rule("[bold blue]CDE Private/Charter Elementary Import[/bold blue]")

    console.print("\n[bold]Step 1: Extract[/bold]")
    private_records = extract_cde_private_elementary(limit=limit)
    charter_records = extract_cde_charter_elementary(limit=limit)
    console.print(
        f"Extracted {len(private_records)} private and {len(charter_records)} charter schools\n"
    )

    console.print("[bold]Step 2: Transform[/bold]")
    program_rows = transform_cde_records(private_records, charter_records)
    console.print(f"Transformed into {len(program_rows)} program rows\n")

    console.print("[bold]Step 2b: Cross-source dedupe[/bold]")
    program_rows, overlap_skips = filter_cde_overlaps(program_rows, dry_run=dry_run)
    console.print(
        f"Retained {len(program_rows)} rows after overlap filtering "
        f"({overlap_skips} skipped)\n"
    )

    if program_rows:
        table = Table(title="Sample Records (first 10)")
        table.add_column("CDS Code")
        table.add_column("Name")
        table.add_column("Type")
        table.add_column("Grades")
        for row in program_rows[:10]:
            table.add_row(
                str(row.get("license_number", ""))[-6:],
                row.get("name", "")[:35],
                row.get("primary_type", ""),
                ", ".join(row.get("grade_levels", [])),
            )
        console.print(table)
        console.print()

    console.print("[bold]Step 3: Load[/bold]")
    loaded = load_programs(program_rows, dry_run=dry_run)

    console.print("\n[bold]Step 4: Provenance[/bold]")
    prov = write_provenance(program_rows, source="cde", dry_run=dry_run)

    console.rule("[bold green]Complete[/bold green]")
    console.print(f"Total loaded:    {loaded}")
    console.print(f"Provenance:      {prov}")
    console.print(f"Overlap skips:   {overlap_skips}")
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


@cli.command("deadlines")
@click.option("--dry-run", is_flag=True, help="Preview changes without writing to database")
@click.option("--school-year", default="2026-27", help="School year (default: 2026-27)")
def deadlines(dry_run: bool, school_year: str) -> None:
    """Collect application deadlines for all programs."""
    from pipeline.enrich.deadlines import collect_deadlines

    collect_deadlines(school_year=school_year, dry_run=dry_run)


@cli.command("elfa-mark")
@click.argument("csv_path", type=click.Path(exists=True, dir_okay=False))
@click.option("--dry-run", is_flag=True, help="Preview ELFA matches without writing")
@click.option(
    "--source-url",
    default="https://www.sf.gov/early-learning-for-all",
    help="Official ELFA source URL for provenance",
)
def elfa_mark(csv_path: str, dry_run: bool, source_url: str) -> None:
    """Mark ELFA participation from a DEC/ELFA CSV with license numbers."""
    from pipeline.enrich.elfa import update_elfa_participation_from_rows

    with open(csv_path, newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))

    console.rule("[bold blue]ELFA Participation Marking[/bold blue]")
    updated = update_elfa_participation_from_rows(
        rows,
        source_url=source_url,
        dry_run=dry_run,
    )
    console.print(f"Rows read: {len(rows)}")
    console.print(f"Cost rows marked: {updated}")


@cli.group("validate")
def validate_group() -> None:
    """Program URL and address validators."""
    pass


@validate_group.command("urls")
@click.option("--dry-run", is_flag=True, help="Preview validation without writing to database")
@click.option("--fix", is_flag=True, help="Null confirmed broken URLs and write provenance")
@click.option("--limit", type=int, default=None, help="Limit number of URLs to validate")
@click.option("--concurrency", type=int, default=10, help="Concurrent HTTP requests")
@click.option("--timeout", type=float, default=10.0, help="Request timeout in seconds")
def validate_urls(
    dry_run: bool,
    fix: bool,
    limit: int | None,
    concurrency: int,
    timeout: float,
) -> None:
    """Validate program website URLs."""
    from pipeline.validate.urls import run_url_validation

    console.rule("[bold blue]URL Validation[/bold blue]")
    run_url_validation(
        dry_run=dry_run,
        fix=fix,
        limit=limit,
        concurrency=concurrency,
        timeout_seconds=timeout,
    )


@validate_group.command("addresses")
@click.option("--dry-run", is_flag=True, help="Preview validation without writing to database")
@click.option("--fix", is_flag=True, help="Update high-confidence coordinate corrections")
@click.option("--limit", type=int, default=None, help="Limit number of addresses to validate")
@click.option("--concurrency", type=int, default=5, help="Concurrent Mapbox requests")
@click.option("--timeout", type=float, default=15.0, help="Request timeout in seconds")
def validate_addresses(
    dry_run: bool,
    fix: bool,
    limit: int | None,
    concurrency: int,
    timeout: float,
) -> None:
    """Validate program addresses against Mapbox geocoding."""
    from pipeline.validate.addresses import run_address_validation

    console.rule("[bold blue]Address Validation[/bold blue]")
    run_address_validation(
        dry_run=dry_run,
        fix=fix,
        limit=limit,
        concurrency=concurrency,
        timeout_seconds=timeout,
    )


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


@quality_group.command("tiers")
@click.option("--dry-run", is_flag=True, help="Preview tier updates without writing to database")
@click.option("--limit", type=int, default=None, help="Limit number of programs to tier")
def quality_tiers(dry_run: bool, limit: int | None) -> None:
    """Compute and optionally persist program completeness tiers."""
    from pipeline.quality.tiering import run_quality_tiering

    console.rule("[bold blue]Data Quality Tiers[/bold blue]")
    run_quality_tiering(dry_run=dry_run, limit=limit)


@quality_group.command("check")
@click.option("--report-path", default=None, help="Output path for JSON report")
@click.option("--write", is_flag=True, help="Persist validation status and tier columns")
@click.option("--fix", is_flag=True, help="Apply safe validator fixes")
@click.option("--limit", type=int, default=None, help="Limit programs for validators")
@click.option(
    "--skip-url-validation",
    is_flag=True,
    help="Skip website URL checks",
)
@click.option(
    "--include-address-validation",
    is_flag=True,
    help="Run Mapbox address checks (uses API quota)",
)
def quality_check(
    report_path: str | None,
    write: bool,
    fix: bool,
    limit: int | None,
    skip_url_validation: bool,
    include_address_validation: bool,
) -> None:
    """Run combined quality checks and write a JSON report."""
    from pipeline.quality.report import DEFAULT_REPORT_PATH, run_combined_quality_check

    console.rule("[bold blue]Combined Quality Check[/bold blue]")
    report = run_combined_quality_check(
        report_path=report_path or DEFAULT_REPORT_PATH,
        dry_run=not write and not fix,
        fix=fix,
        limit=limit,
        include_url_validation=not skip_url_validation,
        include_address_validation=include_address_validation,
    )
    raise click.exceptions.Exit(report["exit_code"])


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
