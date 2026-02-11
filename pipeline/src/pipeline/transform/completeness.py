"""Calculate data_completeness_score for a program row."""

from __future__ import annotations

from typing import Any

# Fields that contribute to completeness, with weights.
# Total weights sum to 100.
_COMPLETENESS_FIELDS: list[tuple[str, int]] = [
    ("name", 15),
    ("address", 15),
    ("coordinates", 15),
    ("phone", 5),
    ("website", 5),
    ("primary_type", 10),
    ("license_number", 10),
    ("age_min_months", 5),
    ("age_max_months", 5),
    ("potty_training_required", 5),
    ("logo_url", 5),
    ("featured_image_url", 5),
]


def compute_completeness_score(row: dict[str, Any]) -> int:
    """Compute a 0-100 completeness score based on populated fields."""
    score = 0
    for field, weight in _COMPLETENESS_FIELDS:
        val = row.get(field)
        if val is not None and val != "" and val != "other":
            score += weight
    return min(score, 100)
