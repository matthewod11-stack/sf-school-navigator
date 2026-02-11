# Pipeline Geocoding & PostGIS Data Load Bugs

> **Category:** runtime-error
> **Created:** 2026-02-11
> **Keywords:** mapbox, geocoding, url-encoding, postgis, wkt, polygon, supabase, pipeline

## Symptoms

### 1. Mapbox 404 on addresses with suite numbers
- Addresses like `49 SOUTH VAN NESS AVENUE #310` produced HTTP 404 from Mapbox
- The `#` character was treated as a URL fragment, truncating the query

### 2. PostGIS "parse error - invalid geometry" on polygon insert
- `attendance_areas` insert failed with `parse error at position 120 within geometry`
- The WKT string had space-separated coordinate pairs instead of comma-separated

### 3. Transient Supabase timeout crashes entire import
- A single `ConnectTimeout` on geocode cache lookup killed the entire 404-record batch
- No error handling around cache operations

## Root Causes

1. **URL encoding:** `geocode.py` built the Mapbox URL with raw address text in the path segment: `f"{endpoint}/{query}.json"`. The `#` in suite numbers split the URL.
2. **WKT format:** `_multipolygon_to_polygon_wkt` used `" ".join(...)` between coordinate pairs. WKT requires `", ".join(...)` — commas separate points, spaces separate lng/lat within a point.
3. **No error isolation:** Cache lookup/store called Supabase synchronously with no try/except, so any network hiccup was fatal.

## Solutions

### 1. URL-encode + strip suite numbers
```python
from urllib.parse import quote
import re

clean_addr = re.sub(r'[,\s]*#\s*\w+', '', address)  # strip #310, #150 etc.
query = f"{clean_addr}, San Francisco, CA"
url = f"{endpoint}/{quote(query)}.json"
```

### 2. Fix WKT comma separators
```python
# Before (broken):
points = " ".join(f"{lng} {lat}" for lng, lat in outer_ring)

# After (correct):
points = ", ".join(f"{coord[0]} {coord[1]}" for coord in outer_ring)
```
Note: using `coord[0]`/`coord[1]` also handles 3D coordinates `[lng, lat, alt]`.

### 3. Wrap cache ops in try/except
```python
try:
    cached = _check_cache(addr_hash)
    ...
except Exception as e:
    console.print(f"Cache lookup failed, will geocode fresh: {e}")
```

## Prevention

- Always URL-encode user/external data in URL path segments
- Test WKT output with a real PostGIS insert (dry-run doesn't catch format issues)
- External service calls in batch loops should never be unguarded — one failure shouldn't abort the batch
