"""Schema validation — check programs for missing or invalid data."""

from __future__ import annotations

from typing import Any

from rich.console import Console
from rich.table import Table

from pipeline.config import get_supabase

console = Console()

# Required fields and their validation rules
_REQUIRED_FIELDS = ["name", "slug", "primary_type", "data_source"]

_RECOMMENDED_FIELDS = [
    "address",
    "phone",
    "license_number",
]

_VALID_TYPES = {
    "center", "family-home", "sfusd-prek", "sfusd-tk",
    "sfusd-elementary", "private-elementary", "charter-elementary",
    "head-start", "montessori", "waldorf", "religious", "co-op", "other",
}

_VALID_GRADES = {"prek", "tk", "k", "1", "2", "3", "4", "5"}


def check_schema() -> list[dict[str, Any]]:
    """Validate all programs against schema rules.

    Returns a list of issues found.
    """
    client = get_supabase()
    result = client.table("programs").select("*").execute()
    programs = result.data

    if not programs:
        console.print("[yellow]No programs found in database[/yellow]")
        return []

    issues: list[dict[str, Any]] = []

    for prog in programs:
        prog_id = prog.get("id", "unknown")
        name = prog.get("name", "unnamed")

        # Check required fields
        for field in _REQUIRED_FIELDS:
            if not prog.get(field):
                issues.append({
                    "program_id": prog_id,
                    "program_name": name,
                    "severity": "error",
                    "field": field,
                    "message": f"Required field '{field}' is missing",
                })

        # Check recommended fields
        for field in _RECOMMENDED_FIELDS:
            if not prog.get(field):
                issues.append({
                    "program_id": prog_id,
                    "program_name": name,
                    "severity": "warning",
                    "field": field,
                    "message": f"Recommended field '{field}' is missing",
                })

        # Validate primary_type enum
        ptype = prog.get("primary_type")
        if ptype and ptype not in _VALID_TYPES:
            issues.append({
                "program_id": prog_id,
                "program_name": name,
                "severity": "error",
                "field": "primary_type",
                "message": f"Invalid primary_type: '{ptype}'",
            })

        grade_levels = prog.get("grade_levels") or []
        if not isinstance(grade_levels, list) or any(g not in _VALID_GRADES for g in grade_levels):
            issues.append({
                "program_id": prog_id,
                "program_name": name,
                "severity": "error",
                "field": "grade_levels",
                "message": f"Invalid grade_levels: {grade_levels}",
            })

        # Check coordinates exist if address exists
        if prog.get("address") and not prog.get("coordinates"):
            issues.append({
                "program_id": prog_id,
                "program_name": name,
                "severity": "warning",
                "field": "coordinates",
                "message": "Has address but no coordinates (not geocoded)",
            })

        # Check completeness score sanity
        score = prog.get("data_completeness_score", 0)
        if score < 0 or score > 100:
            issues.append({
                "program_id": prog_id,
                "program_name": name,
                "severity": "error",
                "field": "data_completeness_score",
                "message": f"Score out of range: {score}",
            })

    return issues


def print_schema_report(issues: list[dict[str, Any]]) -> None:
    """Print a formatted schema validation report."""
    errors = [i for i in issues if i["severity"] == "error"]
    warnings = [i for i in issues if i["severity"] == "warning"]

    console.print(f"\n[bold]Schema Validation:[/bold] {len(errors)} errors, {len(warnings)} warnings\n")

    if errors:
        table = Table(title="Errors")
        table.add_column("Program")
        table.add_column("Field")
        table.add_column("Message")
        for issue in errors[:20]:
            table.add_row(
                issue["program_name"][:30],
                issue["field"],
                issue["message"],
            )
        console.print(table)
        if len(errors) > 20:
            console.print(f"  ... and {len(errors) - 20} more errors")

    if warnings:
        # Summarize warnings by field
        from collections import Counter
        field_counts = Counter(i["field"] for i in warnings)
        table = Table(title="Warnings Summary")
        table.add_column("Field")
        table.add_column("Count", justify="right")
        for field, count in field_counts.most_common():
            table.add_row(field, str(count))
        console.print(table)
