"""Mapbox geocoding with geocode_cache table."""

from __future__ import annotations

import hashlib
import re
import time
from typing import Any
from urllib.parse import quote

import httpx
from rich.console import Console

from pipeline.config import get_mapbox_token, get_supabase

console = Console()

_GEOCODE_ENDPOINT = "https://api.mapbox.com/geocoding/v5/mapbox.places"
_SF_BBOX = "-122.5275,37.7030,-122.3480,37.8120"  # rough SF bounding box
_MIN_DELAY = 0.1  # 100ms between requests


def _address_hash(address: str) -> str:
    normalized = address.strip().upper()
    return hashlib.sha256(normalized.encode()).hexdigest()


def _check_cache(addr_hash: str) -> dict[str, Any] | None:
    """Look up address in geocode_cache. Returns row or None."""
    client = get_supabase()
    result = (
        client.table("geocode_cache")
        .select("*")
        .eq("address_hash", addr_hash)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]
    return None


def _store_cache(addr_hash: str, lng: float, lat: float) -> None:
    client = get_supabase()
    client.table("geocode_cache").upsert(
        {
            "address_hash": addr_hash,
            "coordinates": f"SRID=4326;POINT({lng} {lat})",
            "provider": "mapbox",
        },
        on_conflict="address_hash",
    ).execute()


def geocode_address(address: str) -> tuple[float, float] | None:
    """Geocode a single address. Returns (lng, lat) or None.

    Checks geocode_cache first. Rate-limited to 100ms between API calls.
    """
    addr_hash = _address_hash(address)

    # Check cache (don't let cache errors crash the import)
    try:
        cached = _check_cache(addr_hash)
        if cached:
            coords = cached.get("coordinates")
            if coords:
                return _parse_point(coords)
    except Exception as e:
        console.print(f"[yellow]Cache lookup failed, will geocode fresh: {e}[/yellow]")

    token = get_mapbox_token()
    if not token:
        console.print("[yellow]MAPBOX_ACCESS_TOKEN not set — skipping geocoding[/yellow]")
        return None

    # Call Mapbox — strip suite/unit numbers and URL-encode
    clean_addr = re.sub(r'[,\s]*#\s*\w+', '', address)  # remove #310, #150, etc.
    query = f"{clean_addr}, San Francisco, CA"
    params = {
        "access_token": token,
        "bbox": _SF_BBOX,
        "limit": 1,
        "types": "address",
    }

    try:
        with httpx.Client(timeout=15) as http:
            resp = http.get(
                f"{_GEOCODE_ENDPOINT}/{quote(query)}.json",
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as e:
        console.print(f"[red]Geocoding failed for '{address}': {e}[/red]")
        return None

    features = data.get("features", [])
    if not features:
        return None

    lng, lat = features[0]["center"]
    try:
        _store_cache(addr_hash, lng, lat)
    except Exception as e:
        console.print(f"[yellow]Cache store failed (non-fatal): {e}[/yellow]")

    time.sleep(_MIN_DELAY)
    return (lng, lat)


def _parse_point(geom: Any) -> tuple[float, float] | None:
    """Parse a PostGIS point (returned as GeoJSON or WKT) into (lng, lat)."""
    if isinstance(geom, dict):
        # GeoJSON format: {"type": "Point", "coordinates": [lng, lat]}
        coords = geom.get("coordinates")
        if coords and len(coords) >= 2:
            return (coords[0], coords[1])
    if isinstance(geom, str) and "POINT" in geom.upper():
        # WKT format: POINT(lng lat) or SRID=4326;POINT(lng lat)
        match = re.search(r"POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)", geom, re.IGNORECASE)
        if match:
            return (float(match.group(1)), float(match.group(2)))
    return None
