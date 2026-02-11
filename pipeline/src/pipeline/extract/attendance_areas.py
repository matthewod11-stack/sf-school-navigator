"""Extract SFUSD attendance area boundaries from DataSF."""

from __future__ import annotations

import json
from typing import Any

import httpx
from pydantic import BaseModel, Field, field_validator
from rich.console import Console

console = Console()

# DataSF Socrata API — SFUSD School Attendance Areas (2024-2025)
_DATASF_URL = "https://data.sfgov.org/resource/e6tr-sxwg.json"


class AttendanceAreaRecord(BaseModel):
    """Validated attendance area record from DataSF."""

    aaname: str
    e_aa_name: str  # Elementary school name (uppercase)
    e_aa_schno: str  # School number
    the_geom: dict[str, Any]  # GeoJSON MultiPolygon

    @field_validator("e_aa_schno", mode="before")
    @classmethod
    def parse_school_number(cls, v: Any) -> str:
        """Convert float school numbers (e.g. 507.0) to clean strings."""
        if isinstance(v, float):
            return str(int(v))
        return str(v).replace(".0", "")


def download_attendance_areas(url: str = _DATASF_URL) -> list[dict[str, Any]]:
    """Download attendance area GeoJSON from DataSF Socrata API."""
    console.print("[blue]Downloading SFUSD attendance areas from DataSF...[/blue]")
    params = {"$limit": 1000}  # More than enough for ~58 areas
    with httpx.Client(timeout=30, follow_redirects=True) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
    data = resp.json()
    console.print(f"[green]Downloaded {len(data)} attendance areas[/green]")
    return data


def validate_areas(rows: list[dict[str, Any]]) -> list[AttendanceAreaRecord]:
    """Validate attendance area records with Pydantic."""
    valid: list[AttendanceAreaRecord] = []
    errors = 0
    for row in rows:
        try:
            record = AttendanceAreaRecord.model_validate(row)
            valid.append(record)
        except Exception as e:
            errors += 1
            if errors <= 3:
                console.print(f"[yellow]Skipping invalid area: {e}[/yellow]")
    if errors:
        console.print(f"[yellow]{errors} validation errors[/yellow]")
    console.print(f"[green]Validated {len(valid)} attendance areas[/green]")
    return valid


def _multipolygon_to_polygon_wkt(geom: dict[str, Any]) -> str:
    """Convert GeoJSON MultiPolygon to WKT POLYGON for PostGIS.

    Takes the first polygon from the MultiPolygon (most areas are simple).
    PostGIS attendance_areas.geometry expects POLYGON, not MULTIPOLYGON.
    """
    coords = geom["coordinates"]
    # Take the first polygon's outer ring
    outer_ring = coords[0][0]
    points = " ".join(f"{lng} {lat}" for lng, lat in outer_ring)
    return f"SRID=4326;POLYGON(({points}))"


def area_to_db_row(record: AttendanceAreaRecord, school_year: str = "2024-25") -> dict[str, Any]:
    """Transform an attendance area record into a DB row."""
    return {
        "name": record.aaname,
        "geometry": _multipolygon_to_polygon_wkt(record.the_geom),
        "school_year": school_year,
        "linked_elementary_school_ids": [record.e_aa_schno],
    }


def extract_attendance_areas() -> list[AttendanceAreaRecord]:
    """Full extraction: download + validate."""
    raw = download_attendance_areas()
    return validate_areas(raw)
