# V2 Unified Roadmap — Design Spec

> **Date:** 2026-03-29
> **Status:** Approved
> **Scope:** Consolidate V1 leftovers + V2 features into a single, driveable roadmap. Clean up project docs.
> **Context:** V1 (Phases 0-3, 22 features) is complete and live at sf-school-navigator.vercel.app. The site is public, shared with The SF Standard. Phase 4 (beta/launch prep) was never started as a formal phase. The V2 roadmap (written 2026-02-12) has 13 features across 3 phases, all not-started. Documentation has drifted — 10 markdown files, 2,400+ lines, multiple overlapping context docs.

---

## What This Spec Covers

1. **Unified 4-phase roadmap** — absorbs open V1 work (map redesign, profile polish) and all V2 features into one sequenced plan
2. **Documentation cleanup** — archive V1 artifacts, consolidate to root, trim resolved issues
3. **Map view redesign** — replace broken flex layout with Full Map + Side Panel pattern
4. **Elimination of V2-G0 gate** — the site is live; monitoring/analytics are "when needed," not blockers

## What This Spec Does NOT Cover

- Implementation details for individual features (those live in the roadmap itself)
- Specific code changes (that's the implementation plan)
- Timeline estimates

---

## Decisions

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

### F026: Search Map Redesign

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

**Agent scope:** B (Frontend)

### F027: Program Profile Polish

**Scope:** Fix specific known issues, not a full page redesign.

- Fix spacing/padding inconsistencies across all sections
- Replace "Map preview unavailable" with static Mapbox image (Mapbox Static Images API with program coordinates)
- Anchor Save/Compare/Report buttons — either sticky header bar or inline with program title (not floating right)
- Make section cards (Location, Key Details, About, Schedule) span full content width
- Fix incorrect website links where present

**Agent scope:** B (Frontend)

### F028: Documentation Cleanup

**File operations:**

| Current Location | Action | New Location |
|-----------------|--------|-------------|
| `ROADMAP.md` (640 lines, V1) | Archive | `docs/dev/V1_ROADMAP.md` |
| `V2_ROADMAP.md` | Rewrite as unified roadmap | `ROADMAP.md` |
| `KNOWN_ISSUES.md` | Strip resolved items | Keep at root (open items + parking lot only) |
| Resolved known issues | Archive | `docs/dev/V1_KNOWN_ISSUES.md` |
| `PROJECT_STATE.md` (root, 35 lines) | Delete | — |
| `docs/dev/PROJECT_STATE.md` | Move + update | `PROJECT_STATE.md` (root) |
| `docs/dev/PROGRESS.md` | Move + add catch-up entry | `PROGRESS.md` (root) |
| `docs/dev/PROGRESS_ARCHIVE.md` | Keep as-is | `docs/dev/PROGRESS_ARCHIVE.md` |
| `docs/dev/AGENT_BOUNDARIES.md` | Update for new phases | Keep in `docs/dev/` |
| `docs/dev/features.json` | Update phase numbers + add F026-F028 | Keep in `docs/dev/` |
| `docs/SPEC.md` | Keep as-is (reference) | `docs/SPEC.md` |
| `CLAUDE.md` | Update file path references | Keep at root |

**Agent scope:** Lead/shared

---

## Phase 2: Data Validation

**Prerequisite:** Restore pipeline Python venv (`pipeline/.venv`) before starting this phase.

### V2-F001: URL/Link Validation
- New command: `pipeline validate urls [--dry-run] [--fix]`
- Async httpx HEAD requests (fallback GET) across all program URLs
- Classify: valid (2xx), redirect (3xx, store final URL), broken (4xx/5xx), timeout, DNS failure
- DB migration: `url_validation_status`, `url_validation_checked_at`, `url_final_url` on `programs`
- `--fix` nullifies confirmed-broken URLs with provenance record
- Tests: mock HTTP responses for each classification
- **Size:** Medium | **Agent:** A

### V2-F002: Address Verification
- New command: `pipeline validate addresses [--dry-run] [--fix]`
- Re-geocode all program addresses via Mapbox forward geocoding
- Flag relevance scores < 0.8, coordinates outside SF bounding box (37.7-37.85°N, 122.35-122.52°W)
- Flag mismatches > 500m between stored and re-geocoded coordinates
- DB migration: `address_validation_status`, `address_validation_checked_at`, `address_mismatch_meters`, `address_relevance_score` on `programs`
- `--fix` updates coordinates for high-confidence corrections
- Tests: mock geocoding responses, boundary checks
- **Size:** Medium | **Agent:** A

### V2-F003: Missing Data Flagging
- Enhance `pipeline quality check` with completeness tiers:
  - Skeletal (< 30%): license + name only
  - Basic (30-49%): has address but missing schedule, cost, etc.
  - Adequate (50-79%): functional listing with gaps
  - Complete (80%+): full profile
- DB migration: `data_quality_tier`, `data_quality_tier_checked_at` on `programs`
- Frontend: "Limited information" banner on skeletal/basic program cards and profiles
- Generate prioritized enrichment candidate list (basic programs in high-demand neighborhoods)
- Tests: tier classification, banner rendering
- **Size:** Small | **Agent:** Shared (A writes tiers, B renders banners)

### V2-F004: Combined Quality Dashboard
- Unified `pipeline quality check` runs all validators
- JSON report at `pipeline/data/quality-report.json`
- Summary: total programs, per-tier counts, broken URLs, address issues, stale records
- Exit codes: 0 = clean, 1 = warnings, 2 = errors
- Depends on V2-F001, V2-F002, V2-F003
- **Size:** Small | **Agent:** A

**Phase 2 dependency chain:**
```
V2-F001 + V2-F002 + V2-F003 (parallel) ──→ V2-F004
```

---

## Phase 3: Elementary Expansion

### V2-F005: Program Type Enum Expansion
- Add DB enum values: `sfusd-elementary`, `private-elementary`, `charter-elementary`
- Add `grade_levels text[]` column with GIN index
- Canonical values: `prek`, `tk`, `k`, `1`, `2`, `3`, `4`, `5` (finalize taxonomy during implementation)
- Backfill existing preschool rows
- Update TypeScript types in `src/types/domain.ts`
- Update display labels in UI (program cards, filter sidebar, profiles)
- **Size:** Small | **Agent:** Lead (shared DB + types + UI)

### V2-F006: SFUSD Elementary Import
- Extend DataSF extractor for ~76 SFUSD elementary schools
- Same API endpoint (`7e7j-59qk`), same upsert pattern (SFUSD school ID)
- Map each school to attendance area
- Populate `linked_elementary_school_ids` on attendance areas
- Set `primary_type = 'sfusd-elementary'`, populate `grade_levels`
- Compute completeness, store provenance
- **Size:** Medium | **Agent:** A | **Depends on:** V2-F005

### V2-F007: CDE Private/Charter Import
- New extractor for CDE Private School Directory
- Target: ~50 private/charter K-5 schools in SF
- Use CDE school code as upsert key
- Cross-reference CCL license numbers to avoid duplicates
- **Pre-validation:** Validate CDE data source availability before committing (fallback: NCES)
- Set `primary_type` to `private-elementary` or `charter-elementary`
- Normalize grade spans into canonical `grade_levels`
- **Size:** Large | **Agent:** A | **Depends on:** V2-F005

### V2-F008: Scoring Adaptation
- Branch scoring by program type group (preschool vs elementary)
- Elementary changes:
  - Disable potty training hard filter
  - Add attendance area match boost
  - Add K-path connection boost
  - Adjust age filters for 5-11
- `gradeTarget` + `program.grade_levels` as primary eligibility filter
- Existing PreK/TK scoring unchanged
- Type-branching only — no per-child scoring logic
- **Size:** Medium | **Agent:** B | **Depends on:** V2-F005

### V2-F009: Child Profile Management
- Add `children` JSONB array on `families`: `{ id, label, ageMonths, expectedDueDate, pottyTrained, gradeTarget }`
- Backfill migration from single-child fields (`child_age_months`, etc.)
- Profile selector in app header (dropdown): active child, "Add another child," switch
- Each child = separate intake flow; search scoped to active child
- Privacy: persist `ageMonths` only, never exact DOB
- Manage profiles: edit label, remove child
- Single-child families see no UX change
- **Size:** Medium | **Agent:** B | **Depends on:** V2-F006, V2-F007, V2-F008

### V2-F010: Elementary Filter/SEO Pages
- Grade-level filter in search sidebar
- Filter against canonical `programs.grade_levels` (not label inference)
- New SEO pages:
  - `/schools/[neighborhood]-elementary-schools`
  - `/schools/sfusd-elementary-schools`
  - `/schools/private-elementary-sf`
  - `/schools/charter-schools-sf`
- Add to `generateStaticParams` and sitemap
- Update homepage copy for elementary coverage
- **Size:** Medium | **Agent:** B | **Depends on:** V2-F005, F006, F007, F009

**Phase 3 dependency chain:**
```
V2-F005 ──→ V2-F006 + V2-F007 + V2-F008 (parallel)
                     └──→ V2-F009 ──→ V2-F010
```

---

## Phase 4: Education Content

### V2-F011: Static Guide Pages
- New route: `/guides/[slug]` (React components; MDX decision deferred)
- 4 initial guides:
  - `sf-school-timeline` — Key dates and deadlines
  - `why-start-early` — Why early childhood education matters
  - `sfusd-enrollment-explained` — How SFUSD enrollment works
  - `choosing-elementary` — How to evaluate and choose an elementary school
- SEO metadata per guide, internal links to tool features
- Guide index at `/guides`
- Add to sitemap and navigation
- **Size:** Medium | **Agent:** B

### V2-F012: Contextual Intake Education
- Collapsible "Why we ask" callouts on each intake wizard step
- Links to relevant guide pages
- Warm, supportive tone (anxiety-reducing)
- Collapsed by default, keyboard toggle, ARIA expanded state
- **Size:** Medium | **Agent:** B | **Depends on:** V2-F011

### V2-F013: Search/Profile Education
- Tooltips on match tier badges, attendance area labels, subsidy notes
- Centralized content strings in `src/lib/content/education.ts`
- Keyboard-accessible tooltips (ARIA-described)
- Independent of F011 — can be built in parallel
- **Size:** Small | **Agent:** B

**Phase 4 dependency chain:**
```
V2-F011 ──→ V2-F012
V2-F013 (independent)
```

---

## Pre-Validation Checklist (Carried Forward)

- [ ] Validate CDE Private School Directory availability and format (before V2-F007)
- [ ] Approve canonical `grade_levels` taxonomy (before V2-F005 migration)
- [ ] Choose guide content format: MDX vs React (before V2-F011; default: React)

---

## Feature Summary

| ID | Feature | Phase | Size | Agent | Depends On | Status |
|----|---------|-------|------|-------|------------|--------|
| F026 | Search Map Redesign | 1 | Large | B | — | not-started |
| F027 | Program Profile Polish | 1 | Small | B | — | not-started |
| F028 | Documentation Cleanup | 1 | Small | Lead | — | not-started |
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

## Doc Cleanup Summary

**After F028 is complete, the repo docs will be:**

Root (active, used daily):
- `ROADMAP.md` — single unified roadmap (this plan)
- `PROGRESS.md` — session log
- `PROJECT_STATE.md` — cross-surface context
- `KNOWN_ISSUES.md` — open issues + V2 parking lot only
- `CLAUDE.md` — Claude Code context
- `README.md` — public-facing
- `PRIVACY.md` — privacy architecture

docs/dev/ (reference, rarely touched):
- `V1_ROADMAP.md` — archived V1 roadmap
- `V1_KNOWN_ISSUES.md` — archived resolved issues
- `PROGRESS_ARCHIVE.md` — older session history
- `AGENT_BOUNDARIES.md` — agent A/B scope (updated)
- `features.json` — machine-readable status (updated)

docs/ (reference):
- `SPEC.md` — original MVP spec
