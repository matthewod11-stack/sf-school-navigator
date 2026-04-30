# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

### Frontend (Next.js)
```bash
npm run dev          # Dev server on :3000
npm run build        # Production build (also runs typecheck)
npm run typecheck    # TypeScript strict check
npm test             # Vitest (9 tests, scoring)
npm test -- scoring  # Run single test file by name
npm run lint         # ESLint
```

### Pipeline (Python 3.11)
```bash
pipeline/.venv/bin/python -m pytest -q                    # All 64 tests
pipeline/.venv/bin/python -m pytest tests/test_enrich.py  # Single file
pipeline/.venv/bin/python -m pipeline ccl-import --dry-run --limit 5
pipeline/.venv/bin/python -m pipeline enrich --dry-run --limit 5
pipeline/.venv/bin/python -m pipeline quality check
```

## Architecture

### Two Codebases
- **`src/`** — Next.js 15 App Router frontend (TypeScript, Tailwind 4, Vitest)
- **`pipeline/`** — Python data pipeline (Click CLI, Pydantic, pytest)

Both share a Supabase PostgreSQL+PostGIS database with 14 tables and RLS enabled.

### Route Groups
```
src/app/
  (marketing)/     # Public: homepage, /schools/[slug] SEO pages (SSG)
  (onboarding)/    # Intake wizard
  (app)/           # Authenticated: /search, /programs/[slug], /compare, /dashboard
  api/             # Route handlers
```

### Three Supabase Clients
- **Server** (`src/lib/supabase/server.ts`) — Cookie-based session, for authenticated user actions. `await createClient()`
- **Admin** (`src/lib/supabase/admin.ts`) — Service role key, bypasses RLS. For cron jobs and serverless contexts with no user session. `createAdminClient()`
- **Public** (`src/lib/supabase/public.ts`) — Anon key, no cookies. For SSG-safe static queries. `createPublicClient()`

### Match Scoring (`src/lib/scoring/`)
Hard filters exclude programs entirely (budget, age, potty training). Weighted boosts (0-45 pts) rank remaining programs. Display tiers: Strong (80%+), Good (60-79%), Partial (40-59%). Hidden if <40% or data completeness <50%.

### Data Pipeline Flow
Extract (CCL CSV, SFUSD DataSF, websites) → Transform (normalize, completeness score, slugs) → Load (upsert to Supabase on `license_number`/school ID as stable keys) → Quality (freshness, schema, diff). Enrichment adds schedules/costs/languages/deadlines for top 50 programs with provenance tracking.

## Critical Patterns

**Date handling:** Always use `src/lib/dates/date-only.ts` for deadline dates. Raw `new Date("YYYY-MM-DD")` shifts by 1 day in Pacific time.

**Geocoding privacy:** Coordinates are fuzzed ~200m. Raw addresses are geocoded once during intake then discarded. Only fuzzed point + attendance area ID stored.

**Upsert stability:** Programs upsert on `license_number` (CCL) or SFUSD school ID, not on `id`. This protects `saved_programs` foreign keys across data refreshes.

**Cron authentication:** `/api/cron/reminders` requires `Bearer ${CRON_SECRET}` header and uses admin client (no user session in cron context).

**Unsubscribe tokens:** Email unsubscribe links use HMAC-signed expiring tokens (`src/lib/notifications/unsubscribe-token.ts`), not raw IDs.

**RLS enforcement:** Dual-layer — Supabase RLS policies restrict row access, API routes verify ownership. Both required.

## Environment Variables

See `.env.example`. Key split:
- `NEXT_PUBLIC_*` — Browser-safe (Supabase URL, anon key, Mapbox token, site URL)
- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `UNSUBSCRIBE_TOKEN_SECRET`, `CRON_SECRET` — Server-only

## Path Alias

`@/*` maps to `./src/*` (tsconfig + vitest config).

## Overnight Agent

An autonomous agent runs nightly to fix `tech-debt` GitHub Issues (max 3 per run).

- `docs/OVERNIGHT_AGENT.md` — Full autonomous prompt + issue template + label conventions
- `prompts/overnight-agent.md` — Thin entry point for Desktop scheduled task
- `state/overnight-agent-log.json` — Run log (gitignored)

## Project Tracking

- `ROADMAP.md` — Unified roadmap: 4 phases, 16 features (F026–F028 + V2-F001–F013)
- `PROGRESS.md` — Session log (root)
- `PROJECT_STATE.md` — Cross-surface context for external Codex sessions (root)
- GitHub Issues — Open issues, tech debt, V2 parking lot (migrated from KNOWN_ISSUES.md; resolved V1 issues archived to `docs/dev/V1_KNOWN_ISSUES.md`)
- `docs/dev/features.json` — Machine-readable feature status
- `docs/dev/V1_ROADMAP.md` — Archived V1 roadmap (Phases 0-3, 22 features, all complete)
