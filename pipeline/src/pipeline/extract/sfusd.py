"""Extract SFUSD Pre-K and TK program data from DataSF."""

from __future__ import annotations

from typing import Any

import httpx
from pydantic import BaseModel, Field, field_validator
from rich.console import Console

console = Console()

# DataSF: San Francisco Schools (all districts, but we filter to SFUSD)
_DATASF_SCHOOLS_URL = "https://data.sfgov.org/resource/7e7j-59qk.json"


class SFUSDSchoolRecord(BaseModel):
    """Validated SFUSD school record from DataSF."""

    school: str
    cds_code: str  # CA Department of Education school code
    status: str
    low_grade: str
    high_grade: str
    educational_program_type: str = ""
    entity_type: str = ""
    website: str | None = None
    latitude: str | None = None
    longitude: str | None = None
    street_address: str = ""
    street_city: str = "San Francisco"
    street_state: str = "CA"
    street_zip: str = ""
    phone: str | None = None
    analysis_neighborhood: str | None = None

    model_config = {"populate_by_name": True}


def download_sfusd_schools(url: str = _DATASF_SCHOOLS_URL) -> list[dict[str, Any]]:
    """Download SFUSD school data from DataSF."""
    console.print("[blue]Downloading SFUSD school data from DataSF...[/blue]")
    params = {
        "$limit": 5000,
        "district": "San Francisco Unified",
        "status": "Active",
    }
    with httpx.Client(timeout=30, follow_redirects=True) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
    data = resp.json()
    console.print(f"[green]Downloaded {len(data)} SFUSD schools[/green]")
    return data


def filter_prek_tk(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Filter to Pre-K (low_grade=P) and TK-eligible (low_grade=K, public) schools."""
    prek = [r for r in rows if r.get("low_grade") == "P"]
    # K-level public schools have TK programs in SFUSD
    tk = [
        r for r in rows
        if r.get("low_grade") == "K"
        and r.get("public_yesno") is True
        and r.get("entity_type", "").startswith("Elementary")
    ]
    console.print(f"[green]Found {len(prek)} Pre-K schools, {len(tk)} TK-eligible elementary schools[/green]")
    return prek + tk


def validate_schools(rows: list[dict[str, Any]]) -> list[SFUSDSchoolRecord]:
    """Validate school records with Pydantic."""
    valid: list[SFUSDSchoolRecord] = []
    errors = 0
    for row in rows:
        try:
            record = SFUSDSchoolRecord.model_validate(row)
            valid.append(record)
        except Exception as e:
            errors += 1
            if errors <= 3:
                console.print(f"[yellow]Skipping invalid school: {e}[/yellow]")
    if errors:
        console.print(f"[yellow]{errors} validation errors[/yellow]")
    console.print(f"[green]Validated {len(valid)} SFUSD schools[/green]")
    return valid


def extract_sfusd(*, limit: int | None = None) -> list[SFUSDSchoolRecord]:
    """Full extraction: download, filter to Pre-K/TK, validate."""
    raw = download_sfusd_schools()
    filtered = filter_prek_tk(raw)
    records = validate_schools(filtered)
    if limit:
        records = records[:limit]
        console.print(f"[blue]Limited to {limit} records[/blue]")
    return records
