# V2 ROADMAP — SF School Navigator

> **Predecessor:** ROADMAP.md (V1 — Phases 0-3, 22 features shipped)
> **Scope:** Data validation, elementary school expansion, parent education
> **Versioning:** V1 = Phases 0-3 (done). V2 = Phases 5-7 (this document). Phase 4 = polish/launch (applies to whole product).
> **Status:** VALIDATED — Ready for parallel execution
> **Validated:** 2026-02-12
> **Validation:** In-session analysis (dependency chain, pre-validation, scope review)

---

## Problem Statement

V1 covers PreK/TK only. Live testing with family and friends reveals three gaps:

1. **Data trust** — Broken links, stale addresses, and thin listings are the #1 trust-killer.
2. **Coverage** — Parents researching schools need elementary (K-5) coverage too.
3. **Education** — First-time parents need help understanding WHY this process matters and how to navigate it.

## V2 Delivers

1. **Data you can trust** — Automated validation pipeline (URL checks, address verification, missing data flagging)
2. **Elementary school coverage** — Full K-5 landscape (~120 additional schools)
3. **Education that reduces anxiety** — Guides + contextual help throughout the tool

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Private school data source | TBD: CDE Private School Directory vs NCES vs GreatSchools API | Needs validation before committing to V2-F007 |
| Multi-child data model | Sequential child profiles with JSONB array on `families` | Each child = separate intake flow; profile switcher in UI; 1-4 children, low cardinality favors JSONB |
| Guide content format | TBD: MDX with next-mdx-remote vs plain React components | Decide during V2-F011 |
| Quality issues storage | Hybrid: DB columns on `programs` + JSON summary report | Frontend needs per-program quality data for banners; CI needs aggregate report |
| DataSF elementary data | Confirmed: 76 SFUSD elementary schools via same API | Same endpoint (`7e7j-59qk`), same `cds_code` key pattern as existing SFUSD import |
| F008 scoring scope | Type-branching only; no per-child logic | Per-child scoring is unnecessary — each child profile runs through scoring independently |

---

## Dependency Chain

```
Phase 5 (parallel):  F001 + F002 + F003 ──> F004
Phase 6 (sequential foundation): F005 ──> F006 + F007 + F008 (parallel) ──> F009 ──> F010
Phase 7 (parallel with 5/6): F011 ──> F012, F013 (independent)
```

---

## Phase 5: Data Validation Pipeline

**Purpose:** Trust is the foundation — fix data quality before adding more data.

### V2-F001: URL/Link Validation

- [ ] New pipeline command: `pipeline validate urls [--dry-run] [--fix]`
- [ ] HTTP-check all program `website` URLs (HEAD request with fallback to GET)
- [ ] Async httpx for speed across 500+ URLs (configurable concurrency)
- [ ] Classify results: valid (2xx), redirect (3xx — store final URL), broken (4xx/5xx), timeout, DNS failure
- [ ] Flag broken/timeout links in quality report
- [ ] `--fix` mode: nullify confirmed-broken URLs (with provenance record)
- [ ] Store validation results with timestamp for freshness tracking
- [ ] Tests: mock HTTP responses for each classification
- **Size:** Medium
- **Acceptance:** Command checks all program URLs. Broken links flagged in report. `--fix` nullifies broken URLs with provenance trail. Async execution completes 500+ URLs in <60s.
- **Verification:** `pipeline validate urls --dry-run` reports URL status breakdown. Intentionally insert a broken URL → verify it's flagged.

### V2-F002: Address Verification

- [ ] New pipeline command: `pipeline validate addresses [--dry-run] [--fix]`
- [ ] Re-geocode all program addresses via Mapbox forward geocoding
- [ ] Check Mapbox relevance scores (flag if < 0.8)
- [ ] Verify coordinates fall within SF bounding box (37.7-37.85°N, 122.35-122.52°W)
- [ ] Flag mismatches > 500m between stored and re-geocoded coordinates
- [ ] `--fix` mode: update coordinates for high-confidence corrections
- [ ] Store verification results with timestamp
- [ ] Tests: mock geocoding responses, boundary checks
- **Size:** Medium
- **Acceptance:** Command re-verifies all program addresses. Low-relevance and out-of-bounds results flagged. Coordinate mismatches > 500m surfaced in report.
- **Verification:** `pipeline validate addresses --dry-run` reports address quality breakdown. Intentionally corrupt an address → verify it's flagged.

### V2-F003: Missing Data Flagging

- [ ] Enhance `pipeline quality check` schema validation to categorize programs:
  - **Skeletal** (< 30% completeness): license + name only, missing most fields
  - **Basic** (30-49% completeness): has address/coordinates but missing schedule, cost, etc.
  - **Adequate** (50-79%): functional listing but gaps
  - **Complete** (80%+): full profile
- [ ] Generate prioritized enrichment candidate list (basic programs in high-demand neighborhoods first)
- [ ] Surface "Limited information" banner in program cards and profiles for skeletal/basic programs
- [ ] Add `data_quality_tier` column to `programs` table (computed by pipeline, queryable by frontend)
- [ ] Frontend: conditional banner component on program card and profile page
- **Cross-boundary:** Pipeline (Agent A) computes tiers and writes DB column. Frontend (Agent B) reads column and renders banner. Team lead coordinates the DB migration.
- [ ] Tests: completeness tier classification, banner rendering
- **Size:** Small
- **Acceptance:** Programs categorized into quality tiers. Enrichment candidate list generated. "Limited information" banners show on skeletal/basic programs in UI.
- **Verification:** Query programs by tier. Verify banner appears on a known skeletal program. Verify no banner on a complete program.

### V2-F004: Combined Quality Dashboard

- [ ] Unified `pipeline quality check` command that runs all validation checks:
  - Existing: schema validation, freshness, diff report
  - New: URL validation results, address verification results, completeness tiers
- [ ] Produce combined JSON report at `pipeline/data/quality-report.json`
- [ ] Summary statistics: total programs, per-tier counts, broken URLs, address issues, stale records
- [ ] Exit code for CI integration: 0 = clean, 1 = warnings, 2 = errors
- [ ] Human-readable console output with color-coded severity
- [ ] Tests: report generation, exit code logic
- **Storage approach:** Hybrid — per-program quality fields (`data_quality_tier`, `url_validation_status`, `address_validation_status`) stored as DB columns on `programs` table (queryable by frontend for UI banners). JSON report at `pipeline/data/quality-report.json` provides aggregate summary for CI and human review.
- **Size:** Small
- **Depends on:** V2-F001, V2-F002, V2-F003
- **Acceptance:** Single command produces unified quality report. Exit code reflects severity. Console output is scannable. JSON report is machine-parseable. Per-program quality columns updated in DB.
- **Verification:** `pipeline quality check` produces report with all sections. Introduce a broken URL + bad address → verify exit code = 2. Query `SELECT data_quality_tier, COUNT(*) FROM programs GROUP BY 1;` → verify tier distribution.

---

## Phase 6: Elementary School Expansion

**Purpose:** Double the tool's utility by covering K-5.

### V2-F005: Program Type Enum Expansion

- [ ] Add DB enum values: `sfusd-elementary`, `private-elementary`, `charter-elementary`
- [ ] Update TypeScript types in `src/types/domain.ts`
- [ ] Update display labels in UI components (program cards, filter sidebar, profile pages)
- [ ] Add elementary types to filter sidebar checkboxes
- [ ] Update scoring config to recognize new types
- [ ] Migration script for DB enum extension
- [ ] Tests: type compilation, filter inclusion
- **Size:** Small
- **Acceptance:** New enum values in DB and TypeScript. Filter sidebar shows elementary options. No regressions in existing PreK/TK flows.
- **Verification:** `npm run typecheck` passes. Filter sidebar renders new options. Existing programs unaffected.

### V2-F006: SFUSD Elementary Import

- [ ] Extend existing DataSF extractor to capture SFUSD public elementary schools
- [ ] Target: ~70 SFUSD elementary schools
- [ ] Use SFUSD school ID as stable upsert key (consistent with existing F006 pattern)
- [ ] Map each school to its attendance area (reuse existing `attendance_areas` data)
- [ ] Populate `linked_elementary_school_ids` field on attendance areas (currently unused)
- [ ] Set `primary_type = 'sfusd-elementary'`
- [ ] Compute completeness scores
- [ ] Store provenance records
- [ ] Tests: extraction, transformation, attendance area linkage
- **Size:** Medium
- **Depends on:** V2-F005
- **Pre-validation:** Confirm DataSF API returns elementary school data before committing
- **Acceptance:** ~70 SFUSD elementary schools loaded. Each linked to attendance area. `linked_elementary_school_ids` populated. Completeness scores calculated.
- **Verification:** `SELECT COUNT(*) FROM programs WHERE primary_type = 'sfusd-elementary';` returns ~70. Spot-check 5 schools for correct attendance area linkage.

### V2-F007: CDE Private/Charter Import

- [ ] New extractor for CDE Private School Directory data
- [ ] New extractor for charter school data (CDE or separate source)
- [ ] Target: ~50 private/charter K-5 schools in SF
- [ ] Use CDE school code as stable upsert key
- [ ] Cross-reference with CCL license numbers to avoid duplicates (some private schools have both)
- [ ] Set `primary_type` to `private-elementary` or `charter-elementary`
- [ ] Geocode addresses, compute completeness, store provenance
- [ ] Tests: extraction, deduplication logic, type classification
- **Size:** Large
- **Depends on:** V2-F005
- **Pre-validation:** Validate CDE data source availability and format before committing
- **Acceptance:** ~50 private/charter elementary schools loaded. No duplicates with existing CCL records. Each has correct type, coordinates, and completeness score.
- **Verification:** `SELECT COUNT(*) FROM programs WHERE primary_type IN ('private-elementary', 'charter-elementary');` returns ~50. Cross-check: no programs with both CCL license and CDE code pointing to different records.

### V2-F008: Scoring Adaptation

- [ ] Branch scoring logic by program type group (preschool vs elementary)
- [ ] Elementary scoring changes:
  - Disable potty training hard filter
  - Add attendance area match boost (child's home area matches school's area)
  - Add K-path connection boost (PreK program feeds into this elementary)
  - Adjust age filters for elementary age range (5-11)
- [ ] Maintain existing PreK/TK scoring unchanged
- [ ] New test cases for elementary scoring scenarios
- [ ] Update scoring documentation
- **Scope note:** Type-branching only. No per-child scoring logic — each child profile runs through the scoring engine independently via F009's profile switcher. This keeps F008 focused and verifiable.
- **Size:** Medium
- **Depends on:** V2-F005
- **Acceptance:** Elementary programs scored correctly with type-appropriate filters and boosts. PreK/TK scoring unchanged. All existing tests pass. New elementary test cases pass.
- **Verification:** `npm test -- scoring` passes with new + existing tests. Score an elementary program → verify no potty training filter applied.

### V2-F009: Child Profile Management

- [ ] Add `children` JSONB array column to `families` table
  - Each entry: `{ id, label, dob, expectedDueDate, pottyTrained, gradeTarget }`
  - Migration script for new column
- [ ] Profile selector in app header/nav (dropdown or tabs)
  - Shows active child name/label
  - "Add another child" option opens intake wizard for new profile
  - Switch between children re-runs search with that child's criteria
- [ ] Existing intake wizard runs unchanged — once per child
  - On completion, child profile is appended to `children` array
  - First child = current V1 flow (no UX change for single-child families)
- [ ] Update family persistence and LocalStorage schema for multi-profile
- [ ] Each child profile stores its own intake state independently
- [ ] Search results scoped to active child's age/preferences (not combined)
- [ ] Manage profiles: edit label, remove child profile
- [ ] Tests: profile creation, switching, persistence, search scoping
- **Design principle:** Sequential entries, not simultaneous. Each child is a separate intake flow. The scoring engine runs independently per profile — no per-child annotations or combined result sets.
- **Size:** Medium
- **Depends on:** V2-F006, V2-F007, V2-F008
- **Acceptance:** Families can add 1-4 child profiles. Profile switcher changes active context. Search results reflect active child's criteria. Single-child families see no UX change.
- **Verification:** Complete intake for Child 1 (PreK age). Add Child 2 (elementary age). Switch profiles → verify search results change to match active child's age range. Remove Child 2 → verify single-child state restored.

### V2-F010: Elementary Filter/SEO Pages

- [ ] Grade-level filter in search sidebar (PreK, TK, K, 1st-5th)
- [ ] Filter interacts correctly with multi-child results
- [ ] New SEO pages:
  - `/schools/[neighborhood]-elementary-schools`
  - `/schools/sfusd-elementary-schools`
  - `/schools/private-elementary-sf`
  - `/schools/charter-schools-sf`
- [ ] Add new pages to `generateStaticParams` and sitemap
- [ ] Update homepage value prop to mention elementary coverage
- [ ] Tests: filter behavior, SEO page rendering
- **Size:** Medium
- **Depends on:** V2-F009
- **Acceptance:** Grade-level filter works in search. New SEO pages render with correct programs. Sitemap updated. Homepage copy reflects expanded coverage.
- **Verification:** Apply elementary filter → only elementary programs shown. Visit `/schools/noe-valley-elementary-schools` → correct content rendered. Check sitemap includes new pages.

---

## Phase 7: Education & Content

**Purpose:** Reduce parent anxiety, build trust, drive organic SEO traffic.

### V2-F011: Static Guide Pages

- [ ] New route: `/guides/[slug]` with MDX or React component rendering
- [ ] 4 initial guides:
  - `sf-school-timeline` — Key dates and deadlines for SF school enrollment
  - `why-start-early` — Why early childhood education matters
  - `sfusd-enrollment-explained` — How SFUSD enrollment works (lottery, tiebreakers, attendance areas)
  - `choosing-elementary` — How to evaluate and choose an elementary school
- [ ] Each guide: SEO-optimized title/description, structured content, internal links to relevant tool features
- [ ] Add to sitemap and navigation
- [ ] Guide index page at `/guides`
- [ ] Tests: page rendering, metadata
- **Size:** Medium
- **Acceptance:** 4 guide pages render with SEO metadata. Guide index lists all guides. Pages included in sitemap. Internal links work.
- **Verification:** Visit each guide URL → content renders. View page source → meta tags present. Check sitemap includes guide URLs.

### V2-F012: Contextual Intake Education

- [ ] Collapsible "Why we ask" callouts on each intake wizard step
  - Step 1 (Child info): "Your child's age determines which programs are available..."
  - Step 2 (Location): "Your address determines your SFUSD attendance area..."
  - Step 3 (Budget): "Cost varies widely in SF — we'll filter to your range..."
  - Step 4 (Preferences): "These help us rank programs by what matters to you..."
- [ ] Links to relevant guide pages from each callout
- [ ] Warm, supportive tone (reduce anxiety, not increase it)
- [ ] Collapsed by default, persists open/closed state
- [ ] Accessible: keyboard toggle, ARIA expanded state
- [ ] Tests: callout rendering, toggle behavior, link targets
- **Size:** Medium
- **Depends on:** V2-F011
- **Acceptance:** Each intake step has a "Why we ask" callout. Callouts expand/collapse. Links point to relevant guides. Tone is warm and reassuring.
- **Verification:** Walk through intake → verify callout on each step. Click guide links → correct guide opens. Toggle open/closed → state persists.

### V2-F013: Search/Profile Education

- [ ] Tooltips on match tier badges ("Strong Match means 80%+ of your criteria are met...")
- [ ] Attendance area explanation tooltip on SFUSD programs ("This school is in the [Area Name] attendance area...")
- [ ] Subsidy eligibility notes on relevant programs ("This program accepts SF subsidies...")
- [ ] Centralized content strings in `src/lib/content/education.ts`
- [ ] Accessible tooltips: keyboard-focusable, ARIA-described
- [ ] Tests: tooltip rendering, content string coverage
- **Size:** Small
- **Acceptance:** Match tier badges have explanatory tooltips. SFUSD programs show attendance area explanation. Subsidy notes appear where relevant. All tooltips are keyboard-accessible.
- **Verification:** Hover/focus match tier badge → tooltip appears. Check SFUSD program → attendance area explanation visible. Tab through tooltips → all accessible.

---

## Feature Summary

| ID | Feature | Phase | Size | Depends On | Status |
|----|---------|-------|------|------------|--------|
| V2-F001 | URL/Link Validation | 5 | Medium | — | not-started |
| V2-F002 | Address Verification | 5 | Medium | — | not-started |
| V2-F003 | Missing Data Flagging | 5 | Small | — | not-started |
| V2-F004 | Combined Quality Dashboard | 5 | Small | V2-F001, V2-F002, V2-F003 | not-started |
| V2-F005 | Program Type Enum Expansion | 6 | Small | — | not-started |
| V2-F006 | SFUSD Elementary Import | 6 | Medium | V2-F005 | not-started |
| V2-F007 | CDE Private/Charter Import | 6 | Large | V2-F005 | not-started |
| V2-F008 | Scoring Adaptation | 6 | Medium | V2-F005 | not-started |
| V2-F009 | Child Profile Management | 6 | Medium | V2-F006, V2-F007, V2-F008 | not-started |
| V2-F010 | Elementary Filter/SEO Pages | 6 | Medium | V2-F009 | not-started |
| V2-F011 | Static Guide Pages | 7 | Medium | — | not-started |
| V2-F012 | Contextual Intake Education | 7 | Medium | V2-F011 | not-started |
| V2-F013 | Search/Profile Education | 7 | Small | — | not-started |

---

## Pre-Validation Checklist

Before committing to implementation:

- [x] Confirm DataSF API returns elementary school data (V2-F006) — **CONFIRMED: 76 schools, same API**
- [ ] Validate CDE Private School Directory availability and format (V2-F007) — **Do before Phase 6**
- [x] Evaluate multi-child data model: JSONB vs separate table (V2-F009) — **DECIDED: Sequential profiles, JSONB array**
- [ ] Choose guide content format: MDX vs React components (V2-F011) — Decide during F011
- [x] Decide quality issues storage: DB table vs JSON files (V2-F004) — **DECIDED: Hybrid (DB columns + JSON report)**

---

## Agent Boundaries (Parallel Execution)

### Agent A: Data Pipeline

**Owns:** `pipeline/` — all validation commands, new extractors, quality reporting

**Features:** V2-F001, V2-F002, V2-F003, V2-F004, V2-F006, V2-F007

### Agent B: App Frontend

**Owns:** `src/` — UI changes, new routes, intake refactor, content pages

**Features:** V2-F005 (shared), V2-F008, V2-F009, V2-F010, V2-F011, V2-F012, V2-F013

### Shared (Team Lead Manages)

- V2-F005: Program Type Enum Expansion (DB migration + TypeScript types + UI)
- `types/` — domain types, API types
- Database schema migrations
