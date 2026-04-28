"""Completeness tiering for program trust metadata."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Literal

from rich.console import Console
from rich.table import Table

from pipeline.config import get_supabase

console = Console()

DataQualityTier = Literal["skeletal", "basic", "adequate", "complete"]


@dataclass(frozen=True)
class QualityTierResult:
    program_id: str
    program_name: str
    score: int
    tier: DataQualityTier
    checked_at: str
    address: str | None = None
    slug: str | None = None

    def to_report_dict(self) -> dict[str, Any]:
        return asdict(self)


def classify_quality_tier(score: int | float | None) -> DataQualityTier:
    """Map a 0-100 completeness score into the roadmap tiers."""
    normalized = 0 if score is None else int(score)
    if normalized < 30:
        return "skeletal"
    if normalized < 50:
        return "basic"
    if normalized < 80:
        return "adequate"
    return "complete"


def fetch_program_quality_rows(*, limit: int | None = None) -> list[dict[str, Any]]:
    client = get_supabase()
    query = client.table("programs").select("id, name, slug, address, data_completeness_score")
    if limit is not None:
        query = query.limit(limit)
    return query.execute().data or []


def compute_quality_tiers(rows: list[dict[str, Any]]) -> list[QualityTierResult]:
    checked_at = datetime.now(timezone.utc).isoformat()
    results: list[QualityTierResult] = []

    for row in rows:
        raw_score = row.get("data_completeness_score")
        score = int(raw_score) if isinstance(raw_score, (int, float)) else 0
        results.append(
            QualityTierResult(
                program_id=str(row.get("id") or ""),
                program_name=str(row.get("name") or "Unnamed program"),
                slug=row.get("slug") if isinstance(row.get("slug"), str) else None,
                address=row.get("address") if isinstance(row.get("address"), str) else None,
                score=score,
                tier=classify_quality_tier(score),
                checked_at=checked_at,
            )
        )

    return results


def write_quality_tier_results(
    results: list[QualityTierResult],
    *,
    dry_run: bool,
) -> int:
    if dry_run:
        return 0

    client = get_supabase()
    written = 0
    for result in results:
        client.table("programs").update(
            {
                "data_quality_tier": result.tier,
                "data_quality_tier_checked_at": result.checked_at,
            }
        ).eq("id", result.program_id).execute()
        written += 1
    return written


def summarize_quality_tiers(results: list[QualityTierResult]) -> dict[str, int]:
    summary = {tier: 0 for tier in ("skeletal", "basic", "adequate", "complete")}
    for result in results:
        summary[result.tier] += 1
    return summary


def enrichment_candidates(
    results: list[QualityTierResult],
    *,
    limit: int = 25,
) -> list[dict[str, Any]]:
    """Return basic/skeletal records that are practical enrichment candidates."""
    candidates = [
        result
        for result in results
        if result.tier in {"skeletal", "basic"} and result.address
    ]
    candidates.sort(key=lambda result: (result.score, result.program_name))
    return [candidate.to_report_dict() for candidate in candidates[:limit]]


def run_quality_tiering(
    *,
    dry_run: bool = False,
    limit: int | None = None,
) -> list[QualityTierResult]:
    rows = fetch_program_quality_rows(limit=limit)
    results = compute_quality_tiers(rows)
    written = write_quality_tier_results(results, dry_run=dry_run)
    print_quality_tier_report(results, written=written, dry_run=dry_run)
    return results


def print_quality_tier_report(
    results: list[QualityTierResult],
    *,
    written: int,
    dry_run: bool,
) -> None:
    summary = summarize_quality_tiers(results)

    table = Table(title="Data Quality Tiers")
    table.add_column("Tier")
    table.add_column("Count", justify="right")
    for tier, count in summary.items():
        table.add_row(tier, str(count))
    console.print(table)

    mode = "DRY RUN" if dry_run else "wrote"
    console.print(f"[green]{mode}: {written if not dry_run else len(results)} quality tier rows[/green]")

