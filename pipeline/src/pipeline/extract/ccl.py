"""Extract CCL (Community Care Licensing) data for San Francisco."""

from __future__ import annotations

from typing import Any

import httpx
from pydantic import BaseModel, Field, field_validator
from rich.console import Console

from pipeline.config import (
    CCL_CENTER_RESOURCE_ID,
    CCL_DATASTORE_SEARCH_URL,
    CCL_FAMILY_HOME_RESOURCE_ID,
)

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


def _download_ccl_resource_rows(
    resource_id: str,
    *,
    page_size: int = 5000,
) -> list[dict[str, Any]]:
    """Download all rows for one CHHS CKAN resource via datastore_search."""
    console.print(f"[blue]Downloading CCL resource {resource_id}...[/blue]")
    rows: list[dict[str, Any]] = []
    offset = 0

    with httpx.Client(timeout=120, follow_redirects=True) as client:
        while True:
            resp = client.get(
                CCL_DATASTORE_SEARCH_URL,
                params={
                    "resource_id": resource_id,
                    "limit": page_size,
                    "offset": offset,
                },
            )
            resp.raise_for_status()
            payload = resp.json()
            if not payload.get("success"):
                raise RuntimeError(f"CHHS API returned success=false for resource {resource_id}")

            result = payload.get("result") or {}
            chunk = result.get("records") or []
            rows.extend(chunk)

            if len(chunk) < page_size:
                break
            offset += page_size

    console.print(f"[green]Downloaded {len(rows)} rows from {resource_id}[/green]")
    return rows


def download_ccl_rows() -> list[dict[str, Any]]:
    """Download CCL centers + family child care homes and dedupe by facility number."""
    center_rows = _download_ccl_resource_rows(CCL_CENTER_RESOURCE_ID)
    family_home_rows = _download_ccl_resource_rows(CCL_FAMILY_HOME_RESOURCE_ID)
    combined = center_rows + family_home_rows

    deduped: list[dict[str, Any]] = []
    seen_facility_numbers: set[str] = set()
    duplicate_count = 0

    for row in combined:
        facility_number = str(row.get("facility_number", "")).strip()
        if not facility_number:
            continue
        if facility_number in seen_facility_numbers:
            duplicate_count += 1
            continue
        seen_facility_numbers.add(facility_number)
        deduped.append(row)

    if duplicate_count:
        console.print(
            f"[yellow]Skipped {duplicate_count} duplicate facilities across CCL resources[/yellow]"
        )

    return deduped


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
    rows = download_ccl_rows()
    console.print(f"[blue]Total rows across CCL resources: {len(rows)}[/blue]")
    sf_rows = filter_sf_licensed(rows)
    records = validate_records(sf_rows)
    if limit:
        records = records[:limit]
        console.print(f"[blue]Limited to {limit} records[/blue]")
    return records
