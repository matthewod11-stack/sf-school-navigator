# SF School Navigator — Project State

> Cross-surface context document. Shared across Claude Chat, Claude Code, and Cowork sessions.
> **Last regenerated:** 2026-03-23 | **Generated from:** Public showcase session + dev environment revival

---

## Project Overview

SF School Navigator is a web app helping San Francisco parents find and compare preschool/PreK programs. It combines data from CA Community Care Licensing, SFUSD enrollment, and individual school websites into a searchable, filterable map and list view. The strategic differentiator is connecting PreK choices to downstream kindergarten placement via SFUSD's attendance area and tiebreaker system. The app targets first-time parents, relocating families, and parents transitioning from infant care — the ~500+ program landscape is fragmented and no existing tool shows the full picture personalized to a family's situation.

The project has completed **Phases 0–3** (V1) for core product functionality. Phase 0 established the schema, types, and seed data. Phase 1 built the Python data pipeline (CCL/SFUSD import, attendance areas, quality framework) and the Next.js frontend (app shell, intake wizard, Mapbox map, list/filtering). Phase 2 added data enrichment (top 50 programs with schedules/costs/languages/deadlines, 100% deadline coverage), program profile pages with SSR, a comparison tool, and user auth with saved programs dashboard. Phase 3 added kindergarten path preview, deadline tracker with email reminders, programmatic SEO pages, data freshness UI, and a comprehensive WCAG AA accessibility pass across 17 files. An editorial UI refresh followed Phase 3.

**The repo was made PUBLIC on 2026-03-23** as part of an application to The San Francisco Standard's open call for tinkerers/hackers/community leaders. A professional README, MIT license, hero screenshot, Privacy Policy page, Terms of Service page, dynamic OG images, and GitHub topics were added. Internal dev artifacts were moved to `docs/dev/`.

**V2 roadmap** (`V2_ROADMAP.md`) has been validated and is ready for parallel execution. V2 covers 13 features across Phases 5-7: data validation pipeline (URL checks, address verification, quality tiers), elementary school expansion (~120 additional K-5 schools), and parent education content. Key V2 decisions: hybrid quality storage (DB columns + JSON reports), sequential child profiles (not simultaneous multi-child), and type-branching-only scoring adaptation. DataSF elementary data confirmed (76 SFUSD schools available via same API).

---

## Current Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS + TypeScript | SSR for SEO; Server Components default, client islands for map/intake. Editorial design: Libre Baskerville + Source Sans 3. |
| Maps | Mapbox GL JS | Geocoding, tiles, travel time matrix, attendance area polygon overlays |
| Database | Supabase (PostgreSQL + PostGIS) | Spatial queries, built-in auth, RLS, generous free tier |
| Auth | Supabase Auth (email + Google OAuth) | Bundled with DB |
| Hosting | Vercel | Live at sf-school-navigator.vercel.app. Cron job for reminders configured. |
| Email | Resend | Transactional deadline reminder emails |
| Data Pipeline | Python + Claude API | CCL import, SFUSD extraction, AI-assisted website scraping |
| OG Images | Satori / next/og | Dynamic OG images for root + per-school SEO pages |
| Monitoring | Sentry (not yet configured) | Error tracking — deferred until account is set up |
| Analytics | PostHog (not yet configured) | Privacy-respecting, no child PII in events — deferred |

---

## Architecture

### Directory Layout
```
src/
  app/
    (marketing)/              # Homepage, /privacy, /terms, /schools/[slug] SEO pages
    (onboarding)/intake/      # Multi-step intake wizard
    (app)/search/             # Map + list results
    (app)/programs/[slug]/    # Program profiles
    (app)/compare/            # Side-by-side comparison
    (app)/dashboard/          # Saved programs, deadline tracker
    api/                      # Route handlers (search, cron, saved-programs, etc.)
    opengraph-image.tsx       # Dynamic root OG image (Satori)
  components/
    intake/ map/ programs/ compare/ dashboard/ ui/ layout/ auth/
  lib/
    db/queries/ db/rpc/       # Supabase query functions
    supabase/                 # Three client pattern: server.ts, admin.ts, public.ts
    geo/                      # Geocoding, distance
    scoring/                  # Match scoring algorithm (9 tests)
    notifications/            # Resend email + HMAC unsubscribe tokens
    dates/                    # Timezone-safe date-only helpers
    seo/                      # SEO page configs + queries
    validation/               # Zod schemas
  types/
    domain.ts api.ts db.ts

pipeline/
  src/pipeline/
    extract/                  # ccl.py, sfusd.py, websites.py
    transform/                # normalize, enrichment, completeness scoring
    load/                     # upsert to Supabase on stable keys
    quality/                  # freshness, schema validation, diff reports
    enrich/                   # Top 50 program enrichment
  configs/                    # source_mappings.yaml, enums.yaml
  tests/                      # 64 pipeline tests

docs/
  dev/                        # Internal dev artifacts (PROGRESS.md, PROJECT_STATE.md, etc.)
  SPEC.md                     # Product specification (formerly Schools.md)
  screenshots/hero.png        # README hero screenshot
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

- **Editorial UI Refresh (pre-Phase 4)** — Typography-forward newspaper-of-record redesign across 40 files. Libre Baskerville serif headlines + Source Sans 3 body text. Deep navy brand palette (#2c3e50), warm cream/parchment backgrounds, desaturated semantic colors, flat ruled layouts replacing card shadows, tighter border radii. All headings `font-serif`. Focus rings neutral. WCAG AA contrast verified (ink on cream ~16:1). No logic/API/type changes — purely visual.

- **Public Showcase Session (2026-03-23):**
  - Repo made PUBLIC at https://github.com/matthewod11-stack/sf-school-navigator
  - Professional README.md with civic data story, hero screenshot, tech stack, getting started
  - MIT LICENSE added
  - 10 GitHub topics (civic-tech, san-francisco, education, open-data, nextjs, typescript, python, supabase, mapbox, postgis)
  - Internal dev docs moved to `docs/dev/`, product spec moved to `docs/SPEC.md`
  - Privacy Policy page (`/privacy`) and Terms of Service page (`/terms`) created
  - Footer links fixed (dead `#` → `/privacy`, `/terms`)
  - Dynamic OG images via Satori for root + 18 per-school SEO pages
  - Root metadata expanded: openGraph, twitter card, metadataBase with protocol normalization
  - Search API bug fixed: Zod schema rejected `null` context (only allowed `undefined`)
  - Local dev environment fully set up: `npm install`, `vercel link`, `vercel env pull`
  - Applied to The SF Standard's open call for tinkerers/hackers/community leaders — **received positive response from Griffin at The Standard on 2026-03-23**

### V2 — Validated, Ready for Implementation (Public Rollout Gated)
- **V2 Roadmap validated** — 13 features + V2-G0 release gate across 3 phases. External assessment added: V2-G0 hardening gate, `grade_levels` canonical data model, child profile PII guardrails, explicit DB column specs with timestamps, backfill migrations, and owner assignments on all pre-validation items.
- **V2-G0 (Release Gate):** Privacy Policy/ToS DONE. OG images DONE. Remaining: Map view redesign (not CSS fixes — needs new architecture), program profile polish, Sentry, PostHog, Lighthouse audit, VoiceOver pass, visual regression sweep, feature flags. Must pass before public V2 features.
- **Phase 5 (Data Validation):** URL/link validation, address verification, missing data flagging with quality tiers, combined quality dashboard. Each validation writes DB columns with `_checked_at` timestamps. Agent A owns pipeline; F003 UI banner is shared (Agent B).
- **Phase 6 (Elementary Expansion):** Program type enum expansion + `grade_levels text[]` with GIN index (lead-managed), SFUSD elementary import (~76 schools), CDE private/charter import (~50 schools, data source TBD), scoring adaptation (type-branching, uses `gradeTarget` + `grade_levels`), child profile management (sequential entries, `ageMonths` not DOB, backfill migration from legacy fields), elementary filter/SEO pages.
- **Phase 7 (Education & Content):** Static guide pages (4 guides, MDX vs React TBD with React default), contextual intake education ("Why we ask" callouts), search/profile education tooltips.

### Not Started
- **Phase 4:** Beta testing (20-30 parents), data QA, launch prep (Privacy Policy/ToS and OG images now done; Sentry/PostHog still pending)

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
13. **V2 quality storage: hybrid** — `data_quality_tier`, `url_validation_status`, `address_validation_status` columns on `programs` table + JSON summary report for CI
14. **V2 multi-child: sequential profiles** — each child = separate intake flow with JSONB array on `families`; profile switcher in UI, not simultaneous multi-child form
15. **V2 scoring: type-branching only** — F008 branches by program type (preschool vs elementary); no per-child logic needed since each profile runs scoring independently
16. **V2 child profile PII** — persist `ageMonths` only, never exact DOB; aligns with V1 privacy architecture
17. **V2 grade data model** — `programs.grade_levels` canonical text array + GIN index; prevents ambiguous grade inference
18. **V2 release sequencing** — build in parallel, public rollout blocked on V2-G0 hardening gate
19. **Remove Split view** — confirmed unnecessary (2026-03-23); simplify search to Map + List only
20. **Map view needs redesign, not CSS fixes** — flex-based layout doesn't work with Mapbox GL; needs fundamentally different container strategy (CSS Grid, full-screen page, or panel overlay pattern)
21. **Repo is PUBLIC** — made public 2026-03-23 for SF Standard application; all commits visible

---

## Planning Artifacts

| File | Purpose |
|------|---------|
| `docs/SPEC.md` | Product specification (formerly `Schools.md`) |
| `ROADMAP.md` | V1 execution plan — 26 features, Phases 0-4 |
| `V2_ROADMAP.md` | V2 execution plan — 13 features, Phases 5-7 (validated) |
| `docs/dev/AGENT_BOUNDARIES.md` | Parallel agent ownership map (V1 + V2 features) |
| `docs/dev/features.json` | Feature tracker for orchestration |
| `docs/dev/PROGRESS.md` | Session log for continuity |
| `KNOWN_ISSUES.md` | Issues, deferred decisions, V2 parking lot |
| `docs/dev/PROJECT_STATE.md` | This file — cross-surface context |
| `README.md` | Public-facing project README (added 2026-03-23) |
| `LICENSE` | MIT license (added 2026-03-23) |
| `PRIVACY.md` | Privacy & data architecture principles |
| `CLAUDE.md` | Claude Code project instructions |

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

**P0: Search Map View — Complete Redesign (next session)**
The map view is fundamentally broken. Three rounds of CSS fixes (min-h-0, overflow-hidden, calc adjustments) haven't resolved the core issue: Mapbox GL's container sizing conflicts with flex-based layouts. The map overlaps the nav header and filter sidebar.
- Remove the Split view option entirely (confirmed unnecessary)
- Redesign Map view from scratch using `frontend-design` skill
- Consider: full-width map with program panel overlay, slide-out drawer, or separate dedicated map page
- List view works well and should be preserved as-is

**P1: Program Profile Page Polish**
The profile page (`/programs/[slug]`) is functional but 6/10 quality:
- Spacing/padding inconsistencies throughout
- No static map preview (shows "Map preview unavailable")
- Save/Compare/Report buttons float awkwardly to the right
- "Visit website" link appears incorrect for some programs
- Section cards don't span full page width, leaving dead space

**P2: Remaining V2-G0 Gate Items**
- Sentry error monitoring (need account setup)
- PostHog analytics (need account setup)
- Lighthouse audit (target >80 performance, >90 accessibility)
- VoiceOver manual pass on intake → search → profile flow
- Visual regression sweep across core routes
- Rename middleware.ts → proxy.ts (Next.js 16 deprecation)
- Feature flags for staged V2 rollout

**P3: Phase 4 Beta & Launch**
- F023: Beta testing with 20-30 SF parents
- F024: Data QA & verification
- Custom domain on Vercel

**P4: V2 Feature Work (Phases 5-7)**
See `V2_ROADMAP.md`. Build can start now; public rollout gated on V2-G0.

**External:**
- Applied to The SF Standard's open call (2026-03-23). Received positive response from Griffin — phone call to discuss collaboration pending.

---

## Cross-Surface Notes

- **Repo is PUBLIC** at https://github.com/matthewod11-stack/sf-school-navigator — all commits visible. Be mindful of what goes into commit messages.
- **Live app** at https://sf-school-navigator.vercel.app — deployed via Vercel, auto-deploys on push to main.
- **Local dev setup**: `npm install` + `vercel link` + `vercel env pull .env.local` + `npm run dev`. Dev server runs on :3000 (or :3001 if occupied). Typecheck: `npm run typecheck`. Tests: `npm test` (9 passing). Pipeline venv not yet set up locally.
- **Spec review files** are in `~/.claude/reviews/reviews-2026-02-10-1546/` — individual feedback from Claude, Codex, Gemini plus consolidated feedback and Gemini validation
- **Git repo** has full commit history through Phase 3 + public showcase session (33 commits total)
- **V1 complete (Phases 0–3) + editorial UI refresh** — 100+ files. Frontend: 30+ components, 20+ route/page files, 10+ API routes, editorial design system (Libre Baskerville + Source Sans 3, warm palette). Pipeline: full Python package with CLI + enrichment + deadlines modules. 64 pipeline tests, 9 frontend tests.
- **V2 roadmap validated** — 13 features, Phases 5-7. Agent boundaries updated for V2. `docs/dev/features.json` has all V2 entries.
- **SFUSD data timing:** The 2026-27 TK feeder maps may not be published yet. Build the system to handle "pending" state where K-path data is unavailable
- **Next.js 16 deprecation:** `middleware.ts` should be renamed to `proxy.ts`. Build warns but still works.
- **SF Standard opportunity:** Griffin responded positively 2026-03-23. Phone call to discuss collaboration is pending.

---

*This file is the single source of truth for external Claude sessions. Update it at the end of any session with meaningful changes.*
