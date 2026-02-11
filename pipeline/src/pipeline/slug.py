"""Deterministic slug generation for programs."""

from __future__ import annotations

from slugify import slugify


def make_program_slug(name: str, neighborhood: str | None = None) -> str:
    """Generate a stable slug: slugify(name)-neighborhood.

    If no neighborhood is provided, falls back to just the slugified name.
    """
    parts = [name]
    if neighborhood:
        parts.append(neighborhood)
    return slugify("-".join(parts), max_length=120)
