"""Database helpers — thin wrappers around Supabase client."""

from __future__ import annotations

from typing import Any

from pipeline.config import get_supabase


def upsert_rows(
    table: str,
    rows: list[dict[str, Any]],
    *,
    on_conflict: str,
    batch_size: int = 50,
) -> int:
    """Upsert rows in batches. Returns total upserted count."""
    client = get_supabase()
    total = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        client.table(table).upsert(batch, on_conflict=on_conflict).execute()
        total += len(batch)
    return total


def insert_rows(
    table: str,
    rows: list[dict[str, Any]],
    *,
    batch_size: int = 50,
) -> int:
    """Insert rows in batches (no conflict handling). Returns count."""
    client = get_supabase()
    total = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        client.table(table).insert(batch).execute()
        total += len(batch)
    return total


def fetch_all(table: str, *, select: str = "*", filters: dict[str, Any] | None = None) -> list[dict]:
    """Fetch all rows from a table with optional eq filters."""
    client = get_supabase()
    query = client.table(table).select(select)
    if filters:
        for col, val in filters.items():
            query = query.eq(col, val)
    return query.execute().data
