"""Tests for Phase 2 quality tiering and report summaries."""

from datetime import datetime, timezone

from pipeline.quality.report import build_quality_report
from pipeline.quality.tiering import classify_quality_tier, compute_quality_tiers, enrichment_candidates
from pipeline.validate.addresses import AddressValidationResult
from pipeline.validate.urls import URLValidationResult


def test_classify_quality_tier_boundaries():
    assert classify_quality_tier(0) == "skeletal"
    assert classify_quality_tier(29) == "skeletal"
    assert classify_quality_tier(30) == "basic"
    assert classify_quality_tier(49) == "basic"
    assert classify_quality_tier(50) == "adequate"
    assert classify_quality_tier(79) == "adequate"
    assert classify_quality_tier(80) == "complete"


def test_compute_quality_tiers_and_candidates():
    rows = [
        {"id": "1", "name": "Skeletal", "slug": "skeletal", "address": "1 St", "data_completeness_score": 10},
        {"id": "2", "name": "Basic", "slug": "basic", "address": "2 St", "data_completeness_score": 40},
        {"id": "3", "name": "Complete", "slug": "complete", "address": "3 St", "data_completeness_score": 90},
    ]

    results = compute_quality_tiers(rows)
    candidates = enrichment_candidates(results)

    assert [result.tier for result in results] == ["skeletal", "basic", "complete"]
    assert [candidate["program_name"] for candidate in candidates] == ["Skeletal", "Basic"]


def test_build_quality_report_exit_codes_and_counts():
    now = datetime.now(timezone.utc)
    report = build_quality_report(
        schema_issues=[
            {
                "program_id": "p1",
                "program_name": "Program",
                "severity": "warning",
                "field": "phone",
                "message": "Recommended field missing",
            }
        ],
        freshness_report=[
            {
                "source": "ccl",
                "total": 2,
                "oldest": now,
                "newest": now,
                "stale_count": 1,
                "is_stale": True,
            }
        ],
        tier_results=compute_quality_tiers(
            [
                {"id": "1", "name": "Basic", "slug": "basic", "address": "1 St", "data_completeness_score": 40},
                {"id": "2", "name": "Complete", "slug": "complete", "address": "2 St", "data_completeness_score": 95},
            ]
        ),
        url_results=[
            URLValidationResult(
                program_id="p1",
                program_name="Program",
                url="https://example.com",
                status="broken",
                checked_at=now.isoformat(),
                status_code=404,
            )
        ],
        address_results=[
            AddressValidationResult(
                program_id="p2",
                program_name="Other",
                address="2 St",
                status="mismatch",
                checked_at=now.isoformat(),
                mismatch_meters=800,
                relevance_score=0.95,
            )
        ],
    )

    assert report["summary"]["total_programs"] == 2
    assert report["summary"]["broken_urls"] == 1
    assert report["summary"]["address_issues"] == 1
    assert report["quality_tiers"]["basic"] == 1
    assert report["exit_code"] == 2

