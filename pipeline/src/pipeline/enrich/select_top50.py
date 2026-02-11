"""Select the top 50 programs for enrichment.

Selection priority:
1. All SFUSD programs (Pre-K and TK) — these are highest-demand public programs
2. Non-SFUSD programs with real websites — we can actually scrape these
3. Remaining high-capacity centers to fill the quota
"""

from __future__ import annotations

from pipeline.config import get_supabase


def select_top_programs(limit: int = 50) -> list[dict]:
    """Return up to `limit` programs prioritized for enrichment.

    Returns full program rows sorted by priority.
    """
    client = get_supabase()

    # Tier 1: All SFUSD programs (Pre-K + TK) — 88 programs
    sfusd = (
        client.table("programs")
        .select("*")
        .in_("primary_type", ["sfusd-prek", "sfusd-tk"])
        .order("primary_type")
        .order("name")
        .execute()
        .data
    )

    # Tier 2: Non-SFUSD with real websites
    non_sfusd_web = (
        client.table("programs")
        .select("*")
        .not_.in_("primary_type", ["sfusd-prek", "sfusd-tk"])
        .not_.is_("website", "null")
        .order("data_completeness_score", desc=True)
        .execute()
        .data
    )
    # Filter out "No Data" placeholder websites
    non_sfusd_web = [
        p for p in non_sfusd_web
        if p.get("website") and "No Data" not in p["website"]
    ]

    # Tier 3: Non-SFUSD without websites, by completeness
    # Pull a wider pool so we can backfill if tier quotas do not fill `limit`.
    non_sfusd_other = (
        client.table("programs")
        .select("*")
        .not_.in_("primary_type", ["sfusd-prek", "sfusd-tk"])
        .order("data_completeness_score", desc=True)
        .limit(max(limit * 3, 150))
        .execute()
        .data
    )
    # Exclude those already in tier 2
    tier2_ids = {p["id"] for p in non_sfusd_web}
    non_sfusd_other = [p for p in non_sfusd_other if p["id"] not in tier2_ids]

    # Balanced selection:
    # - cap SFUSD to half of selected set so private/web programs are included
    # - reserve room for website-backed and other private programs
    # - then backfill from remaining pools if needed
    sfusd_take = min(len(sfusd), max(1, limit // 2))
    web_take = min(len(non_sfusd_web), max(1, limit // 3))

    selected = sfusd[:sfusd_take] + non_sfusd_web[:web_take]
    remaining = limit - len(selected)
    if remaining > 0:
        selected.extend(non_sfusd_other[:remaining])

    if len(selected) < limit:
        web_remaining = non_sfusd_web[web_take:]
        other_remaining = non_sfusd_other[max(0, limit - sfusd_take - web_take):]
        sfusd_remaining = sfusd[sfusd_take:]

        for pool in (web_remaining, other_remaining, sfusd_remaining):
            need = limit - len(selected)
            if need <= 0:
                break
            selected.extend(pool[:need])

    # Deduplicate (shouldn't happen but be safe) and cap
    seen: set[str] = set()
    deduped: list[dict] = []
    for p in selected:
        if p["id"] not in seen:
            seen.add(p["id"])
            deduped.append(p)
    return deduped[:limit]
