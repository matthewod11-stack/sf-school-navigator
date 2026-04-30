# SF School Navigator — Project State

> Cross-surface context document. Shared across Claude Chat, Claude Code, and Cowork sessions.
> **Last regenerated:** 2026-04-30 | **Generated from:** Phase 5 V2-F016 household workspace closeout

---

## Project Overview

SF School Navigator is a web app helping San Francisco parents find and compare preschool, PreK/TK, and elementary options. It combines data from CA Community Care Licensing, SFUSD, CDE public/private school exports, and individual school websites into a searchable, filterable map and list view. The strategic differentiator is connecting early-childhood choices, elementary grade targets, attendance areas, and downstream placement context in one parent-facing workflow.

The project has completed **Phases 0–3** (V1) for core product functionality. Phase 0 established the schema, types, and seed data. Phase 1 built the Python data pipeline (CCL/SFUSD import, attendance areas, quality framework) and the Next.js frontend (app shell, intake wizard, Mapbox map, list/filtering). Phase 2 added data enrichment (top 50 programs with schedules/costs/languages/deadlines, 100% deadline coverage), program profile pages with SSR, a comparison tool, and user auth with saved programs dashboard. Phase 3 added kindergarten path preview, deadline tracker with email reminders, programmatic SEO pages, data freshness UI, and a comprehensive WCAG AA accessibility pass across 17 files. An editorial UI refresh followed Phase 3.

**The repo was made PUBLIC on 2026-03-23** as part of an application to The San Francisco Standard's open call for tinkerers/hackers/community leaders. A professional README, MIT license, hero screenshot, Privacy Policy page, Terms of Service page, dynamic OG images, and GitHub topics were added. Internal dev artifacts were moved to `docs/dev/`.

**Unified roadmap** (`ROADMAP.md`) is complete. V2 Phase 2 data validation/trust, Phase 3 elementary expansion, Phase 4 education content, and Phase 5 planning work are complete: quality status columns/reporting, limited-information trust UI, canonical `grade_levels`, SFUSD elementary import, CDE private/charter import, elementary scoring, durable child profiles, grade filtering, elementary SEO pages, static guides, intake education callouts, search/profile education tooltips, privacy-preserving cost bands, ELFA metadata, shared estimated-family-cost surfaces, derived saved-program application strategy buckets, and the household planning workspace. The next session should decide whether to archive this roadmap or define the next one.

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
    (marketing)/guides/       # Parent education guide index + static guide pages
    (onboarding)/intake/      # Multi-step intake wizard
    (app)/search/             # Map + list results
    (app)/programs/[slug]/    # Program profiles
    (app)/compare/            # Side-by-side comparison
    (app)/dashboard/          # Household planning workspace
    api/                      # Route handlers (search, cron, saved-programs, etc.)
    opengraph-image.tsx       # Dynamic root OG image (Satori)
  components/
    intake/ map/ programs/ compare/ dashboard/ ui/ layout/ auth/
  lib/
    db/queries/ db/rpc/       # Supabase query functions
    supabase/                 # Three client pattern: server.ts, admin.ts, public.ts
    geo/                      # Geocoding, distance
    scoring/                  # Match scoring algorithm (11 tests)
    cost/                     # Subsidy-aware cost estimate logic
    planning/                 # Application strategy + household planning logic
    notifications/            # Resend email + HMAC unsubscribe tokens
    dates/                    # Timezone-safe date-only helpers
    guides/                   # Static parent guide registry
    content/                  # Shared parent education and tooltip copy
    seo/                      # SEO page configs + queries
    validation/               # Zod schemas
    url/                      # External URL display normalization
  types/
    domain.ts api.ts db.ts

pipeline/
  src/pipeline/
    extract/                  # ccl.py, sfusd.py, websites.py
    transform/                # normalize, enrichment, completeness scoring
    load/                     # upsert to Supabase on stable keys
    quality/                  # freshness, schema validation, diff reports
    enrich/                   # Top 50 program enrichment + ELFA participation helpers
  configs/                    # source_mappings.yaml, enums.yaml
  tests/                      # 98 pipeline tests

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

- **Phase 4 — Education Content** — Static parent guides at `/guides` and `/guides/[slug]` for school timeline, early-start planning, SFUSD enrollment, and choosing elementary schools. Guides use a shared registry with SEO metadata, static params, sitemap entries, navigation links, and official source links for deadline-sensitive content. Intake now has collapsed, keyboard-toggleable "Why we ask" callouts on all five steps. Search/profile education copy is centralized in `src/lib/content/education.ts` and appears in keyboard-accessible ARIA-described tooltips for match tiers, grade labels, K-path, attendance areas, subsidy notes, and profile completeness.

- **Phase 5 — V2-F014 Subsidy-Aware Net Cost Planner** — Broad household cost estimate bands are stored on `families.cost_estimate_band`; exact income is not stored. `program_costs` now supports ELFA participation/source/verification metadata. Shared cost-estimate logic models sticker price, SFUSD free programs, ELFA free tuition, full credit, half credit effective July 1, 2026, unknown data, confidence labels, caveats, and official DEC links. Estimates appear on search cards, compare views, program profiles, saved programs, and dashboard cost planning. Pipeline includes conservative ELFA license matching via `pipeline elfa-mark`.

- **Phase 5 — V2-F015 Application Strategy Planner** — Dashboard now derives Reach / Likely / Fallback planning roles from saved programs using match score, estimated family cost, deadline timing, public-program signals, and data confidence. The strategy panel shows grouped recommendations, planning gaps, next actions, checklist items, and explicit no-guarantee caveats. No strategy state is persisted.

- **Phase 5 — V2-F016 Household Planning Workspace** — Dashboard now organizes saved programs into a household planning workspace with active/backup/inactive roles, per-child scoping, tour/application/follow-up task states, per-child plan sections, active cost-span summaries, local compare shortlist controls, and concise household summary copy. Planning fields live on RLS-protected `saved_programs`; compare remains local-first.

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
- **Completed roadmap:** `ROADMAP.md` holds the completed unified roadmap with 16 V2-era features (`V2-F001` through `V2-F016`).
- **Phase 2 (Data Validation & Trust):** Complete. URL/link validation, address verification, missing-data flagging, quality report generation, and limited-information trust UI are implemented.
- **Phase 3 (Elementary Expansion):** Complete. Program type expansion, canonical `grade_levels`, SFUSD elementary import, CDE private/charter import, elementary scoring, child profile management, grade filtering, and elementary SEO pages are implemented.
- **Phase 4 (Education Content):** Complete. `V2-F011` static guide pages, `V2-F012` contextual intake education, and `V2-F013` search/profile education are implemented and marked pass.
- **Phase 5 (Planning & Decision Support):** Complete. `V2-F014`, `V2-F015`, and `V2-F016` are implemented and marked pass.

### Not Started
- **Next roadmap:** Not defined yet; decide whether to archive this roadmap or create the next active roadmap.
- **Launch hardening:** Beta testing (20-30 parents), data QA, Sentry/PostHog setup, and final launch prep.

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
22. **V2-F014 financial privacy model** — store only broad cost estimate bands, never exact household income; link to official DEC/ELFA flows rather than determining eligibility
23. **V2-F015 strategy privacy model** — derive Reach / Likely / Fallback roles from saved programs at render time; persist no strategy state and frame output as planning support only
24. **V2-F016 plan state model** — persist only lightweight planning state on `saved_programs` (`plan_role`, `plan_child_ids`, `plan_tasks`); no public share links or exact financial details

---

## Planning Artifacts

| File | Purpose |
|------|---------|
| `docs/SPEC.md` | Product specification (formerly `Schools.md`) |
| `ROADMAP.md` | Completed unified roadmap — 5 phases, 16 current features |
| `V2_ROADMAP.md` | Replaced by `ROADMAP.md`; retained only if needed for historical context |
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

**P3: Beta & Launch**
- F023: Beta testing with 20-30 SF parents
- F024: Data QA & verification
- Custom domain on Vercel

**P4: V2 Feature Work (Phase 5)**
See `ROADMAP.md`. Phase 5 is complete through `V2-F016`; the next session should decide whether to archive this roadmap or define the next active roadmap.

**External:**
- Applied to The SF Standard's open call (2026-03-23). Received positive response from Griffin — phone call to discuss collaboration pending.

---

## Cross-Surface Notes

- **Repo is PUBLIC** at https://github.com/matthewod11-stack/sf-school-navigator — all commits visible. Be mindful of what goes into commit messages.
- **Live app** at https://sf-school-navigator.vercel.app — deployed via Vercel, auto-deploys on push to main.
- **Local dev setup**: `npm install` + `vercel link` + `vercel env pull .env.local` + `npm run dev`. Dev server runs on :3000 (or :3001 if occupied). Typecheck: `npm run typecheck`. Frontend tests: `npm test -- --run` (66 passing). Pipeline tests: `pipeline/.venv/bin/python -m pytest -q` (98 passing).
- **Spec review files** are in `~/.claude/reviews/reviews-2026-02-10-1546/` — individual feedback from Claude, Codex, Gemini plus consolidated feedback and Gemini validation
- **Git repo** has full commit history through Phase 3 + public showcase session (33 commits total)
- **V1 complete (Phases 0–3) + editorial UI refresh** — 100+ files. Frontend: 30+ components, 20+ route/page files, 10+ API routes, editorial design system (Libre Baskerville + Source Sans 3, warm palette). Pipeline: full Python package with CLI + enrichment + deadlines modules. 64 pipeline tests, 9 frontend tests.
- **Unified roadmap complete** — `ROADMAP.md` tracks completed work through `V2-F016`. `docs/dev/features.json` mirrors feature status; next work needs a new or archived roadmap decision.
- **SFUSD data timing:** The 2026-27 TK feeder maps may not be published yet. Build the system to handle "pending" state where K-path data is unavailable
- **Next.js 16 deprecation:** `middleware.ts` should be renamed to `proxy.ts`. Build warns but still works.
- **SF Standard opportunity:** Griffin responded positively 2026-03-23. Phone call to discuss collaboration is pending.

---

*This file is the single source of truth for external Claude sessions. Update it at the end of any session with meaningful changes.*
