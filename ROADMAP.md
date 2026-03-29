# ROADMAP — SF School Navigator

> **Status:** Active
> **Last updated:** 2026-03-29
> **V1 Archive:** [docs/dev/V1_ROADMAP.md](docs/dev/V1_ROADMAP.md)
>
> V1 (Phases 0–3, 22 features) is complete and live at sf-school-navigator.vercel.app.
> This roadmap covers all active and future work — Phases 1–4 (new numbering).

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Roadmap structure | Single unified ROADMAP.md, 4 phases | Eliminates V1/V2 split that caused fragmentation |
| Phase numbering | Fresh 1-4 (not continuing from V1's 0-3) | Clean slate; old phase numbers are historical |
| V2-G0 gate | Eliminated | Site is live and public. Sentry/PostHog/feature flags added when there's traction, not as blockers. |
| Map layout pattern | Full Map + Side Panel (Zillow/Redfin) | Proven pattern. Map gets position:absolute, avoids flex wars with Mapbox GL. Panel is an overlay. |
| Map filters | Toolbar button → modal overlay | Keeps panel focused on results. Filters are set-and-forget. |
| Split view | Remove entirely | Two modes only: List and Map. Simplifies codebase. |
| Profile page | Fix specific issues, not full redesign | Problems are spacing/buttons/map preview, not structural. |
| Agent boundaries | Preserved | May use parallel agents; keep A/B structure updated for new phases. |
| Feature IDs | V2-F001–F013 preserved; new Phase 1 features get F026–F028 | Continuity with existing docs; no renumbering churn. |
| Pre-validation items | Carry forward as-is | CDE data source, guide format, grade taxonomy — decide when building those features. |
| Pipeline venv | Noted as Phase 2 prerequisite | Not currently set up locally; restore before data validation work. |

---

## Phase Structure

```
Phase 1: UX Fix & Polish        → F026, F027, F028
Phase 2: Data Validation         → V2-F001, V2-F002, V2-F003, V2-F004
Phase 3: Elementary Expansion    → V2-F005, V2-F006, V2-F007, V2-F008, V2-F009, V2-F010
Phase 4: Education Content       → V2-F011, V2-F012, V2-F013
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

### [ ] F026: Search Map Redesign

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

### [ ] F027: Program Profile Polish

**Size:** Small | **Agent scope:** B (Frontend)

**Scope:** Fix specific known issues, not a full page redesign.

- Fix spacing/padding inconsistencies across all sections
- Replace "Map preview unavailable" with static Mapbox image (Mapbox Static Images API with program coordinates)
- Anchor Save/Compare/Report buttons — either sticky header bar or inline with program title (not floating right)
- Make section cards (Location, Key Details, About, Schedule) span full content width
- Fix incorrect website links where present

---

## Phase 2: Data Validation

> **Prerequisite:** Restore pipeline Python venv (`pipeline/.venv`) before starting this phase.

### [ ] V2-F001: URL/Link Validation

**Size:** Medium | **Agent:** A

- New command: `pipeline validate urls [--dry-run] [--fix]`
- Async httpx HEAD requests (fallback GET) across all program URLs
- Classify: valid (2xx), redirect (3xx, store final URL), broken (4xx/5xx), timeout, DNS failure
- DB migration: `url_validation_status`, `url_validation_checked_at`, `url_final_url` on `programs`
- `--fix` nullifies confirmed-broken URLs with provenance record
- Tests: mock HTTP responses for each classification

### [ ] V2-F002: Address Verification

**Size:** Medium | **Agent:** A

- New command: `pipeline validate addresses [--dry-run] [--fix]`
- Re-geocode all program addresses via Mapbox forward geocoding
- Flag relevance scores < 0.8, coordinates outside SF bounding box (37.7-37.85°N, 122.35-122.52°W)
- Flag mismatches > 500m between stored and re-geocoded coordinates
- DB migration: `address_validation_status`, `address_validation_checked_at`, `address_mismatch_meters`, `address_relevance_score` on `programs`
- `--fix` updates coordinates for high-confidence corrections
- Tests: mock geocoding responses, boundary checks

### [ ] V2-F003: Missing Data Flagging

**Size:** Small | **Agent:** Shared (A writes tiers, B renders banners)

- Enhance `pipeline quality check` with completeness tiers:
  - Skeletal (< 30%): license + name only
  - Basic (30-49%): has address but missing schedule, cost, etc.
  - Adequate (50-79%): functional listing with gaps
  - Complete (80%+): full profile
- DB migration: `data_quality_tier`, `data_quality_tier_checked_at` on `programs`
- Frontend: "Limited information" banner on skeletal/basic program cards and profiles
- Generate prioritized enrichment candidate list (basic programs in high-demand neighborhoods)
- Tests: tier classification, banner rendering

### [ ] V2-F004: Combined Quality Dashboard

**Size:** Small | **Agent:** A | **Depends on:** V2-F001, V2-F002, V2-F003

- Unified `pipeline quality check` runs all validators
- JSON report at `pipeline/data/quality-report.json`
- Summary: total programs, per-tier counts, broken URLs, address issues, stale records
- Exit codes: 0 = clean, 1 = warnings, 2 = errors

**Phase 2 dependency chain:**
```
V2-F001 + V2-F002 + V2-F003 (parallel) ──→ V2-F004
```

---

## Phase 3: Elementary Expansion

### [ ] V2-F005: Program Type Enum Expansion

**Size:** Small | **Agent:** Lead (shared DB + types + UI)

- Add DB enum values: `sfusd-elementary`, `private-elementary`, `charter-elementary`
- Add `grade_levels text[]` column with GIN index
- Canonical values: `prek`, `tk`, `k`, `1`, `2`, `3`, `4`, `5` (finalize taxonomy during implementation)
- Backfill existing preschool rows
- Update TypeScript types in `src/types/domain.ts`
- Update display labels in UI (program cards, filter sidebar, profiles)

### [ ] V2-F006: SFUSD Elementary Import

**Size:** Medium | **Agent:** A | **Depends on:** V2-F005

- Extend DataSF extractor for ~76 SFUSD elementary schools
- Same API endpoint (`7e7j-59qk`), same upsert pattern (SFUSD school ID)
- Map each school to attendance area
- Populate `linked_elementary_school_ids` on attendance areas
- Set `primary_type = 'sfusd-elementary'`, populate `grade_levels`
- Compute completeness, store provenance

### [ ] V2-F007: CDE Private/Charter Import

**Size:** Large | **Agent:** A | **Depends on:** V2-F005

- New extractor for CDE Private School Directory
- Target: ~50 private/charter K-5 schools in SF
- Use CDE school code as upsert key
- Cross-reference CCL license numbers to avoid duplicates
- **Pre-validation:** Validate CDE data source availability before committing (fallback: NCES)
- Set `primary_type` to `private-elementary` or `charter-elementary`
- Normalize grade spans into canonical `grade_levels`

### [ ] V2-F008: Scoring Adaptation

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

### [ ] V2-F009: Child Profile Management

**Size:** Medium | **Agent:** B | **Depends on:** V2-F006, V2-F007, V2-F008

- Add `children` JSONB array on `families`: `{ id, label, ageMonths, expectedDueDate, pottyTrained, gradeTarget }`
- Backfill migration from single-child fields (`child_age_months`, etc.)
- Profile selector in app header (dropdown): active child, "Add another child," switch
- Each child = separate intake flow; search scoped to active child
- Privacy: persist `ageMonths` only, never exact DOB
- Manage profiles: edit label, remove child
- Single-child families see no UX change

### [ ] V2-F010: Elementary Filter/SEO Pages

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

## Pre-Validation Checklist

- [ ] Validate CDE Private School Directory availability and format (before V2-F007)
- [ ] Approve canonical `grade_levels` taxonomy (before V2-F005 migration)
- [ ] Choose guide content format: MDX vs React (before V2-F011; default: React)

---

## Feature Summary

| ID | Feature | Phase | Size | Agent | Depends On | Status |
|----|---------|-------|------|-------|------------|--------|
| F026 | Search Map Redesign | 1 | Large | B | — | not-started |
| F027 | Program Profile Polish | 1 | Small | B | — | not-started |
| F028 | Documentation Cleanup | 1 | Small | Lead | — | done |
| V2-F001 | URL/Link Validation | 2 | Medium | A | — | not-started |
| V2-F002 | Address Verification | 2 | Medium | A | — | not-started |
| V2-F003 | Missing Data Flagging | 2 | Small | Shared | — | not-started |
| V2-F004 | Combined Quality Dashboard | 2 | Small | A | V2-F001–F003 | not-started |
| V2-F005 | Program Type Enum Expansion | 3 | Small | Lead | — | not-started |
| V2-F006 | SFUSD Elementary Import | 3 | Medium | A | V2-F005 | not-started |
| V2-F007 | CDE Private/Charter Import | 3 | Large | A | V2-F005 | not-started |
| V2-F008 | Scoring Adaptation | 3 | Medium | B | V2-F005 | not-started |
| V2-F009 | Child Profile Management | 3 | Medium | B | V2-F006–F008 | not-started |
| V2-F010 | Elementary Filter/SEO Pages | 3 | Medium | B | V2-F005–F007, V2-F009 | not-started |
| V2-F011 | Static Guide Pages | 4 | Medium | B | — | not-started |
| V2-F012 | Contextual Intake Education | 4 | Medium | B | V2-F011 | not-started |
| V2-F013 | Search/Profile Education | 4 | Small | B | — | not-started |

---

## Dependency Chains

**Phase 1** — all independent, can run in parallel:
```
F026 (independent)
F027 (independent)
F028 (independent) ✓
```

**Phase 2** — V2-F001, V2-F002, V2-F003 run in parallel, then converge on V2-F004:
```
V2-F001 + V2-F002 + V2-F003 (parallel) ──→ V2-F004
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
