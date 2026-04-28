"""Program address validation against Mapbox geocoding."""

from __future__ import annotations

import asyncio
import math
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Literal
from urllib.parse import quote

import httpx
from rich.console import Console
from rich.table import Table

from pipeline.config import get_mapbox_token, get_supabase

console = Console()

AddressValidationStatus = Literal[
    "valid",
    "mismatch",
    "low_relevance",
    "outside_sf",
    "missing_address",
    "missing_coordinates",
    "geocode_failed",
]

_GEOCODE_ENDPOINT = "https://api.mapbox.com/geocoding/v5/mapbox.places"
_SF_LAT_MIN = 37.70
_SF_LAT_MAX = 37.85
_SF_LNG_MIN = -122.52
_SF_LNG_MAX = -122.35
_MIN_RELEVANCE = 0.8
_FIX_RELEVANCE = 0.9
_MISMATCH_THRESHOLD_METERS = 500.0


@dataclass(frozen=True)
class GeocodeCandidate:
    longitude: float
    latitude: float
    relevance: float
    place_name: str | None = None


@dataclass(frozen=True)
class AddressValidationResult:
    program_id: str
    program_name: str
    address: str | None
    status: AddressValidationStatus
    checked_at: str
    mismatch_meters: float | None = None
    relevance_score: float | None = None
    geocoded_longitude: float | None = None
    geocoded_latitude: float | None = None
    error: str | None = None

    def to_report_dict(self) -> dict[str, Any]:
        return asdict(self)


def is_within_sf_bounds(longitude: float, latitude: float) -> bool:
    return (
        _SF_LNG_MIN <= longitude <= _SF_LNG_MAX
        and _SF_LAT_MIN <= latitude <= _SF_LAT_MAX
    )


def parse_point(geometry: Any) -> tuple[float, float] | None:
    """Parse Supabase GeoJSON or PostGIS WKT point into (longitude, latitude)."""
    if isinstance(geometry, dict):
        coords = geometry.get("coordinates")
        if isinstance(coords, list) and len(coords) >= 2:
            lng, lat = coords[:2]
            if isinstance(lng, (int, float)) and isinstance(lat, (int, float)):
                return float(lng), float(lat)

    if isinstance(geometry, str) and "POINT" in geometry.upper():
        match = re.search(
            r"POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)",
            geometry,
            re.IGNORECASE,
        )
        if match:
            return float(match.group(1)), float(match.group(2))

    return None


def haversine_meters(
    left: tuple[float, float],
    right: tuple[float, float],
) -> float:
    """Distance in meters between two (longitude, latitude) points."""
    lng1, lat1 = left
    lng2, lat2 = right
    radius_m = 6_371_000

    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_m * c


def fetch_program_address_rows(*, limit: int | None = None) -> list[dict[str, Any]]:
    client = get_supabase()
    query = client.table("programs").select("id, name, address, coordinates")
    if limit is not None:
        query = query.limit(limit)
    return query.execute().data or []


async def geocode_address_for_validation(
    address: str,
    client: httpx.AsyncClient,
    *,
    token: str,
) -> GeocodeCandidate | None:
    """Forward geocode an address and return the best Mapbox candidate."""
    query = f"{address}, San Francisco, CA"
    params = {
        "access_token": token,
        "bbox": f"{_SF_LNG_MIN},{_SF_LAT_MIN},{_SF_LNG_MAX},{_SF_LAT_MAX}",
        "limit": 1,
        "types": "address,poi",
    }
    response = await client.get(f"{_GEOCODE_ENDPOINT}/{quote(query)}.json", params=params)
    response.raise_for_status()
    data = response.json()
    features = data.get("features") or []
    if not features:
        return None

    feature = features[0]
    center = feature.get("center") or []
    if len(center) < 2:
        return None

    return GeocodeCandidate(
        longitude=float(center[0]),
        latitude=float(center[1]),
        relevance=float(feature.get("relevance") or 0),
        place_name=feature.get("place_name"),
    )


def classify_address_result(
    row: dict[str, Any],
    candidate: GeocodeCandidate | None,
    *,
    checked_at: str | None = None,
    error: str | None = None,
) -> AddressValidationResult:
    """Classify a program address/geocode pair."""
    checked_at = checked_at or datetime.now(timezone.utc).isoformat()
    program_id = str(row.get("id") or "")
    program_name = str(row.get("name") or "Unnamed program")
    address = row.get("address")
    if not isinstance(address, str) or not address.strip():
        return AddressValidationResult(
            program_id=program_id,
            program_name=program_name,
            address=None,
            status="missing_address",
            checked_at=checked_at,
            error="Missing address",
        )

    if candidate is None:
        return AddressValidationResult(
            program_id=program_id,
            program_name=program_name,
            address=address,
            status="geocode_failed",
            checked_at=checked_at,
            error=error or "No geocode candidate returned",
        )

    geocoded = (candidate.longitude, candidate.latitude)
    stored = parse_point(row.get("coordinates"))
    mismatch = haversine_meters(stored, geocoded) if stored else None

    status: AddressValidationStatus = "valid"
    result_error = error
    if candidate.relevance < _MIN_RELEVANCE:
        status = "low_relevance"
        result_error = f"Mapbox relevance below {_MIN_RELEVANCE}"
    elif not is_within_sf_bounds(candidate.longitude, candidate.latitude):
        status = "outside_sf"
        result_error = "Geocoded point outside San Francisco bounds"
    elif stored is None:
        status = "missing_coordinates"
        result_error = "Stored coordinates missing or unparsable"
    elif mismatch is not None and mismatch > _MISMATCH_THRESHOLD_METERS:
        status = "mismatch"
        result_error = f"Stored coordinates differ by {round(mismatch)}m"

    return AddressValidationResult(
        program_id=program_id,
        program_name=program_name,
        address=address,
        status=status,
        checked_at=checked_at,
        mismatch_meters=mismatch,
        relevance_score=candidate.relevance,
        geocoded_longitude=candidate.longitude,
        geocoded_latitude=candidate.latitude,
        error=result_error,
    )


async def validate_program_address(
    row: dict[str, Any],
    client: httpx.AsyncClient,
    *,
    token: str,
    checked_at: str | None = None,
) -> AddressValidationResult:
    address = row.get("address")
    if not isinstance(address, str) or not address.strip():
        return classify_address_result(row, None, checked_at=checked_at)

    try:
        candidate = await geocode_address_for_validation(address, client, token=token)
    except httpx.HTTPError as exc:
        return classify_address_result(
            row,
            None,
            checked_at=checked_at,
            error=str(exc) or "Mapbox geocoding failed",
        )

    return classify_address_result(row, candidate, checked_at=checked_at)


async def validate_address_rows(
    rows: list[dict[str, Any]],
    *,
    token: str,
    concurrency: int = 5,
    timeout_seconds: float = 15,
) -> list[AddressValidationResult]:
    checked_at = datetime.now(timezone.utc).isoformat()
    semaphore = asyncio.Semaphore(concurrency)

    async with httpx.AsyncClient(timeout=httpx.Timeout(timeout_seconds)) as client:
        async def validate(row: dict[str, Any]) -> AddressValidationResult:
            async with semaphore:
                return await validate_program_address(
                    row,
                    client,
                    token=token,
                    checked_at=checked_at,
                )

        return await asyncio.gather(*(validate(row) for row in rows))


def _can_update_coordinates(result: AddressValidationResult) -> bool:
    return (
        result.status in {"mismatch", "missing_coordinates"}
        and result.relevance_score is not None
        and result.relevance_score >= _FIX_RELEVANCE
        and result.geocoded_longitude is not None
        and result.geocoded_latitude is not None
        and is_within_sf_bounds(result.geocoded_longitude, result.geocoded_latitude)
    )


def write_address_validation_results(
    results: list[AddressValidationResult],
    *,
    dry_run: bool,
    fix: bool,
) -> int:
    if dry_run:
        return 0

    client = get_supabase()
    written = 0

    for result in results:
        payload: dict[str, Any] = {
            "address_validation_status": result.status,
            "address_validation_checked_at": result.checked_at,
            "address_mismatch_meters": result.mismatch_meters,
            "address_relevance_score": result.relevance_score,
        }
        if fix and _can_update_coordinates(result):
            payload["coordinates"] = (
                "SRID=4326;POINT("
                f"{result.geocoded_longitude} {result.geocoded_latitude}"
                ")"
            )

        client.table("programs").update(payload).eq("id", result.program_id).execute()
        written += 1

    return written


def summarize_address_results(results: list[AddressValidationResult]) -> dict[str, int]:
    summary = {
        status: 0
        for status in (
            "valid",
            "mismatch",
            "low_relevance",
            "outside_sf",
            "missing_address",
            "missing_coordinates",
            "geocode_failed",
        )
    }
    for result in results:
        summary[result.status] += 1
    return summary


def run_address_validation(
    *,
    dry_run: bool = False,
    fix: bool = False,
    limit: int | None = None,
    concurrency: int = 5,
    timeout_seconds: float = 15,
) -> list[AddressValidationResult]:
    token = get_mapbox_token()
    if not token:
        console.print("[yellow]MAPBOX_ACCESS_TOKEN not set; skipping address validation.[/yellow]")
        return []

    rows = fetch_program_address_rows(limit=limit)
    if not rows:
        console.print("[yellow]No program addresses found.[/yellow]")
        return []

    results = asyncio.run(
        validate_address_rows(
            rows,
            token=token,
            concurrency=concurrency,
            timeout_seconds=timeout_seconds,
        )
    )
    written = write_address_validation_results(results, dry_run=dry_run, fix=fix)
    print_address_validation_report(results, written=written, dry_run=dry_run, fix=fix)
    return results


def print_address_validation_report(
    results: list[AddressValidationResult],
    *,
    written: int,
    dry_run: bool,
    fix: bool,
) -> None:
    summary = summarize_address_results(results)

    table = Table(title="Address Validation Summary")
    table.add_column("Status")
    table.add_column("Count", justify="right")
    for status, count in summary.items():
        table.add_row(status, str(count))
    console.print(table)

    issue_results = [r for r in results if r.status != "valid"]
    if issue_results:
        issue_table = Table(title="Address Issues (first 20)")
        issue_table.add_column("Program")
        issue_table.add_column("Status")
        issue_table.add_column("Meters", justify="right")
        issue_table.add_column("Relevance", justify="right")
        issue_table.add_column("Issue")
        for result in issue_results[:20]:
            issue_table.add_row(
                result.program_name[:32],
                result.status,
                "" if result.mismatch_meters is None else str(round(result.mismatch_meters)),
                "" if result.relevance_score is None else f"{result.relevance_score:.2f}",
                (result.error or "")[:40],
            )
        console.print(issue_table)

    mode = "DRY RUN" if dry_run else "wrote"
    console.print(f"[green]{mode}: {written if not dry_run else len(results)} address validation rows[/green]")
    if fix:
        fixed = sum(1 for result in results if _can_update_coordinates(result))
        console.print(f"[yellow]Fix mode: {fixed} high-confidence coordinates updated[/yellow]")

