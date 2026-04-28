"""Combined quality report generation."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

from rich.console import Console
from rich.table import Table

from pipeline.quality.freshness_checks import check_freshness
from pipeline.quality.schema_checks import check_schema
from pipeline.quality.tiering import (
    QualityTierResult,
    enrichment_candidates,
    run_quality_tiering,
    summarize_quality_tiers,
)
from pipeline.validate.addresses import (
    AddressValidationResult,
    run_address_validation,
    summarize_address_results,
)
from pipeline.validate.urls import (
    URLValidationResult,
    run_url_validation,
    summarize_url_results,
)

console = Console()

_PIPELINE_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
DEFAULT_REPORT_PATH = os.path.join(_PIPELINE_ROOT, "data", "quality-report.json")


def _serialize_freshness(report: list[dict[str, Any]]) -> list[dict[str, Any]]:
    serialized = []
    for row in report:
        serialized.append(
            {
                **row,
                "oldest": row["oldest"].isoformat() if row.get("oldest") else None,
                "newest": row["newest"].isoformat() if row.get("newest") else None,
            }
        )
    return serialized


def build_quality_report(
    *,
    schema_issues: list[dict[str, Any]],
    freshness_report: list[dict[str, Any]],
    tier_results: list[QualityTierResult],
    url_results: list[URLValidationResult],
    address_results: list[AddressValidationResult],
) -> dict[str, Any]:
    schema_errors = [issue for issue in schema_issues if issue["severity"] == "error"]
    schema_warnings = [issue for issue in schema_issues if issue["severity"] == "warning"]
    url_summary = summarize_url_results(url_results)
    address_summary = summarize_address_results(address_results)
    tier_summary = summarize_quality_tiers(tier_results)
    stale_records = sum(row["stale_count"] for row in freshness_report)
    broken_urls = url_summary["broken"]
    address_issues = sum(
        count for status, count in address_summary.items() if status != "valid"
    )

    exit_code = 0
    if schema_errors or broken_urls:
        exit_code = 2
    elif schema_warnings or stale_records or address_issues or url_summary["timeout"] or url_summary["dns_failure"]:
        exit_code = 1

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "exit_code": exit_code,
        "summary": {
            "total_programs": len(tier_results),
            "schema_errors": len(schema_errors),
            "schema_warnings": len(schema_warnings),
            "stale_records": stale_records,
            "broken_urls": broken_urls,
            "address_issues": address_issues,
        },
        "quality_tiers": tier_summary,
        "url_validation": url_summary,
        "address_validation": address_summary,
        "freshness": _serialize_freshness(freshness_report),
        "schema_issues": schema_issues,
        "enrichment_candidates": enrichment_candidates(tier_results),
        "url_issues": [
            result.to_report_dict()
            for result in url_results
            if result.status not in {"valid", "redirect"}
        ],
        "address_issues": [
            result.to_report_dict()
            for result in address_results
            if result.status != "valid"
        ],
    }


def write_quality_report(report: dict[str, Any], *, path: str = DEFAULT_REPORT_PATH) -> str:
    output_dir = os.path.dirname(path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
    with open(path, "w") as f:
        json.dump(report, f, indent=2)
    return path


def run_combined_quality_check(
    *,
    report_path: str = DEFAULT_REPORT_PATH,
    dry_run: bool = True,
    fix: bool = False,
    limit: int | None = None,
    include_url_validation: bool = True,
    include_address_validation: bool = False,
) -> dict[str, Any]:
    """Run quality checks and write a consolidated JSON report.

    Address validation is opt-in because it can consume Mapbox API quota.
    """
    schema_issues = check_schema()
    freshness_report = check_freshness()
    tier_results = run_quality_tiering(dry_run=dry_run, limit=limit)
    url_results = (
        run_url_validation(dry_run=dry_run, fix=fix, limit=limit)
        if include_url_validation
        else []
    )
    address_results = (
        run_address_validation(dry_run=dry_run, fix=fix, limit=limit)
        if include_address_validation
        else []
    )

    report = build_quality_report(
        schema_issues=schema_issues,
        freshness_report=freshness_report,
        tier_results=tier_results,
        url_results=url_results,
        address_results=address_results,
    )
    output_path = write_quality_report(report, path=report_path)
    print_quality_report_summary(report, output_path=output_path)
    return report


def print_quality_report_summary(report: dict[str, Any], *, output_path: str) -> None:
    table = Table(title="Combined Quality Check")
    table.add_column("Metric")
    table.add_column("Value", justify="right")
    for key, value in report["summary"].items():
        table.add_row(key.replace("_", " "), str(value))
    table.add_row("exit code", str(report["exit_code"]))
    console.print(table)
    console.print(f"[green]Quality report saved: {output_path}[/green]")
