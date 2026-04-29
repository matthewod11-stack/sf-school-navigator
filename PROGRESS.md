# Progress Log — SF School Navigator

---

## Session: 2026-04-29 14:54

### Completed
- **Finished Phase 4: Education Content**
  - `V2-F011: Static Guide Pages` — added `/guides` and static `/guides/[slug]` pages for school timeline, early-start planning, SFUSD enrollment, and choosing elementary schools.
  - `V2-F012: Contextual Intake Education` — added collapsed "Why we ask" education callouts to all five intake steps, with keyboard toggles, `aria-expanded`, and links to relevant guides.
  - `V2-F013: Search/Profile Education` — centralized education strings in `src/lib/content/education.ts` and added ARIA-described tooltips for match tiers, grade labels, K-path, attendance areas, subsidy notes, and profile completeness.
- **Wired Phase 4 into discovery surfaces**
  - Added guide metadata/static params, sitemap entries, header/footer navigation, and official source links for deadline-sensitive guide content.
  - Added tests for guide registry, sitemap coverage, intake callout accessibility, and tooltip accessibility.
- **Updated tracking**
  - Marked `V2-F011`, `V2-F012`, and `V2-F013` as pass in `ROADMAP.md` and `docs/dev/features.json`.
  - Updated `README.md` test counts and `PROJECT_STATE.md` so external sessions see Phase 5 as next.

### Verification
- `pipeline/.venv/bin/python -m pytest -q`: pass (93/93)
- `npm test -- --run`: pass (29/29)
- `npm run typecheck`: pass
- `npm run lint`: pass with 6 existing warnings
- `npm run build`: pass; generated 99 static pages

### In Progress
- Nothing active in Phase 4.

### Issues Encountered
- `src/app/sitemap.test.ts` initially imported server-only Supabase query code; fixed the test by mocking the SEO query layer.
- Deadline-sensitive guide content should keep linking to official SFUSD/DEC pages instead of hardcoding future-cycle dates.

### Next Session Should
1. Start Phase 5 with `V2-F014: Subsidy-Aware Net Cost Planner`.
2. Before implementation, validate DEC/ELFA data source and field mapping for subsidy participation + tuition assistance metadata.
3. Decide the privacy-safe financial input model for cost estimates: default remains income band with no exact income stored.

---

## Session: 2026-04-29 13:18

### Completed
- **Finished `V2-F010: Elementary Filter/SEO Pages`**
  - Confirmed grade-level filtering is wired in list and map search controls against canonical `programs.grade_levels`.
  - Confirmed required elementary SEO pages are included in static params and sitemap coverage.
  - Added regression coverage for elementary SEO route registration.
  - Fixed the desktop sidebar clear-filter active count to include grade filters.
- **Closed Phase 3: Elementary Expansion**
  - Marked `V2-F010` as pass in `ROADMAP.md` and `docs/dev/features.json`.
  - With `V2-F005` through `V2-F010` all passing, Phase 3 is complete.
- **Refreshed closeout docs**
  - Updated README test counts.
  - Updated `PROJECT_STATE.md` so external sessions see Phase 3 complete and Phase 4 as next.

### Verification
- `pipeline/.venv/bin/python -m pytest -q`: pass (93/93)
- `npm test -- --run`: pass (22/22)
- `npm run typecheck`: pass
- `npm run lint`: pass with 6 existing warnings
- `npm run build`: pass; generated 94 static pages
- `git diff --check`: pass

### In Progress
- Nothing active in Phase 3.

### Issues Encountered
- The F010 implementation was already mostly complete from the Phase 3 foundation pass; it remained WIP only because it depended on `V2-F009`.

### Next Session Should
1. Start Phase 4 with `V2-F011: Static Guide Pages`.
2. Separately decide whether to run write-mode Phase 3 imports and whether CDE private schools need contact/location enrichment.

---

## Session: 2026-04-29 09:00

### Completed
- **Finished `V2-F009: Child Profile Management`**
  - Added authenticated `/api/family/children` GET/PATCH endpoint for durable child-profile persistence.
  - Added dashboard `ChildProfileManager` with add, edit, and remove flows.
  - Updated app-header child selector to load persisted profiles and only render for multi-child families.
  - Search and compare scoring now honor `activeChildId` against persisted family children.
  - Intake completion preserves existing sibling profiles when updating the current child/family profile.
- **Updated tracking**
  - Marked `V2-F009` as pass in `ROADMAP.md` and `docs/dev/features.json`.

### Verification
- `pipeline/.venv/bin/python -m pytest -q`: pass (93/93)
- `npm test -- --run`: pass (19/19)
- `npm run typecheck`: pass
- `npm run lint`: pass with 6 existing warnings
- `npm run build`: pass; generated 94 static pages
- `git diff --check`: pass

### In Progress
- `V2-F010: Elementary Filter/SEO Pages` remains WIP until the CDE private-school contact/enrichment decision is made.

### Issues Encountered
- Active-child selection previously only affected local draft context. Persisted family scoring now reorders child profiles by `activeChildId` in search and compare API normalization.

### Next Session Should
1. Run write-mode `sfusd-elementary-import` and `cde-private-charter-import` once the data load path is approved.
2. Decide whether CDE private schools need directory/contact enrichment before closing `V2-F010`.

---

## Session: 2026-04-29 08:32

### Completed
- **Closed Phase 3 session state**
  - Applied remote Supabase migrations for Phase 2 and Phase 3 after linking the `SFSchools` project.
  - Repaired Supabase migration history for the already-present base schema/RPC migrations before pushing pending migrations.
  - Verified `programs.grade_levels`, `families.children`, and Phase 2 quality columns exist in the live database.
  - Updated README wording and test counts for the elementary expansion foundation.
  - Ignored generated Supabase CLI temp state with `supabase/.temp/`.

### Verification
- `pipeline/.venv/bin/python -m pytest -q`: pass (93/93)
- `npm test -- --run`: pass (15/15)
- `npm run typecheck`: pass
- `npm run lint`: pass with 6 warnings, 0 errors
- `npm run build`: pass; generated 93 static pages
- `git diff --check`: pass
- `supabase migration list`: all four local migrations are applied remotely

### In Progress
- `V2-F009: Child Profile Management`
  - Persistent edit/remove profile management and add-child vs edit-current intake mode are still open.
- `V2-F010: Elementary Filter/SEO Pages`
  - Core filters/SEO routes are implemented, but this remains WIP until child-profile workflow dependency is closed.

### Issues Encountered
- Supabase CLI initially saw no remote migration history even though the base schema/RPCs existed. Confirmed live schema/RPCs first, then repaired only the two base migration versions before pushing Phase 2 and Phase 3.
- `npm run lint` still reports the existing six warnings; no lint errors.
- `npm run build` still reports the existing Next.js middleware/proxy deprecation and edge-runtime static-generation warning.

### Next Session Should
1. Finish `V2-F009` with durable child profile edit/remove UI and DB persistence.
2. Run write-mode `sfusd-elementary-import` and `cde-private-charter-import` once the data load path is approved.
3. Decide whether CDE private schools need a directory/contact enrichment pass before marking `V2-F010` pass.

---

## Session: 2026-04-29 07:50

### Completed
- **Advanced Phase 3 elementary expansion**
  - `V2-F005` foundation: added program enum values (`sfusd-elementary`, `private-elementary`, `charter-elementary`), canonical `grade_levels`, GIN index, preschool backfill, shared TypeScript labels, and UI grade labels.
  - `V2-F006` SFUSD elementary import: added `pipeline sfusd-elementary-import`, K-5 grade normalization, SFUSD elementary linkages, and attendance-area `linked_elementary_school_ids` sync.
  - `V2-F007` CDE private/charter import: validated official CDE private XLSX and public School Directory TXT exports, added extractor/normalizer/load overlap filtering, and `pipeline cde-private-charter-import`.
  - `V2-F008` scoring adaptation: added `gradeTarget` eligibility, elementary 5-11 age handling, potty-training bypass for elementary, attendance-area boost, and K-path boost.
  - Started `V2-F009`: added `families.children` JSONB migration/backfill, intake child label + target grade capture, and app-header active child selector.
  - Started `V2-F010`: added grade-level search filters, elementary SEO page configs/static params/sitemap coverage, and homepage copy for elementary coverage.
- **Updated tracking**
  - Marked `V2-F005` through `V2-F008` as pass.
  - Marked `V2-F009` and `V2-F010` as WIP because durable child profile edit/remove management is still open.
  - Checked off grade taxonomy and CDE data-source pre-validation.

### Verification
- `pipeline/.venv/bin/python -m pytest -q`: pass (93/93)
- `npm test`: pass (15/15)
- `npm run typecheck`: pass
- `npm run lint`: pass with 6 existing warnings
- `npm run build`: pass
- `pipeline/.venv/bin/python -m pipeline sfusd-elementary-import --dry-run --limit 1`: pass; downloaded 234 SFUSD rows, found 74 elementary schools
- `pipeline/.venv/bin/python -m pipeline cde-private-charter-import --dry-run --limit 1`: pass; downloaded 2,958 private rows and 18,386 public rows, found 86 SF private K-5 schools and 14 SF charter K-5 schools

### In Progress
- `V2-F009: Child Profile Management`
  - Remaining: persistent edit/remove profile management and a clearer add-child vs edit-current intake mode.
- `V2-F010: Elementary Filter/SEO Pages`
  - Core implementation is in place, but left WIP until child-profile workflow dependency is closed.

### Issues Encountered
- CDE charter grade spans such as `K-8` initially collapsed to only `k`; fixed grade normalization to cap elementary spans at fifth grade.
- Private CDE school data has grade/enrollment fields but not full contact/location fields in the annual XLSX, so private import rows may start with lower completeness until enriched from directory/contact data.

### Next Session Should
1. Finish `V2-F009` with durable child profile edit/remove UI and DB persistence.
2. Decide whether CDE private schools need a second directory/contact enrichment pass for address/phone/website.
3. Apply migration `20260429000000_phase3_elementary_foundation.sql` before write-mode Phase 3 imports.

---

## Session: 2026-04-28 16:50

### Completed
- **Restored local project baseline**
  - Recreated `pipeline/.venv` with editable pipeline install and dev test dependencies
  - Synced Node dependencies; missing Playwright package/types restored
  - Added `pipeline.__main__` so documented `pipeline/.venv/bin/python -m pipeline ...` commands work
  - Updated pipeline config to load root `.env.local` and accept both pipeline env names (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `MAPBOX_ACCESS_TOKEN`) and app env names (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`)
- **Completed Phase 2: Data Validation & Trust**
  - `V2-F001` URL validation: new `pipeline validate urls [--dry-run] [--fix]` command with async HEAD/GET checks, redirect final URL capture, timeout/DNS/broken status classification, and optional broken URL nulling with provenance
  - `V2-F002` address validation: new `pipeline validate addresses [--dry-run] [--fix]` command with Mapbox relevance checks, SF bounds validation, mismatch distance detection, and high-confidence coordinate correction
  - `V2-F003` missing data flagging: completeness tiering (`skeletal`, `basic`, `adequate`, `complete`), DB write path, enrichment candidate list, reusable frontend trust metadata, and limited-information banners on cards/profiles
  - `V2-F004` combined quality dashboard: `pipeline quality check` writes `pipeline/data/quality-report.json`; URL validation included by default, address validation available via `--include-address-validation` to avoid accidental Mapbox quota use
  - Added Supabase migration `20260428000000_phase2_quality_validation.sql` for validation/tier columns and indexes
- **Updated tracking**
  - Marked V2-F001 through V2-F004 as pass in `ROADMAP.md` and `docs/dev/features.json`
  - Ignored generated `pipeline/data/quality-report.json`

### Verification
- `pipeline/.venv/bin/python -m pytest -q`: pass (86/86)
- `npm test`: pass (13/13)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass with 6 existing warnings
- `pipeline/.venv/bin/python -m pipeline validate urls --dry-run --limit 1 --timeout 5`: pass (1 DNS failure classified)
- `pipeline/.venv/bin/python -m pipeline validate addresses --dry-run --limit 1 --timeout 5`: pass (1 valid)
- `pipeline/.venv/bin/python -m pipeline quality check --skip-url-validation --limit 1 --report-path /tmp/sf-school-quality-report.json`: ran successfully and exited 1 as designed because the live data has warnings/stale records

### In Progress
- Nothing active in code; Phase 2 is complete and Phase 3 has not started.

### Issues Encountered
- Pipeline CLI entrypoint was missing `pipeline.__main__`; added it so documented `python -m pipeline` commands work.
- Pipeline env loading expected pipeline-specific variable names only; updated config to load root `.env.local` and app env aliases.
- `pipeline quality check` exits 1 on current live data due warnings/stale records by design; this is a data-quality signal, not a command failure.
- `AGENTS.md` was already untracked at session start and remains outside this session's commit scope.

### Next Session Should
1. Apply the new Supabase migration before running write-mode validators.
2. Start Phase 3 with `V2-F005: Program Type Enum Expansion`.
3. Decide the canonical `grade_levels` taxonomy before the V2-F005 migration.

---

## Session: 2026-03-30 09:25

### Completed
- **Converted overnight agent from remote trigger to Desktop scheduled task** — adapted from morty-v2 pattern:
  - Updated `docs/OVERNIGHT_AGENT.md` header to reference Desktop task instead of remote trigger
  - Created `prompts/overnight-agent.md` — thin entry point that reads full prompt + writes JSON run log
  - Created `state/` directory (gitignored) for `overnight-agent-log.json` runtime output
  - Added `state/` to `.gitignore`
  - Added "Overnight Agent" section to `CLAUDE.md` with file paths

### In Progress
- Nothing — task config ready for manual entry in Desktop scheduler

### Issues Encountered
- None

### Next Session Should
1. **Create Desktop task** — add overnight-agent in Claude Desktop scheduler (config documented below)
2. **Phase 2: Data Validation** — restore pipeline venv (#7), then V2-F001 (URL validation)
3. **Fix compare bug** (#1) and hydration mismatch (#2)

---

## Session: 2026-03-30 08:47

### Completed
- **Migrated KNOWN_ISSUES.md to GitHub Issues** — 29 issues created (#4-#32):
  - 7 `tech-debt` issues (Lighthouse audit, visual regression, Google Fonts, pipeline venv, basic listings, non-SF commute, null cost sort)
  - 6 `needs-design-decision` issues (attendance boundaries, geocoding fallback, due dates, twins, zero results UX, VoiceOver testing)
  - 16 `deferred` issues (V2 features: decision tree, AI advisor, waitlist intelligence, community reviews, web push, isochrones, split-parent commute, cost calculator, K-12 expansion, draw search area, Yelp reviews, subsidy calculator, multi-city, lottery simulator, mid-year closures, cost disclaimers)
- **Created 4 GitHub labels**: `tech-debt`, `needs-design-decision`, `deferred`, `in-progress`
- **Created `docs/OVERNIGHT_AGENT.md`** — autonomous agent prompt adapted from CatRunner template, with project-specific safety rails (scoring logic, RLS, pipeline, .env), build/test/lint gates
- **Updated CLAUDE.md** — replaced KNOWN_ISSUES.md reference with GitHub Issues pointer
- **Deleted KNOWN_ISSUES.md** — single source of truth is now GitHub Issues

### In Progress
- Overnight agent scheduler not created (3/3 scheduled trigger slots filled)

### Issues Encountered
- None

### Next Session Should
1. **Phase 2: Data Validation** — restore pipeline venv (#7), then V2-F001 (URL validation), V2-F002 (address verification)
2. **Fix compare bug** (#1) — likely Supabase env credentials in .env.local
3. **Fix hydration mismatch** (#2) — defer CompareTray render behind useEffect mount guard
4. Schedule overnight agent when a trigger slot opens up

---

## Session: 2026-03-29 11:40 (Phase 1 Complete — Map Redesign + Profile Polish)

### Completed
- **F026: Search Map Redesign** — replaced broken flex-based layout with Full Map + Side Panel pattern (Zillow/Redfin). 7 commits:
  - Added forwardRef to ProgramCard for scroll-to-card
  - Added flyTo/highlightPin imperative API to MapContainer via useImperativeHandle
  - Created FilterModal — modal overlay for map mode filters
  - Created MapPanel — left panel overlay with search, filter button, scrollable program cards
  - Created MapSearchView — composition layer (absolute map + panel + filter modal)
  - Refactored SearchView — removed split mode, integrated MapSearchView for map mode
  - Fixed container sizing: className on wrapper div, removed overflow-hidden, explicit viewport height
- **F027: Profile Page Polish** — 2 commits:
  - Single-column layout (removed lg:grid-cols-3), inline profile actions, styled map preview fallback
  - Added top padding to CardContent component (content was flush against header border)
- **Filed 2 GitHub issues** for pre-existing bugs discovered during testing:
  - #1: Compare Programs page fails to load (API error, likely Supabase env issue)
  - #2: Hydration mismatch from CompareTray (client/server state divergence)

### Verification
- TypeScript: clean (0 errors)
- Frontend tests: 9/9 passing
- Build: successful
- Manual testing: List view works, Map view renders with side panel, profile page sections span full width

### Issues Encountered
- Map container had zero height due to flex chain not propagating height (min-h-screen vs h-screen). Fixed with explicit calc(100dvh - 11rem) on wrapper.
- MapContainer's role="application" wrapper div didn't receive className, causing absolute-positioned map to have zero dimensions. Fixed by moving className to wrapper.
- overflow-hidden on flex parent was clipping the map container. Removed.

### Next Session Should
1. **Phase 2: Data Validation** — restore pipeline venv, then V2-F001 (URL validation), V2-F002 (address verification)
2. **Fix compare bug** (#1) — likely Supabase env credentials in .env.local
3. **Fix hydration mismatch** (#2) — defer CompareTray render behind useEffect mount guard

---

## Session: 2026-03-29 (V2 Brainstorm + Doc Cleanup — F028)

### Context
Planning session: reviewed all V1 artifacts, brainstormed unified V2 roadmap structure, made key architectural decisions, then executed documentation cleanup as F028.

### Completed
- **V2 roadmap brainstorm** — reviewed V2_ROADMAP.md, KNOWN_ISSUES.md open items, and PROJECT_STATE.md priorities. Decided on a single unified ROADMAP.md (4 phases) replacing the V1/V2 split.
- **Map pattern decision** — Full Map + Side Panel (Zillow/Redfin): map gets `position:absolute; inset:0`, program list is an overlay panel (~320px), not a flex sibling. This is the root cause fix for the broken layout.
- **Filter approach decision** — Toolbar button opens a modal overlay with all filter controls. Keeps panel focused on results.
- **Split view removal** — Confirmed: remove entirely. Search has two modes only: List and Map.
- **V2-G0 gate eliminated** — Site is live and public. Sentry/PostHog/feature flags are "when needed," not blockers.
- **Phase 1 features scoped** — F026 (map redesign), F027 (profile polish), F028 (doc cleanup) as Phase 1 of unified roadmap.
- **F028: Documentation cleanup executed** — see below.

### F028: Files Changed
- `ROADMAP.md` → archived to `docs/dev/V1_ROADMAP.md`
- `V2_ROADMAP.md` → deleted; replaced by new `ROADMAP.md`
- `KNOWN_ISSUES.md` → stripped of all resolved issues; 2 open issues retained (map → In Progress, profile polish → Open)
- `docs/dev/V1_KNOWN_ISSUES.md` → created (full archive of resolved issues)
- `docs/dev/PROGRESS.md` → moved to `PROGRESS.md` (root)
- `docs/dev/PROJECT_STATE.md` → moved to `PROJECT_STATE.md` (root)
- `PROJECT_STATE.md` (35-line stale root version) → deleted
- `ROADMAP.md` → written (unified 4-phase roadmap from design spec)
- `CLAUDE.md` → updated file path references
- `docs/dev/features.json` → updated: V1 phases prefixed, F026/F027/F028 added, F023/F024/F025 removed, F028 status = pass
- `docs/dev/AGENT_BOUNDARIES.md` → updated phase references and feature lists

### Issues Encountered
- None

### Next Session Should
1. **Execute Phase 1 Plan** — F026: Search Map Redesign (Full Map + Side Panel pattern)
2. **Execute Phase 1 Plan** — F027: Program Profile Polish (spacing, static map preview, action buttons)

---
