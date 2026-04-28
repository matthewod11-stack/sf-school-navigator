"""Website URL validation for program records."""

from __future__ import annotations

import asyncio
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Literal
from urllib.parse import urlparse

import httpx
from rich.console import Console
from rich.table import Table

from pipeline.config import get_supabase

console = Console()

URLValidationStatus = Literal["valid", "redirect", "broken", "timeout", "dns_failure"]

_FALLBACK_GET_STATUSES = {403, 405, 501}
_FIXABLE_STATUSES = {"broken"}


@dataclass(frozen=True)
class URLValidationResult:
    """Validation result for one program website URL."""

    program_id: str
    program_name: str
    url: str
    status: URLValidationStatus
    checked_at: str
    status_code: int | None = None
    final_url: str | None = None
    error: str | None = None

    def to_report_dict(self) -> dict[str, Any]:
        return asdict(self)


def normalize_url(url: str) -> str:
    """Ensure a URL has an HTTP scheme before validation."""
    cleaned = url.strip()
    if not cleaned:
        return cleaned

    parsed = urlparse(cleaned)
    if parsed.scheme:
        return cleaned
    return f"https://{cleaned}"


def fetch_program_url_rows(*, limit: int | None = None) -> list[dict[str, Any]]:
    """Fetch programs that have a website URL to validate."""
    client = get_supabase()
    rows = client.table("programs").select("id, name, website").execute().data or []
    filtered = [row for row in rows if row.get("website")]
    return filtered[:limit] if limit is not None else filtered


async def _request_url(client: httpx.AsyncClient, url: str) -> httpx.Response:
    """Run HEAD first, falling back to GET for servers that reject HEAD."""
    response = await client.head(url)
    if response.status_code in _FALLBACK_GET_STATUSES:
        response = await client.get(url)
    return response


def _classify_response(
    *,
    program_id: str,
    program_name: str,
    original_url: str,
    checked_at: str,
    response: httpx.Response,
) -> URLValidationResult:
    """Classify an HTTP response into the project validation statuses."""
    final_url = str(response.url)
    status_code = response.status_code
    was_redirect = bool(response.history) or final_url.rstrip("/") != original_url.rstrip("/")

    if 200 <= status_code < 300:
        return URLValidationResult(
            program_id=program_id,
            program_name=program_name,
            url=original_url,
            status="redirect" if was_redirect else "valid",
            checked_at=checked_at,
            status_code=status_code,
            final_url=final_url if was_redirect else None,
        )

    if 300 <= status_code < 400:
        return URLValidationResult(
            program_id=program_id,
            program_name=program_name,
            url=original_url,
            status="redirect",
            checked_at=checked_at,
            status_code=status_code,
            final_url=final_url,
        )

    return URLValidationResult(
        program_id=program_id,
        program_name=program_name,
        url=original_url,
        status="broken",
        checked_at=checked_at,
        status_code=status_code,
        final_url=final_url if final_url != original_url else None,
        error=f"HTTP {status_code}",
    )


async def validate_program_url(
    row: dict[str, Any],
    client: httpx.AsyncClient,
    *,
    checked_at: str | None = None,
) -> URLValidationResult:
    """Validate one program URL."""
    program_id = str(row.get("id") or "")
    program_name = str(row.get("name") or "Unnamed program")
    original_url = normalize_url(str(row.get("website") or ""))
    checked_at = checked_at or datetime.now(timezone.utc).isoformat()

    if not original_url:
        return URLValidationResult(
            program_id=program_id,
            program_name=program_name,
            url="",
            status="broken",
            checked_at=checked_at,
            error="Missing URL",
        )

    try:
        response = await _request_url(client, original_url)
    except httpx.TimeoutException as exc:
        return URLValidationResult(
            program_id=program_id,
            program_name=program_name,
            url=original_url,
            status="timeout",
            checked_at=checked_at,
            error=str(exc) or "Request timed out",
        )
    except httpx.ConnectError as exc:
        return URLValidationResult(
            program_id=program_id,
            program_name=program_name,
            url=original_url,
            status="dns_failure",
            checked_at=checked_at,
            error=str(exc) or "Connection failed",
        )
    except httpx.InvalidURL as exc:
        return URLValidationResult(
            program_id=program_id,
            program_name=program_name,
            url=original_url,
            status="broken",
            checked_at=checked_at,
            error=str(exc) or "Invalid URL",
        )
    except httpx.RequestError as exc:
        return URLValidationResult(
            program_id=program_id,
            program_name=program_name,
            url=original_url,
            status="broken",
            checked_at=checked_at,
            error=str(exc) or "Request failed",
        )

    return _classify_response(
        program_id=program_id,
        program_name=program_name,
        original_url=original_url,
        checked_at=checked_at,
        response=response,
    )


async def validate_url_rows(
    rows: list[dict[str, Any]],
    *,
    concurrency: int = 10,
    timeout_seconds: float = 10,
) -> list[URLValidationResult]:
    """Validate URL rows concurrently."""
    checked_at = datetime.now(timezone.utc).isoformat()
    semaphore = asyncio.Semaphore(concurrency)
    timeout = httpx.Timeout(timeout_seconds)
    headers = {
        "User-Agent": "SFSchoolNavigatorBot/1.0 (+https://sf-school-navigator.vercel.app)",
    }

    async with httpx.AsyncClient(
        timeout=timeout,
        follow_redirects=True,
        headers=headers,
    ) as client:
        async def validate(row: dict[str, Any]) -> URLValidationResult:
            async with semaphore:
                return await validate_program_url(row, client, checked_at=checked_at)

        return await asyncio.gather(*(validate(row) for row in rows))


def write_url_validation_results(
    results: list[URLValidationResult],
    *,
    dry_run: bool,
    fix: bool,
) -> int:
    """Persist URL validation results to programs and optional provenance."""
    if dry_run:
        return 0

    client = get_supabase()
    written = 0

    for result in results:
        payload: dict[str, Any] = {
            "url_validation_status": result.status,
            "url_validation_checked_at": result.checked_at,
            "url_final_url": result.final_url,
        }

        if fix and result.status in _FIXABLE_STATUSES:
            payload["website"] = None

        client.table("programs").update(payload).eq("id", result.program_id).execute()
        written += 1

        if fix and result.status in _FIXABLE_STATUSES:
            client.table("field_provenance").insert(
                {
                    "program_id": result.program_id,
                    "field_name": "website",
                    "value_text": result.url,
                    "source": "manual",
                    "raw_snippet": (
                        "pipeline validate urls --fix nulled a confirmed broken "
                        f"website URL ({result.error or result.status})."
                    ),
                    "verified_at": result.checked_at,
                    "verified_by": "pipeline validate urls",
                }
            ).execute()

    return written


def summarize_url_results(results: list[URLValidationResult]) -> dict[str, int]:
    summary = {status: 0 for status in ("valid", "redirect", "broken", "timeout", "dns_failure")}
    for result in results:
        summary[result.status] += 1
    return summary


def run_url_validation(
    *,
    dry_run: bool = False,
    fix: bool = False,
    limit: int | None = None,
    concurrency: int = 10,
    timeout_seconds: float = 10,
) -> list[URLValidationResult]:
    """Fetch, validate, print, and optionally persist URL results."""
    rows = fetch_program_url_rows(limit=limit)
    if not rows:
        console.print("[yellow]No program website URLs found.[/yellow]")
        return []

    results = asyncio.run(
        validate_url_rows(
            rows,
            concurrency=concurrency,
            timeout_seconds=timeout_seconds,
        )
    )
    written = write_url_validation_results(results, dry_run=dry_run, fix=fix)
    print_url_validation_report(results, written=written, dry_run=dry_run, fix=fix)
    return results


def print_url_validation_report(
    results: list[URLValidationResult],
    *,
    written: int,
    dry_run: bool,
    fix: bool,
) -> None:
    """Print a concise URL validation summary."""
    summary = summarize_url_results(results)

    table = Table(title="URL Validation Summary")
    table.add_column("Status")
    table.add_column("Count", justify="right")
    for status, count in summary.items():
        table.add_row(status, str(count))
    console.print(table)

    problem_results = [r for r in results if r.status not in {"valid", "redirect"}]
    if problem_results:
        problem_table = Table(title="Problem URLs (first 20)")
        problem_table.add_column("Program")
        problem_table.add_column("Status")
        problem_table.add_column("URL")
        problem_table.add_column("Error")
        for result in problem_results[:20]:
            problem_table.add_row(
                result.program_name[:32],
                result.status,
                result.url[:50],
                (result.error or "")[:40],
            )
        console.print(problem_table)

    mode = "DRY RUN" if dry_run else "wrote"
    console.print(f"[green]{mode}: {written if not dry_run else len(results)} URL validation rows[/green]")
    if fix:
        fixed = sum(1 for result in results if result.status in _FIXABLE_STATUSES)
        console.print(f"[yellow]Fix mode: {fixed} confirmed broken URLs nulled[/yellow]")
