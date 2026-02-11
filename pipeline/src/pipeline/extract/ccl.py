"""Extract CCL (Community Care Licensing) data for San Francisco."""

from __future__ import annotations

import csv
import io
from typing import Any

import httpx
from pydantic import BaseModel, Field, field_validator
from rich.console import Console

from pipeline.config import CCL_CSV_URL

console = Console()


class CCLRecord(BaseModel):
    """Validated CCL facility record."""

    facility_number: str = Field(alias="facility_number")
    facility_name: str = Field(alias="facility_name")
    facility_type: str = Field(alias="facility_type")
    facility_address: str = Field(alias="facility_address")
    facility_city: str = Field(alias="facility_city")
    facility_state: str = Field(alias="facility_state")
    facility_zip: str = Field(alias="facility_zip")
    facility_telephone_number: str | None = Field(default=None, alias="facility_telephone_number")
    facility_capacity: int | None = Field(default=None, alias="facility_capacity")
    facility_status: str = Field(alias="facility_status")
    county_name: str = Field(alias="county_name")

    model_config = {"populate_by_name": True}

    @field_validator("facility_capacity", mode="before")
    @classmethod
    def parse_capacity(cls, v: Any) -> int | None:
        if v is None or v == "":
            return None
        try:
            return int(v)
        except (ValueError, TypeError):
            return None


def download_ccl_csv(url: str = CCL_CSV_URL) -> str:
    """Download the CCL CSV file and return raw text content."""
    console.print(f"[blue]Downloading CCL data from CHHS...[/blue]")
    with httpx.Client(timeout=120, follow_redirects=True) as client:
        resp = client.get(url)
        resp.raise_for_status()
    console.print(f"[green]Downloaded {len(resp.text):,} bytes[/green]")
    return resp.text


def parse_ccl_csv(raw_csv: str) -> list[dict[str, str]]:
    """Parse raw CSV text into list of row dicts."""
    reader = csv.DictReader(io.StringIO(raw_csv))
    return list(reader)


def filter_sf_licensed(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    """Filter to San Francisco county, LICENSED status only."""
    filtered = [
        row
        for row in rows
        if row.get("county_name", "").strip().upper() == "SAN FRANCISCO"
        and row.get("facility_status", "").strip().upper() == "LICENSED"
    ]
    console.print(f"[green]Filtered to {len(filtered)} SF licensed facilities[/green]")
    return filtered


def validate_records(rows: list[dict[str, str]]) -> list[CCLRecord]:
    """Validate rows with Pydantic, skip invalid ones."""
    valid: list[CCLRecord] = []
    errors = 0
    for row in rows:
        try:
            record = CCLRecord.model_validate(row)
            valid.append(record)
        except Exception as e:
            errors += 1
            if errors <= 5:
                console.print(f"[yellow]Skipping invalid record: {e}[/yellow]")
    if errors > 5:
        console.print(f"[yellow]... and {errors - 5} more validation errors[/yellow]")
    console.print(f"[green]Validated {len(valid)} records ({errors} skipped)[/green]")
    return valid


def extract_ccl(*, limit: int | None = None) -> list[CCLRecord]:
    """Full extraction pipeline: download, filter, validate.

    Args:
        limit: If set, only return the first N records (for testing).
    """
    raw = download_ccl_csv()
    rows = parse_ccl_csv(raw)
    console.print(f"[blue]Total rows in CSV: {len(rows)}[/blue]")
    sf_rows = filter_sf_licensed(rows)
    records = validate_records(sf_rows)
    if limit:
        records = records[:limit]
        console.print(f"[blue]Limited to {limit} records[/blue]")
    return records
