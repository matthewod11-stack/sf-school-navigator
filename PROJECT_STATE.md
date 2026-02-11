# SF School Navigator — Project State

> Cross-surface context document. Shared across Claude Chat, Claude Code, and Cowork sessions.
> **Last regenerated:** 2026-02-11 | **Generated from:** Phase 3 completion

---

## Project Overview

SF School Navigator is a web app helping San Francisco parents find and compare preschool/PreK programs. It combines data from CA Community Care Licensing, SFUSD enrollment, and individual school websites into a searchable, filterable map and list view. The strategic differentiator is connecting PreK choices to downstream kindergarten placement via SFUSD's attendance area and tiebreaker system. The app targets first-time parents, relocating families, and parents transitioning from infant care — the ~500+ program landscape is fragmented and no existing tool shows the full picture personalized to a family's situation.

The project has completed **Phases 0–3**. Phase 0 established the schema, types, and seed data. Phase 1 built the Python data pipeline (CCL/SFUSD import, attendance areas, quality framework) and the Next.js frontend (app shell, intake wizard, Mapbox map, list/filtering). Phase 2 added data enrichment (top 50 programs with schedules/costs/languages/deadlines, 100% deadline coverage), program profile pages with SSR, a comparison tool, and user auth with saved programs dashboard. Phase 3 added kindergarten path preview, deadline tracker with email reminders, programmatic SEO pages, data freshness UI, and a comprehensive WCAG AA accessibility pass across 17 files. Next up: Phase 4 (beta testing, data QA, launch prep).

---

## Current Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS + TypeScript | SSR for SEO; Server Components default, client islands for map/intake |
| Maps | Mapbox GL JS | Geocoding, tiles, travel time matrix, attendance area polygon overlays |
| Database | Supabase (PostgreSQL + PostGIS) | Spatial queries, built-in auth, RLS, generous free tier |
| Auth | Supabase Auth (email + Google OAuth) | Bundled with DB |
| Hosting | Vercel | Zero-config Next.js deployment, edge functions, preview deploys |
| Email | Resend | Transactional deadline reminder emails |
| Data Pipeline | Python + Claude API | CCL import, SFUSD extraction, AI-assisted website scraping |
| Monitoring | Sentry (planned) | Error tracking |
| Analytics | PostHog (planned) | Privacy-respecting, no child PII in events |

---

## Architecture

### Directory Layout (Planned)
```
src/
  app/
    (marketing)/              # Homepage, about
    (onboarding)/intake/      # Multi-step intake wizard
    (app)/search/             # Map + list results
    (app)/programs/[slug]/    # Program profiles
    (app)/compare/            # Side-by-side comparison
    (app)/dashboard/          # Saved programs, deadline tracker
    api/                      # API routes
  components/
    intake/ map/ programs/ compare/ dashboard/ ui/
  lib/
    db/queries/ db/rpc/       # Supabase query functions
    geo/                      # Geocoding, distance
    scoring/                  # Match scoring algorithm
    notifications/            # Resend email integration
    validation/               # Zod schemas
    config/cities/sf/         # SF-specific rules, thresholds
  types/
    domain.ts api.ts db.ts

pipeline/
  src/pipeline/
    extract/                  # ccl.py, sfusd.py, dec.py, websites.py
    transform/                # normalize_programs.py, costs, schedules, rules
    load/                     # upsert_programs.py, attendance_areas, deadlines
    quality/                  # freshness_checks.py, schema_checks.py, diff_report.py
  configs/                    # source_mappings.yaml, enums.yaml
  data/raw/ staged/ snapshots/
  tests/
```

### Data Flow
```
CCL/SFUSD/Websites → Python Pipeline → Supabase (PostGIS)
                                            ↓
Parent: Intake Wizard → Geocode (Mapbox) → Store fuzzed coords + attendance area
                                            ↓
Search: PostGIS spatial query + match scoring → Map/List results
                                            ↓
Profile: Supabase query → SSR program page (+ Mapbox Matrix for travel time)
```

### Database (Key Tables)
`programs`, `program_tags`, `program_schedules`, `program_languages`, `program_costs`, `program_deadlines`, `sfusd_rules`, `attendance_areas`, `program_sfusd_linkage`, `field_provenance`, `user_corrections`, `families`, `saved_programs`, `geocode_cache`

PostGIS enabled. GiST indexes on program coordinates and attendance area geometries. Row Level Security on all family/user tables.

---

## Current State

### Fully Complete
- **Product spec** (`Schools.md`) — problem, target user, MVP scope, data architecture, tech stack, user flows, SF-specific context, monetization, success metrics, risks
- **Multi-agent spec review** — Claude, Codex, Gemini reviewed in parallel; 3 showstoppers identified and resolved
- **Consolidated feedback** — 17 findings, consensus/divergence analysis, prioritized action items
- **Validated roadmap** (`ROADMAP.md`) — 26 features, 5 phases, parallel execution plan; validated by Claude + Gemini (APPROVED WITH CHANGES, 5 changes applied)
- **Execution setup** — `AGENT_BOUNDARIES.md`, `features.json`, `PROGRESS.md`, workflow state
- **Phase 0** — Project scaffolding, DB schema (14 tables + PostGIS), shared types, Zod schemas, match scoring (9 tests), privacy architecture, seed data (12 programs, 3 attendance areas)
- **Phase 1 — Data Pipeline** — Python pipeline in `pipeline/`: CCL import (414 facilities), SFUSD import (88 programs), attendance areas (58 polygons from DataSF), data quality framework (freshness/schema/diff). 21 tests. Live data loaded: 502 programs, 2,944 provenance records.
- **Phase 1 — Frontend** — App shell with route groups, 5-step intake wizard with Zod + localStorage, Mapbox map with clustered pins + custom icons + attendance overlay, list view with filter sidebar + text search + sorting + NoResults suggestions. Search wired to real Supabase data.
- **Phase 2 — Data Enrichment** — Enrichment pipeline at `pipeline/src/pipeline/enrich/`: 50 programs enriched with schedules, costs, languages, deadlines. 53 programs at >80% completeness. All 502 programs have 2026-27 deadline records (768 total). 64 pipeline tests.
- **Phase 2 — App Features** — Program profile pages (`/programs/[slug]`) with SSR, provenance tooltips, corrections API. Comparison tool with tray, desktop table, mobile swipe cards. User auth (email + Google OAuth), saved programs dashboard with status tracking and notes. 8 new API routes.

- **Phase 3 — Integration & Polish** — Kindergarten path preview on SFUSD profiles/comparison/search badges (F018). Deadline tracker with timeline, color-coded cards, configurable Resend email reminders, and cron job (F019). Programmatic SEO pages for neighborhoods/languages/affordability with sitemap.xml and robots.txt (F020). Data freshness badges, completeness indicators, provenance tooltips, freshness filter, and correction flow (F021). WCAG AA accessibility pass: focus trap on auth modal, skip navigation, 404 page, ARIA labels/pressed/expanded/live on all interactive elements, 44px touch targets, urgency text labels, semantic list roles, and keyboard navigation (F022).

### Not Started
- **Phase 4:** Beta testing (20-30 parents), data QA, launch prep

---

## Key Decisions

1. **Mapbox only** — dropped "Mapbox or Google" ambiguity; single vendor for geo
2. **Email reminders only** — web push deferred to V2
3. **50 full profiles at launch** — 400+ basic listings from CCL; iterate based on demand
4. **Structured wizard, not chatbot** — predictable UX; defer conversational AI to V2
5. **Qualitative match tiers** — "Strong/Good/Partial Match" not numeric scores; avoid false precision
6. **Primary type + tags** — not a single enum; handles hybrid programs
7. **Two-tier display** — scored programs prominent; basic listings shown but visually distinct
8. **Fuzzed coordinates, no raw addresses** — geocode once, store ~200m fuzz + attendance area ID, discard original
9. **Deterministic upsert** — CCL license # and SFUSD school ID as stable keys; protects saved_programs FK across data refreshes
10. **Versioned SFUSD rules** — year-tagged, sourced, disclaimed; not static booleans
11. **Parallel execution** — Agent A (Python data pipeline) + Agent B (Next.js frontend); separable domains
12. **ST_Distance for search, Matrix API for profiles** — control Mapbox costs; rough distance in list, real travel time on detail pages

---

## Planning Artifacts

| File | Purpose |
|------|---------|
| `Schools.md` | Product specification (306 lines) |
| `ROADMAP.md` | Validated execution plan — 26 features, 5 phases |
| `AGENT_BOUNDARIES.md` | Parallel agent ownership map |
| `features.json` | Feature tracker for orchestration |
| `PROGRESS.md` | Session log for continuity |
| `KNOWN_ISSUES.md` | Issues, deferred decisions, V2 parking lot |
| `PROJECT_STATE.md` | This file — cross-surface context |
| `.claude/workflow-state.json` | Plan-master workflow state |
| `~/.claude/reviews/reviews-2026-02-10-1546/` | All review + validation files |

---

## Review Findings (Top Issues Addressed)

| Finding | Source | Resolution |
|---------|--------|------------|
| PII/privacy architecture needed | Claude, Gemini | F004: geocode-and-discard, fuzzed coords, RLS, no raw addresses |
| SFUSD policy model too fragile | Claude, Codex, Gemini | `sfusd_rules` table: versioned, year-tagged, sourced, disclaimed |
| Match scoring underspecified | Claude, Codex, Gemini | F003: hard filters (must-haves), weighted boosts (nice-to-haves), qualitative tiers |
| Missing program images | Gemini (validation) | Added `logo_url`, `featured_image_url` to schema + enrichment |
| Pipeline could break saved_programs FK | Gemini (validation) | Deterministic upsert on license #/school ID |
| No text search | Gemini (validation) | Added pg_trgm/ILIKE search to F012 |
| Matrix API too expensive for search | Gemini (validation) | ST_Distance for search; Matrix for profile/compare only |
| Empty deadline tracker | Gemini (validation) | Generic deadline estimates for programs without exact dates |

---

## What's Next

**Immediate (next session — Phase 4: Beta & Launch Prep):**
1. F023: Beta Testing — recruit 20-30 SF parents, create feedback form, run beta protocol, triage feedback
2. F024: Data QA & Verification — cross-reference top 50 profiles against websites, verify attendance areas for 20 addresses, check 2026-27 deadlines, address beta corrections
3. F025: Launch Prep — finalize Privacy Policy and ToS, configure Sentry, set up PostHog analytics, configure custom domain on Vercel, OG images

**Infrastructure still pending:**
4. Set up Vercel deployment (pending since Phase 0)
5. Set up Resend account for deadline email reminders (F019 code is built, needs env vars)
6. Import Family Child Care Homes CSV (~200-400 additional programs)

---

## Cross-Surface Notes

- **Spec review files** are in `~/.claude/reviews/reviews-2026-02-10-1546/` — individual feedback from Claude, Codex, Gemini plus consolidated feedback and Gemini validation
- **Workflow state** is in `.claude/workflow-state.json` — can resume with `/plan-master` if needed
- **Git repo** was initialized during planning (needed for Codex CLI). Currently has 2 commits: initial spec + planning artifacts
- **Phases 0–3 code complete** — 100+ files, ~10000 insertions. Frontend: 30+ components, 20+ route/page files, 10+ API routes. Pipeline: full Python package with CLI + enrichment + deadlines modules. 64 pipeline tests, 9 frontend tests.
- **Codex CLI note:** Codex requires a trusted git directory. Background processes may not inherit the correct working directory — run Codex manually if background execution fails
- **SFUSD data timing:** The 2026-27 TK feeder maps may not be published yet. Build the system to handle "pending" state where K-path data is unavailable

---

*This file is the single source of truth for external Claude sessions. Update it at the end of any session with meaningful changes.*
