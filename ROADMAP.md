# ROADMAP — SF School Navigator

> **Status:** Active
> **Last updated:** 2026-04-29
> **V1 Archive:** [docs/dev/V1_ROADMAP.md](docs/dev/V1_ROADMAP.md)
>
> V1 (Phases 0–3, 22 features) is complete and live at sf-school-navigator.vercel.app.
> This roadmap covers all active and future work — Phases 1–5 (new numbering).

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Roadmap structure | Single unified ROADMAP.md, 5 phases | Eliminates V1/V2 split while preserving a clear place for new strategic work |
| Phase numbering | Fresh 1-5 (not continuing from V1's 0-3) | Clean slate; old phase numbers are historical |
| V2-G0 gate | Eliminated | Site is live and public. Sentry/PostHog/feature flags added when there's traction, not as blockers. |
| Map layout pattern | Full Map + Side Panel (Zillow/Redfin) | Proven pattern. Map gets position:absolute, avoids flex wars with Mapbox GL. Panel is an overlay. |
| Map filters | Toolbar button → modal overlay | Keeps panel focused on results. Filters are set-and-forget. |
| Split view | Remove entirely | Two modes only: List and Map. Simplifies codebase. |
| Profile page | Fix specific issues, not full redesign | Problems are spacing/buttons/map preview, not structural. |
| Agent boundaries | Preserved | May use parallel agents; keep A/B structure updated for new phases. |
| Feature IDs | V2-F001–F016 preserved; new Phase 1 features get F026–F028 | Continuity with existing docs; no renumbering churn. |
| Pre-validation items | Carry forward and extend | CDE data source, guide format, grade taxonomy, subsidy modeling, and planning taxonomy are all decisions best made immediately before implementation. |
| Pipeline venv | Restored | `pipeline/.venv` is available locally; documented `python -m pipeline` entrypoint works. |
| Strategic direction | Decision support over generic chat | The moat is trusted planning help: real cost, deadlines, tiebreakers, and fallback strategy. |
| Financial planning model | Privacy-preserving estimate bands | Model likely net cost without storing exact household income or rebuilding DEC's official eligibility flow. |
| Grade taxonomy | `prek`, `tk`, `k`, `1`, `2`, `3`, `4`, `5` | Canonical cross-source grade levels for preschool and elementary filtering/scoring. |
| CDE sources | Private XLSX + public School Directory TXT export | Official CDE downloadable files cover private-school affidavit data and active charter directory records. |

---

## Phase Structure

```
Phase 1: UX Fix & Polish        → F026, F027, F028
Phase 2: Data Validation & Trust → V2-F001, V2-F002, V2-F003, V2-F004
Phase 3: Elementary Expansion    → V2-F005, V2-F006, V2-F007, V2-F008, V2-F009, V2-F010
Phase 4: Education Content       → V2-F011, V2-F012, V2-F013
Phase 5: Planning & Decision Support → V2-F014, V2-F015, V2-F016
```

---

## Phase 1: UX Fix & Polish

### [x] F028: Documentation Cleanup

**Agent scope:** Lead/shared

**File operations:**

| Previous Location | Action | Result |
|------------------|--------|--------|
| `ROADMAP.md` (V1, 640 lines) | Archived | `docs/dev/V1_ROADMAP.md` |
| `V2_ROADMAP.md` | Replaced by this file | `ROADMAP.md` |
| `KNOWN_ISSUES.md` | Stripped resolved items | Keep at root (open items + parking lot only) |
| Resolved known issues | Archived | `docs/dev/V1_KNOWN_ISSUES.md` |
| `PROJECT_STATE.md` (root, 35 lines, stale) | Deleted | — |
| `docs/dev/PROJECT_STATE.md` | Moved | `PROJECT_STATE.md` (root) |
| `docs/dev/PROGRESS.md` | Moved + catch-up entry added | `PROGRESS.md` (root) |
| `docs/dev/AGENT_BOUNDARIES.md` | Updated for new phases | Keep in `docs/dev/` |
| `docs/dev/features.json` | Updated phase numbers + added F026-F028 | Keep in `docs/dev/` |
| `CLAUDE.md` | Updated file path references | Keep at root |

---

### [x] F026: Search Map Redesign

**Size:** Large | **Agent scope:** B (Frontend)

**Pattern:** Full Map + Side Panel (Zillow/Redfin)

**Layout:**
- Map gets `position:absolute; inset:0` below the app header — Mapbox container is never a flex child
- Program list in a left panel overlay (~320px width, collapsible)
- Panel is a positioned overlay on top of the map, not a flex sibling

**Panel contents:**
- Search input at top
- Filter button (opens modal overlay with all current filter controls)
- Program count
- Scrollable card list with match tier color bars (Strong=green, Good=blue, Partial=gray)

**Interactions:**
- Pin click → panel scrolls to matching card, highlights it
- Card click/hover → map pans to pin, pin pulses
- Panel collapse button → full map mode
- Panel drag-to-resize (stretch goal, not required)

**Mobile:**
- Panel becomes a bottom sheet (peek/half/full snap points)
- Same card components, different container

**Filters:**
- Toolbar filter button opens a modal overlay with all current filter controls
- Moved from the existing sidebar pattern
- List view keeps its existing sidebar filters unchanged

**Remove:**
- Split view option entirely
- Search has two modes: List and Map

**Technical approach:**
- Map container is a sibling to the panel, not a flex child — this is the root cause fix
- No flex height propagation, no calc() hacks, no min-h-0 workarounds
- Mapbox GL JS initializes on a container with known, stable dimensions

---

### [x] F027: Program Profile Polish

**Size:** Small | **Agent scope:** B (Frontend)

**Scope:** Fix specific known issues, not a full page redesign.

- Fix spacing/padding inconsistencies across all sections
- Replace "Map preview unavailable" with static Mapbox image (Mapbox Static Images API with program coordinates)
- Anchor Save/Compare/Report buttons — either sticky header bar or inline with program title (not floating right)
- Make section cards (Location, Key Details, About, Schedule) span full content width
- Fix incorrect website links where present

---

## Phase 2: Data Validation & Trust

> **Prerequisite:** Restore pipeline Python venv (`pipeline/.venv`) before starting this phase. Satisfied 2026-04-28.

### [x] V2-F001: URL/Link Validation

**Size:** Medium | **Agent:** A

- New command: `pipeline validate urls [--dry-run] [--fix]`
- Async httpx HEAD requests (fallback GET) across all program URLs
- Classify: valid (2xx), redirect (3xx, store final URL), broken (4xx/5xx), timeout, DNS failure
- DB migration: `url_validation_status`, `url_validation_checked_at`, `url_final_url` on `programs`
- `--fix` nullifies confirmed-broken URLs with provenance record
- Tests: mock HTTP responses for each classification

### [x] V2-F002: Address Verification

**Size:** Medium | **Agent:** A

- New command: `pipeline validate addresses [--dry-run] [--fix]`
- Re-geocode all program addresses via Mapbox forward geocoding
- Flag relevance scores < 0.8, coordinates outside SF bounding box (37.7-37.85°N, 122.35-122.52°W)
- Flag mismatches > 500m between stored and re-geocoded coordinates
- DB migration: `address_validation_status`, `address_validation_checked_at`, `address_mismatch_meters`, `address_relevance_score` on `programs`
- `--fix` updates coordinates for high-confidence corrections
- Tests: mock geocoding responses, boundary checks

### [x] V2-F003: Missing Data Flagging

**Size:** Small | **Agent:** Shared (A writes tiers, B renders banners)

- Enhance `pipeline quality check` with completeness tiers:
  - Skeletal (< 30%): license + name only
  - Basic (30-49%): has address but missing schedule, cost, etc.
  - Adequate (50-79%): functional listing with gaps
  - Complete (80%+): full profile
- DB migration: `data_quality_tier`, `data_quality_tier_checked_at` on `programs`
- Frontend: "Limited information" banner on skeletal/basic program cards and profiles
- Frontend: expose quality tier + freshness state as reusable trust metadata for future planner surfaces
- Generate prioritized enrichment candidate list (basic programs in high-demand neighborhoods)
- Tests: tier classification, banner rendering

### [x] V2-F004: Combined Quality Dashboard

**Size:** Small | **Agent:** A | **Depends on:** V2-F001, V2-F002, V2-F003

- Unified `pipeline quality check` runs schema, freshness, tiering, and URL validators; add `--include-address-validation` for Mapbox address checks
- JSON report at `pipeline/data/quality-report.json`
- Summary: total programs, per-tier counts, broken URLs, address issues, stale records
- Publish planner-ready trust fields so downstream features can downrank low-confidence programs without duplicating validation logic
- Exit codes: 0 = clean, 1 = warnings, 2 = errors

**Phase 2 dependency chain:**
```
V2-F001 + V2-F002 + V2-F003 (parallel) ──→ V2-F004
```

---

## Phase 3: Elementary Expansion

### [x] V2-F005: Program Type Enum Expansion

**Size:** Small | **Agent:** Lead (shared DB + types + UI)

- Add DB enum values: `sfusd-elementary`, `private-elementary`, `charter-elementary`
- Add `grade_levels text[]` column with GIN index
- Canonical values: `prek`, `tk`, `k`, `1`, `2`, `3`, `4`, `5` (finalize taxonomy during implementation)
- Backfill existing preschool rows
- Update TypeScript types in `src/types/domain.ts`
- Update display labels in UI (program cards, filter sidebar, profiles)

### [x] V2-F006: SFUSD Elementary Import

**Size:** Medium | **Agent:** A | **Depends on:** V2-F005

- Extend DataSF extractor for ~76 SFUSD elementary schools
- Same API endpoint (`7e7j-59qk`), same upsert pattern (SFUSD school ID)
- Map each school to attendance area
- Populate `linked_elementary_school_ids` on attendance areas
- Set `primary_type = 'sfusd-elementary'`, populate `grade_levels`
- Compute completeness, store provenance

### [x] V2-F007: CDE Private/Charter Import

**Size:** Large | **Agent:** A | **Depends on:** V2-F005

- New extractor for CDE Private School Directory
- Target: ~50 private/charter K-5 schools in SF
- Use CDE school code as upsert key
- Cross-reference CCL license numbers to avoid duplicates
- **Pre-validation:** Validate CDE data source availability before committing (fallback: NCES)
- Set `primary_type` to `private-elementary` or `charter-elementary`
- Normalize grade spans into canonical `grade_levels`

### [x] V2-F008: Scoring Adaptation

**Size:** Medium | **Agent:** B | **Depends on:** V2-F005

- Branch scoring by program type group (preschool vs elementary)
- Elementary changes:
  - Disable potty training hard filter
  - Add attendance area match boost
  - Add K-path connection boost
  - Adjust age filters for 5-11
- `gradeTarget` + `program.grade_levels` as primary eligibility filter
- Existing PreK/TK scoring unchanged
- Type-branching only — no per-child scoring logic

### [x] V2-F009: Child Profile Management

**Size:** Medium | **Agent:** B | **Depends on:** V2-F006, V2-F007, V2-F008

- Add `children` JSONB array on `families`: `{ id, label, ageMonths, expectedDueDate, pottyTrained, gradeTarget }`
- Backfill migration from single-child fields (`child_age_months`, etc.)
- Profile selector in app header (dropdown): active child, "Add another child," switch
- Each child = separate intake flow; search scoped to active child
- Privacy: persist `ageMonths` only, never exact DOB
- Manage profiles: edit label, remove child
- Single-child families see no UX change

**Progress 2026-04-29:**
- Added `families.children` JSONB migration/backfill and intake capture for label + target grade.
- Added app-header active child selector backed by search context.
- Added authenticated `/api/family/children` profile persistence.
- Added dashboard add/edit/remove management for child profiles.
- Active child selection now scopes search and comparison scoring from persisted family rows.
- Single-child families do not see the header child selector.

### [ ] [WIP] V2-F010: Elementary Filter/SEO Pages

**Size:** Medium | **Agent:** B | **Depends on:** V2-F005, V2-F006, V2-F007, V2-F009

- Grade-level filter in search sidebar
- Filter against canonical `programs.grade_levels` (not label inference)
- New SEO pages:
  - `/schools/[neighborhood]-elementary-schools`
  - `/schools/sfusd-elementary-schools`
  - `/schools/private-elementary-sf`
  - `/schools/charter-schools-sf`
- Add to `generateStaticParams` and sitemap
- Update homepage copy for elementary coverage

**Progress 2026-04-29:**
- Grade-level filtering, elementary SEO route configs, sitemap/static params, and homepage copy are implemented.
- Kept WIP until V2-F009 child management is fully closed because this feature depends on that workflow.

**Phase 3 dependency chain:**
```
V2-F005 ──→ V2-F006 + V2-F007 + V2-F008 (parallel)
                     └──→ V2-F009 ──→ V2-F010
```

---

## Phase 4: Education Content

### [ ] V2-F011: Static Guide Pages

**Size:** Medium | **Agent:** B

- New route: `/guides/[slug]` (React components; MDX decision deferred)
- 4 initial guides:
  - `sf-school-timeline` — Key dates and deadlines
  - `why-start-early` — Why early childhood education matters
  - `sfusd-enrollment-explained` — How SFUSD enrollment works
  - `choosing-elementary` — How to evaluate and choose an elementary school
- SEO metadata per guide, internal links to tool features
- Guide index at `/guides`
- Add to sitemap and navigation

### [ ] V2-F012: Contextual Intake Education

**Size:** Medium | **Agent:** B | **Depends on:** V2-F011

- Collapsible "Why we ask" callouts on each intake wizard step
- Links to relevant guide pages
- Warm, supportive tone (anxiety-reducing)
- Collapsed by default, keyboard toggle, ARIA expanded state

### [ ] V2-F013: Search/Profile Education

**Size:** Small | **Agent:** B

- Tooltips on match tier badges, attendance area labels, subsidy notes
- Centralized content strings in `src/lib/content/education.ts`
- Keyboard-accessible tooltips (ARIA-described)
- Independent of F011 — can be built in parallel

**Phase 4 dependency chain:**
```
V2-F011 ──→ V2-F012
V2-F013 (independent)
```

---

## Phase 5: Planning & Decision Support

> **Goal:** Turn the product from a strong discovery tool into a family planning workspace that helps parents answer: what will this likely cost us, which applications should we prioritize, and what should we do next?

### [ ] V2-F014: Subsidy-Aware Net Cost Planner

**Size:** Large | **Agent:** Shared (A models subsidy/cost inputs, B builds planner UI) | **Depends on:** V2-F003, V2-F004, V2-F009

- Add privacy-preserving financial planning inputs:
  - income/affordability bands or subsidy-status bands, not exact income
  - optional "just show sticker price" path for families who do not want cost estimates
- Extend program cost modeling to include:
  - sticker tuition
  - subsidy/tuition-assistance indicators (`accepts_subsidies`, ELFA participation where available, SFUSD free TK/K where applicable)
  - estimated family-paid monthly range
  - confidence/caveat labels when cost data is incomplete
- New planner surfaces on search, compare, saved programs, and dashboard:
  - "Estimated family cost"
  - "Likely free / nearly free / market rate"
  - clear fallback to "Cost unknown" when data is weak
- Link out to official DEC / SFUSD eligibility and application flows rather than duplicating those systems
- Preserve privacy architecture: do not persist exact household income; calculations should be band-based and reversible by the user
- Tests: estimate band logic, missing-data behavior, confidence labels, privacy guardrails

### [ ] V2-F015: Application Strategy Planner

**Size:** Large | **Agent:** B | **Depends on:** V2-F008, V2-F010, V2-F013, V2-F014

- Add a planner workflow that turns saved/search results into a balanced application set
- Recommend strategy buckets with non-guarantee language:
  - reach
  - likely
  - fallback
- Use existing signals to explain recommendations:
  - match score
  - attendance area / feeder / tiebreaker context
  - deadline timing
  - estimated family cost
  - data quality tier / freshness
- Show planning gaps:
  - no affordable fallback
  - too many deadline collisions
  - overreliance on low-confidence listings
  - missing public/TK options nearby
- Add task-oriented outputs:
  - shortlist priorities
  - next actions
  - tour/interview checklist
  - deadline risk alerts
- Keep claims appropriately humble: this is decision support, not an admissions predictor
- Tests: bucket assignment logic, explanation text coverage, deadline conflict detection

### [ ] V2-F016: Household Planning Workspace

**Size:** Medium | **Agent:** B | **Depends on:** V2-F009, V2-F014, V2-F015

- Evolve `/dashboard` from saved-program list into a true household planning workspace
- Per child, unify:
  - saved programs
  - compare shortlist
  - reminder settings
  - estimated cost view
  - application strategy buckets
  - next recommended actions
- Add lightweight plan state for families:
  - which programs are active contenders
  - which are backups
  - what still needs a tour, application, or follow-up
- Preserve the current low-friction saved-program flow; single-child families should still feel simple, not overbuilt
- Design for sharability inside the household:
  - concise summary view that a partner/coparent can understand quickly
  - no sensitive financial detail required beyond the chosen estimate band
- Tests: per-child plan scoping, dashboard aggregation, reminder + planner coexistence

**Phase 5 dependency chain:**
```
V2-F003 + V2-F004 + V2-F009 ──→ V2-F014 ──→ V2-F015 ──→ V2-F016
                    V2-F008 + V2-F010 + V2-F013 ─────────┘
```

---

## Pre-Validation Checklist

- [x] Validate CDE Private School Directory availability and format (before V2-F007)
- [x] Approve canonical `grade_levels` taxonomy (before V2-F005 migration)
- [ ] Choose guide content format: MDX vs React (before V2-F011; default: React)
- [ ] Validate DEC/ELFA data source and field mapping for subsidy participation + tuition assistance metadata (before V2-F014)
- [ ] Choose privacy-safe financial input model: income band vs explicit subsidy-status toggle (before V2-F014; default: income band, no exact income stored)
- [ ] Approve strategy bucket taxonomy and language (before V2-F015; default: reach / likely / fallback with explicit no-guarantee framing)

---

## Feature Summary

| ID | Feature | Phase | Size | Agent | Depends On | Status |
|----|---------|-------|------|-------|------------|--------|
| F026 | Search Map Redesign | 1 | Large | B | — | pass |
| F027 | Program Profile Polish | 1 | Small | B | — | pass |
| F028 | Documentation Cleanup | 1 | Small | Lead | — | done |
| V2-F001 | URL/Link Validation | 2 | Medium | A | — | pass |
| V2-F002 | Address Verification | 2 | Medium | A | — | pass |
| V2-F003 | Missing Data Flagging | 2 | Small | Shared | — | pass |
| V2-F004 | Combined Quality Dashboard | 2 | Small | A | V2-F001–F003 | pass |
| V2-F005 | Program Type Enum Expansion | 3 | Small | Lead | — | pass |
| V2-F006 | SFUSD Elementary Import | 3 | Medium | A | V2-F005 | pass |
| V2-F007 | CDE Private/Charter Import | 3 | Large | A | V2-F005 | pass |
| V2-F008 | Scoring Adaptation | 3 | Medium | B | V2-F005 | pass |
| V2-F009 | Child Profile Management | 3 | Medium | B | V2-F006–F008 | pass |
| V2-F010 | Elementary Filter/SEO Pages | 3 | Medium | B | V2-F005–F007, V2-F009 | wip |
| V2-F011 | Static Guide Pages | 4 | Medium | B | — | not-started |
| V2-F012 | Contextual Intake Education | 4 | Medium | B | V2-F011 | not-started |
| V2-F013 | Search/Profile Education | 4 | Small | B | — | not-started |
| V2-F014 | Subsidy-Aware Net Cost Planner | 5 | Large | Shared | V2-F003, V2-F004, V2-F009 | not-started |
| V2-F015 | Application Strategy Planner | 5 | Large | B | V2-F008, V2-F010, V2-F013, V2-F014 | not-started |
| V2-F016 | Household Planning Workspace | 5 | Medium | B | V2-F009, V2-F014, V2-F015 | not-started |

---

## Dependency Chains

**Phase 1** — all independent, can run in parallel:
```
F026 (independent)
F027 (independent)
F028 (independent) ✓
```

**Phase 2** — complete:
```
V2-F001 + V2-F002 + V2-F003 ──→ V2-F004 ✓
```

**Phase 3** — V2-F005 is a prerequisite gate, then parallel branches converge on V2-F009/F010:
```
V2-F005 ──→ V2-F006 + V2-F007 + V2-F008 (parallel)
                     └──→ V2-F009 ──→ V2-F010
```

**Phase 4** — F011 gates F012; F013 is independent:
```
V2-F011 ──→ V2-F012
V2-F013 (independent)
```

**Phase 5** — trust and child-profile groundwork feed cost planning; strategy and workspace build on top:
```
V2-F003 + V2-F004 + V2-F009 ──→ V2-F014 ──→ V2-F015 ──→ V2-F016
                    V2-F008 + V2-F010 + V2-F013 ─────────┘
```
