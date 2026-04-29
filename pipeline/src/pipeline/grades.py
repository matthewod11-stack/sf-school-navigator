"""Canonical grade-level helpers for programs."""

from __future__ import annotations

GRADE_LEVELS = ("prek", "tk", "k", "1", "2", "3", "4", "5")

_GRADE_ALIASES = {
    "p": "prek",
    "pk": "prek",
    "prek": "prek",
    "pre-k": "prek",
    "prekindergarten": "prek",
    "tk": "tk",
    "k": "k",
    "kg": "k",
    "kn": "k",
    "kindergarten": "k",
    "1": "1",
    "01": "1",
    "2": "2",
    "02": "2",
    "3": "3",
    "03": "3",
    "4": "4",
    "04": "4",
    "5": "5",
    "05": "5",
}


def normalize_grade(value: str | int | None) -> str | None:
    """Map source grade labels into the canonical grade taxonomy."""
    if value is None:
        return None
    normalized = str(value).strip().lower()
    return _GRADE_ALIASES.get(normalized)


def grade_span(low: str | int | None, high: str | int | None) -> list[str]:
    """Return canonical levels in an inclusive source grade span."""
    low_grade = normalize_grade(low)
    high_grade = normalize_grade(high)
    if high_grade is None:
        high_raw = str(high).strip() if high is not None else ""
        if high_raw.isdigit() and int(high_raw) > 5:
            high_grade = "5"
    if not low_grade and not high_grade:
        return []
    if not low_grade:
        low_grade = high_grade
    if not high_grade:
        high_grade = low_grade
    if low_grade not in GRADE_LEVELS or high_grade not in GRADE_LEVELS:
        return []

    start = GRADE_LEVELS.index(low_grade)
    end = GRADE_LEVELS.index(high_grade)
    if start > end:
        start, end = end, start
    return list(GRADE_LEVELS[start : end + 1])


def elementary_levels_from_enrollment(enrollment_by_grade: dict[str, int | None]) -> list[str]:
    """Infer K-5 grade coverage from grade enrollment counts."""
    levels: list[str] = []
    for level in ("k", "1", "2", "3", "4", "5"):
        count = enrollment_by_grade.get(level)
        if count is not None and count > 0:
            levels.append(level)
    return levels
