# Progress Log — SF School Navigator

---

## Session: 2026-05-11 13:00

### Completed
- **Migrated project tracking to Linear** (FoundryHR / FoundryLabs / LABS team) via Project OS skill — Shape 3 (Post-ROADMAP, ongoing) pattern, 4 milestones + 7 issues
  - Linear project: https://linear.app/foundryhr/project/sf-school-navigator-8980cef14b25
  - LABS-38 (Done) — V1 aggregate, 22 features
  - LABS-39 (Done) — V2 aggregate, 19 features (closes GitHub #7)
  - LABS-40 (Done) — Live URL & schema-drift hygiene (already-shipped post-V2 commits)
  - LABS-41 (Todo) — Hardening backlog: Sentry/PostHog/middleware-to-proxy/lint/VoiceOver/commute-outside-SF
  - LABS-42 (Todo Bug) — Compare Programs page fix (closes GitHub #1)
  - LABS-43 (Backlog) — 21-candidate V3 parking lot, themed
  - LABS-44 (Todo, needs-matt) — Decide next roadmap direction
- **Closed GitHub #7** (pipeline venv — already satisfied 2026-04-28 per ROADMAP) with cross-ref to LABS-39
- **Retrospective** written at `~/Projects/docs/superpowers/playbooks/2026-05-11-project-os-migration-retrospective-sf-school-navigator.md` (Run #7 in canonical Project OS sequence; 7-of-7 durable intersection confirmed; two small refinements R1/R2 surfaced)
- **Memories refreshed** — stale "4 agent PRs awaiting review" note superseded; new `reference_linear_project.md` added with Linear URL + milestone names

### Verification
- No code changes in this session (migration was external to the repo)
- Working tree clean before and after
- `npx tsc --noEmit`: pass (unchanged from prior commit)

### In Progress
- Nothing active in the repo; LABS-41/42/44 are queued in Linear for next sessions

### Issues Encountered
- None — Pause #1 approved on first try; ID prediction held (LABS-38..44 exact); auto-`relatedTo` from body cross-refs (gotcha 4) fired correctly

### Next Session Should
1. Pick a single LABS-N to drive via `/session-start LABS-N`:
   - **LABS-42** (Compare Programs bug) — smallest concrete win
   - **LABS-41** (Hardening backlog) — longest checklist with multiple PRs
   - **LABS-44** (Decide next roadmap) — strategic, gates V3 candidate activation
2. GitHub issues #1, #9, #16 stay open and close when their LABS counterparts ship
3. Stop referencing PROGRESS.md "next session should" sections from sessions before 2026-05-11 — those are pre-Linear-migration and may name closed work; use Linear LABS-N as the canonical work queue going forward

---

## Session: 2026-04-30 12:05

### Completed
- **Fixed broken school-profile website links**
  - Added shared external URL normalization for profile and application-section links.
  - Hid placeholder values such as `No Data`, invalid URLs, non-web schemes, and `.example.*` domains before rendering.
  - Normalized deadline source links through the same guard.
  - Hardened SFUSD and CDE transforms so placeholder website values become `null` instead of displayable URLs.
  - Removed fake website/source URLs from seed data.
- **Cleaned live Supabase data**
  - Cleared 85 placeholder program website URLs.
  - Cleared 5 placeholder deadline source URLs.
  - Verified remaining `programs.website` and `program_deadlines.source_url` values have zero placeholder/bad URLs.

### Verification
- `npm test`: pass (66/66)
- `npm run typecheck`: pass
- `pipeline/.venv/bin/python -m pytest -q`: pass (98/98)
- `npm run lint`: pass
- `npm run build`: pass; generated 101 static pages

### In Progress
- Nothing active; working tree is clean and `main` is synced to `origin/main`.

### Issues Encountered
- Production data contained placeholder school website values (`.example.*`, `No Data`) that profile pages rendered as real links. Fixed in UI guards, source transforms, seed data, and live Supabase rows.
- No session-start test baseline file was present, so test comparison was skipped.

### Next Session Should
1. Browser-smoke a few live program profiles and confirm only real website/source links render.
2. Continue the launch-hardening backlog: middleware-to-proxy rename, Sentry/PostHog, Lighthouse, and manual accessibility checks.
3. Decide whether to archive the completed unified roadmap or define the next active roadmap.

---

## Session: 2026-04-30 10:52

### Completed
- **Finished `V2-F016: Household Planning Workspace`**
  - Added lightweight saved-program planning state for active/backup/inactive roles, per-child scoping, and tour/application/follow-up task statuses.
  - Extended saved-program APIs to read and update planning fields with family child-id validation while preserving existing status, notes, reminders, and RLS ownership checks.
  - Added a pure household planning module that groups plans per child, preserves F015 strategy buckets, summarizes active cost span, deadlines, next actions, and household review copy.
  - Refactored `/dashboard` into a household planning workspace with top summary, per-child sections, local compare shortlist surface, strategy, reminders, deadlines, and saved-program planning controls.
  - Added tests for planning-state validation, household grouping, dashboard workspace rendering, and planning controls.
- **Closed Phase 5 and the active roadmap**
  - Marked `V2-F016` as pass in `ROADMAP.md` and `docs/dev/features.json`.
  - Updated README counts/features and `PROJECT_STATE.md` so external sessions see the roadmap as complete.

### Verification
- `npm test`: pass (63/63)
- `npm run typecheck`: pass
- `pipeline/.venv/bin/python -m pytest -q`: pass (96/96)
- `npm run lint`: pass with 6 existing warnings
- `npm run build`: pass; generated 100 static pages

### In Progress
- Nothing active in `V2-F016`.

### Issues Encountered
- Next.js build still reports the existing middleware-to-proxy deprecation warning.
- Existing lint warnings remain unchanged: two `<img>` warnings, three unused-symbol warnings, and one unused type import warning.

### Next Session Should
1. Run a roadmap/archive decision: either define the next roadmap or archive `ROADMAP.md` as complete.
2. Consider the existing launch-hardening backlog: middleware-to-proxy rename, lint warnings, Sentry/PostHog, Lighthouse, and manual accessibility checks.
3. Browser-smoke `/dashboard` with an authenticated family that has multiple children and saved programs.

---

## Session: 2026-04-30 09:05

### Completed
- **Finished `V2-F015: Application Strategy Planner`**
  - Added a pure, derived saved-program strategy planner with Reach / Likely / Fallback planning roles, prioritized recommendations, reasons, next actions, warnings, planning gaps, checklist items, and no-guarantee caveats.
  - Added dashboard `ApplicationStrategyPanel` with grouped recommendations, count summary, gap callouts, common checklist, official-action caveats, and a compact empty state until at least two programs are saved.
  - Extended dashboard saved-program normalization to include match-scoring inputs, deadlines, schedules, tags, languages, SFUSD linkage, data quality, freshness, and the existing shared `costEstimate` object.
  - Added regression coverage for bucket assignment, expensive/unknown cost handling, no affordable fallback, deadline collisions, low-confidence reliance, missing public TK/K options, humble copy, and rendered dashboard strategy output.
- **Updated tracking**
  - Marked `V2-F015` as pass in `ROADMAP.md` and `docs/dev/features.json`.
  - Marked the strategy bucket taxonomy pre-validation checklist complete.
  - Updated README test counts and `PROJECT_STATE.md` so external sessions see `V2-F016` as next.

### Verification
- `npm test`: pass (50/50)
- `npm run typecheck`: pass
- `pipeline/.venv/bin/python -m pytest -q`: pass (96/96)
- `npm run lint`: pass with 6 existing warnings
- `npm run build`: pass; generated 100 static pages

### In Progress
- Nothing active in `V2-F015`.

### Issues Encountered
- Next.js build still reports the existing middleware-to-proxy deprecation warning.
- Existing lint warnings remain unchanged: two `<img>` warnings, three unused-symbol warnings, and one unused type import warning.

### Next Session Should
1. Start `V2-F016: Household Planning Workspace`.
2. Preserve the derived-only strategy behavior unless a later planning-state migration is explicitly added.
3. Keep strategy copy framed as planning support, not placement guarantees.

---

## Session: 2026-04-30 08:20

### Completed
- **Finished `V2-F014: Subsidy-Aware Net Cost Planner`**
  - Added privacy-preserving broad cost estimate bands on `families.cost_estimate_band`; exact income is not stored.
  - Added ELFA metadata fields on `program_costs` for positive participation matches, source URL, and verification timestamp.
  - Added shared cost-estimate logic for sticker price, ELFA free tuition, full credit, half credit effective July 1, 2026, unknown cost data, confidence labels, caveats, and official DEC links.
  - Surfaced the same estimate object on search cards, compare desktop/mobile views, program profiles, saved programs, and dashboard cost planning.
  - Added intake and dashboard controls for choosing the broad estimate band.
- **Added pipeline ELFA support**
  - Added conservative license-number matching helpers and `pipeline elfa-mark` CLI command.
  - Non-matches stay unknown rather than being marked false.
- **Updated tracking**
  - Marked `V2-F014` as pass in `ROADMAP.md` and `docs/dev/features.json`.
  - Updated README test counts and `PROJECT_STATE.md` so external sessions see `V2-F015` as next.

### Verification
- `npm test`: pass (39/39)
- `npm run typecheck`: pass
- `pipeline/.venv/bin/python -m pytest -q`: pass (96/96)
- `npm run lint`: pass with 6 existing warnings
- `npm run build`: pass; generated 100 static pages

### In Progress
- Nothing active in `V2-F014`.

### Issues Encountered
- Next.js build still reports the existing middleware-to-proxy deprecation warning.
- Existing lint warnings remain unchanged: two `<img>` warnings, three unused-symbol warnings, and one unused type import warning.

### Next Session Should
1. Start `V2-F015: Application Strategy Planner`.
2. Use the new shared `costEstimate` object when assigning affordability and fallback-planning signals.
3. Keep strategy language humble: decision support, not admissions prediction.

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

