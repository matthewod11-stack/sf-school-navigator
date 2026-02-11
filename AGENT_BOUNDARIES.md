# Agent Boundaries — SF School Navigator

## Agent A: Data Pipeline

**Role:** Build and run the data ingestion, normalization, and enrichment pipeline.

**Owns:**
- `pipeline/` — entire Python pipeline directory
  - `pipeline/src/pipeline/extract/` — CCL, SFUSD, DEC, website scrapers
  - `pipeline/src/pipeline/transform/` — normalization, cost parsing, schedule parsing
  - `pipeline/src/pipeline/load/` — Supabase upsert scripts
  - `pipeline/src/pipeline/quality/` — freshness checks, schema validation, diff reports
  - `pipeline/configs/` — source mappings, enums
  - `pipeline/data/` — raw, staged, and snapshot data
  - `pipeline/tests/` — pipeline tests
- Database data for: `programs`, `program_tags`, `program_schedules`, `program_languages`, `program_costs`, `program_deadlines`, `attendance_areas`, `program_sfusd_linkage`, `sfusd_rules`, `field_provenance`, `geocode_cache`

**Read-only:**
- `types/domain.ts` — shared TypeScript types (reference for schema alignment)
- `supabase/migrations/` — database schema (defined in Phase 0, shared)
- `ROADMAP.md` — task reference

**Does NOT touch:**
- `src/` — any Next.js application code
- `src/components/` — any React components
- `src/lib/` — any application logic
- Auth configuration
- Email templates
- Vercel deployment config

**Features:** F005, F006, F007, F008, F013, F014

---

## Agent B: App Frontend

**Role:** Build the Next.js application — intake, search, map, profiles, comparison, auth, dashboard.

**Owns:**
- `src/app/` — all routes and pages
  - `src/app/(marketing)/` — homepage, about
  - `src/app/(onboarding)/intake/` — intake wizard
  - `src/app/(app)/search/` — map + list results
  - `src/app/(app)/programs/[slug]/` — program profiles
  - `src/app/(app)/compare/` — comparison tool
  - `src/app/(app)/dashboard/` — saved programs, tracker
  - `src/app/api/` — API routes
- `src/components/` — all React components
  - `src/components/intake/` — wizard steps
  - `src/components/map/` — Mapbox integration
  - `src/components/programs/` — cards, profiles
  - `src/components/compare/` — comparison table
  - `src/components/dashboard/` — tracker, timeline
  - `src/components/ui/` — shared UI primitives
- `src/lib/` — application logic
  - `src/lib/db/queries/` — Supabase query functions
  - `src/lib/db/rpc/` — RPC function wrappers
  - `src/lib/geo/` — geocoding, distance calculations
  - `src/lib/scoring/` — match scoring algorithm
  - `src/lib/notifications/` — email sending (Resend)
  - `src/lib/validation/` — Zod schemas for user input
- `src/styles/` — global styles
- Auth configuration (Supabase Auth)
- Email templates
- Vercel deployment configuration

**Read-only:**
- `types/domain.ts` — shared TypeScript types (defined in Phase 0)
- `supabase/migrations/` — database schema (shared)
- `pipeline/` — reference only, do not modify
- `ROADMAP.md` — task reference

**Does NOT touch:**
- `pipeline/` — any Python pipeline code
- Raw data files
- Data loading/upsert scripts
- Pipeline configs

**Features:** F009, F010, F011, F012, F015, F016, F017

---

## Shared (Team Lead Manages)

These are modified only by the team lead or with team lead coordination:

- `types/` — `domain.ts`, `api.ts`, `db.ts`
- `supabase/migrations/` — database schema and migration files
- `lib/config/cities/sf/` — city-specific configuration
- `seed.sql` — seed data for development
- `ROADMAP.md`, `PROGRESS.md`, `features.json`
- `.env.local`, `.env.example`
- `package.json`, `tsconfig.json`, `next.config.js`
- `pyproject.toml` (pipeline dependency management)

---

## Schema Amendment Protocol

If either agent discovers the database schema needs changes during their work:

1. **Agent identifies need** — e.g., "CCL data has a field we didn't model"
2. **Agent notifies team lead** via message: "Schema change needed: [description]"
3. **Team lead reviews** and creates migration
4. **Team lead notifies both agents** of the change
5. **Both agents update** their code to match

Agents do NOT create their own migrations without team lead approval.

---

## Integration Points

These are the places where Agent A's output becomes Agent B's input:

| Data | Producer | Consumer | Sync Point |
|------|----------|----------|------------|
| Program records in DB | Agent A (pipeline) | Agent B (queries) | End of Phase 1 |
| Attendance area polygons | Agent A (F007) | Agent B (F010 mini-map, F011 overlay) | End of Phase 1 |
| Enriched program data | Agent A (F013) | Agent B (F015 profiles) | During Phase 2 |
| Deadline data | Agent A (F014) | Agent B (F019 tracker) | End of Phase 2 |

During Phase 1, Agent B uses **seed data** (F004b) until Agent A's pipeline output is available.
