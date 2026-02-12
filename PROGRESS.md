# Progress Log — SF School Navigator

---

## Session: 2026-02-12 (Known Issues Remediation Sweep)

### Scope
- Took `KNOWN_ISSUES.md` as the execution backlog and resolved every non-resolved entry (Open/In Progress), including UI/accessibility regressions, lint/tooling breakage, and remaining pipeline data/linkage gaps.

### Completed
- **Resolved all Phase-4 editorial UI follow-up issues**
  - Raised focus indicator contrast by moving affected controls from `neutral-400` to `neutral-700` focus ring/border tokens across buttons/forms.
  - Restored list-card affordance in search + SEO results (`ProgramCard`, search list container, `/schools/[slug]` list rows).
  - Normalized active-state visual language (onboarding preference chips + search attendance overlay now use consistent neutral-selected treatment).
  - Improved badge readability by removing forced uppercase/tracking-wide small text in shared `Badge`.
- **Restored lint pipeline on Next.js 16**
  - Added ESLint v9 flat config (`eslint.config.mjs`) and switched npm lint script from `next lint` to `eslint .`.
  - Fixed surfaced lint errors that blocked execution:
    - Removed `setState`-in-effect patterns via lazy localStorage initialization in `use-intake-form`, `compare-context`, and `location-section`.
    - Removed explicit `any` generics in Supabase admin/public clients.
- **Closed remaining Phase-1 pipeline/data gaps**
  - CCL extraction now ingests **both** CHHS center + family-home resources via CKAN datastore API with facility-number dedupe.
  - SFUSD import now applies explicit cross-source overlap filtering (`filter_sfusd_overlaps`) and writes feeder attribution from attendance-area linkage into `program_sfusd_linkage`.
  - Dry-run validation confirmed new pipeline behavior:
    - `ccl-import` dry-run now reports combined resource extraction (39,184 rows raw; 684 SF licensed facilities after filtering).
    - `sfusd-import` dry-run now includes Step 2b dedupe and linkage/rules flow.
- **Documentation/state alignment**
  - Updated `PROJECT_STATE.md` regeneration/source note, clarified feature-complete vs deferred infrastructure tasks, and corrected frontend runtime version to Next.js 16.
  - Marked every previously Open/In Progress issue in `KNOWN_ISSUES.md` as **Resolved** with dated, implementation-specific resolution notes.

### Verification
- Frontend:
  - `npm run lint`: pass (warnings only, no errors)
  - `npm run typecheck`: pass
  - `npm test`: pass (9/9)
  - `npm run build`: pass
- Pipeline:
  - `pipeline/.venv/bin/python -m pytest -q`: pass (69/69)
  - `pipeline/.venv/bin/python -m pipeline.cli ccl-import --dry-run --limit 5`: pass
  - `pipeline/.venv/bin/python -m pipeline.cli sfusd-import --dry-run --limit 5`: pass

### Tracking
- `KNOWN_ISSUES.md`: all active issues resolved and footer updated.
- `PROGRESS.md`: this remediation session logged.

---

## Session: 2026-02-12 (Editorial UI Refresh Comprehensive Review)

### Scope
- Audited the full editorial refresh commit (`67a2f3a`) across 40 changed frontend files.
- Applied `web-design-guidelines` and `vercel-react-best-practices` review criteria to UI primitives, layouts, search/compare/profile/dashboard/onboarding flows, and marketing pages.
- Validated runtime health after review.

### Verification
- `npm run typecheck`: pass
- `npm test`: pass (9/9)
- `npm run build`: pass
- `npm run lint`: fail (`next lint` invalid with current Next.js setup; tracked as open issue)
- `npx eslint src/app src/components --max-warnings=0`: fail (no ESLint v9 flat config present; tracked as open issue)

### Findings (Highest Risk First)
- **High:** Focus indicator contrast regression introduced by neutral-400 focus token usage across buttons and form controls.
- **Medium:** Search and SEO list rows lost baseline affordance after flat/cardless styling shift.
- **Medium:** Editorial visual language is inconsistent across control active states (neutral vs brand accents).
- **Medium:** Linting pipeline is currently non-functional, reducing guardrails for future UI iterations.
- **Low:** Global badge typography change (11px uppercase tracked text) reduces readability in dense metadata contexts.

### Tracking
- Added five new open issues to `KNOWN_ISSUES.md` for the findings above.
- Updated `KNOWN_ISSUES.md` footer timestamp to reflect this review pass.

### Next Session Should
1. Fix focus ring/border token contrast first (highest accessibility risk).
2. Restore stronger default row affordance in search + SEO lists while keeping the editorial look.
3. Normalize active/selected state styling across onboarding/search controls.
4. Migrate linting to ESLint v9 flat config and restore a working `npm run lint`.

---

## Session: 2026-02-12 (Editorial UI Refresh)

### Completed
- **Editorial UI refresh** — NYT/SF Chronicle newspaper-of-record visual design across 40 files
  - **Foundation:** Replaced Inter with Libre Baskerville (serif headlines) + Source Sans 3 (body) via `next/font/google`. Deep navy brand palette (#2c3e50), warm gray neutrals (cream #faf9f6, parchment #f0ede8), desaturated semantic colors. Tighter border radii. Editorial utility classes (`.editorial-rule`, `.editorial-rule-heavy`).
  - **UI Primitives (8 files):** Button tracking-wide + neutral focus rings, Card shadow-none + header border, Badge uppercase tracked + rounded (not pill), Skeleton warmer fill, NavHeader serif masthead in ink-black on opaque cream, Footer parchment bg + heavy top border + serif copyright, layouts with more breathing room.
  - **Marketing + Search (5 files):** Homepage cream bg (no gradient) + ruled feature list + dark CTA, schools/[slug] serif headings + ruled program list, search-view ruled list + dark view toggles, program-card flat rule-separated items + serif h3 + left-border selected state, filter-sidebar neutral focus rings + dark selected pills.
  - **Profile + Dashboard + Compare + Intake (19 files):** All headings `font-serif` across all sections. Focus rings neutral-400 everywhere. Profile link styles understated (brand-700/800). Dashboard shadow-none + serif program names. Compare table serif headers + warm diff highlighting (amber-50) + heavy tray border + parchment chips. Intake progress bar dark neutral indicators + serif step headings.
- Executed via 3 parallel Agent Teams (agent-primitives, agent-marketing, agent-pages) with team lead handling foundation + coordination

### Verification
- `npm run typecheck`: pass
- `npm test`: pass (9/9)
- `npm run build`: pass (35 pages, compiled in 2.4s)

### Issues Encountered
- None — clean execution across all agents

### Next Session Should
1. Run `npm run dev` and visually verify all 7 routes (/, /schools/[slug], /intake, /search, /programs/[slug], /dashboard, /compare)
2. Run Lighthouse accessibility audit to verify WCAG AA contrast ratios with new palette
3. Begin Phase 4 — beta testing with real SF parents
4. Consider running `/vercel-react-best-practices` and `/web-design-guidelines` skills on key pages

---

## Session: 2026-02-11 (Phase 3 Issue Remediation)

### Completed
- Resolved all Phase 3 issues identified in the comprehensive review pass:
  - **Reminder cron auth/RLS:** moved `/api/cron/reminders` to service-role Supabase client and admin user email resolution path so reminder jobs can read protected tables and execute reliably.
  - **Unsubscribe reliability/security:** migrated `/api/unsubscribe` writes to service-role client and replaced raw UUID unsubscribe links with signed, expiring tokens.
  - **Deadline date correctness:** implemented local date-only parsing/formatting utilities and replaced timezone-unsafe `new Date("YYYY-MM-DD")` usage across reminder logic and deadline rendering.
  - **Unknown deadline state:** fixed deadline card urgency labeling so unknown dates render as **Unknown** instead of **Passed**.
  - **F020 static generation gap:** switched SEO queries to a static-safe public Supabase client and enforced static param rendering (`force-static`) for `/schools/[slug]`; route now builds as SSG.
  - **Provenance tooltip accessibility:** added keyboard/focus interaction and ARIA tooltip semantics for non-mouse users.

### Verification
- `npm run typecheck`: pass
- `npm test`: pass (9/9)
- `pipeline/.venv/bin/python -m pytest -q`: pass (64/64)
- `npm run build`: pass
  - Build output now reports `/schools/[slug]` as `●` (SSG via `generateStaticParams`), resolving prior dynamic rendering mismatch.

### Tracking
- Updated `KNOWN_ISSUES.md` to mark all six Phase 3 review findings as **Resolved** with implementation-specific resolution notes.

## Session: 2026-02-11 (Phase 3 Comprehensive Code Review)

### Scope
- Reviewed Phase 3 implementation (`F018`-`F022`) against `ROADMAP.md` acceptance criteria.
- Audited frontend + API behavior for K-path preview, reminders/unsubscribe flow, SEO pages, freshness/trust UI, and accessibility pass changes.
- Re-validated runtime health and build output.

### Verification Results
- `npm run typecheck`: pass
- `npm test`: pass (9/9)
- `pipeline/.venv/bin/python -m pytest -q`: pass (64/64)
- `npm run build`: pass
  - Build output shows `/schools/[slug]` as dynamic (`ƒ`), not static (`○`).

### Findings (Highest Risk First)
- **High:** Reminder cron cannot reliably send emails because it uses anon/cookie Supabase client in a no-session cron context (`/api/cron/reminders`), conflicting with RLS and admin user lookup requirements.
- **High:** Unsubscribe links are non-functional for email recipients because `/api/unsubscribe` also uses anon/cookie client and cannot update `saved_programs` under RLS without an authenticated session.
- **High:** Deadline date parsing is timezone-unsafe (`new Date("YYYY-MM-DD")`) and shifts deadlines by one day in Pacific time (e.g., `2026-01-31` renders/calculates as Jan 30), impacting reminder timing and displayed dates.
- **Medium:** Unknown-date deadlines are visually labeled as "Passed" while also showing "Contact program for dates", producing contradictory timeline messaging.
- **Medium:** F020 static generation acceptance gap: `/schools/[slug]` is currently dynamic at build due cookie-bound Supabase client usage in SEO query path.
- **Low:** Accessibility gap remains for provenance tooltips (hover-only interaction pattern); keyboard/screen-reader discoverability is limited.

### Tracking
- Added all Phase 3 findings to `KNOWN_ISSUES.md` with status, severity, workaround, and pending resolution notes.

## Session: 2026-02-11 (F022 Accessibility & Polish)

### Completed
- **F022: Accessibility & Polish** — WCAG AA compliance pass across 17 files using 3 parallel agents
  - **Auth modal:** Focus trap (Tab/Shift+Tab wrapping), Escape key close, `role="dialog"` + `aria-modal`, focus restore on close, 44px close button touch target
  - **Skip navigation:** Skip-to-content link (sr-only, visible on focus) + `id="main-content"` on content area
  - **404 page:** New `src/app/not-found.tsx` with semantic HTML, links to search and home
  - **Button defaults:** `type="button"` default on Button component (overridable)
  - **Map container:** `role="application"`, `aria-roledescription="Interactive map"`, sr-only usage instructions
  - **Search view:** `aria-pressed` on view mode and overlay toggles, `aria-expanded` on mobile filters, `aria-live="polite"` on result count, `role="alert"` on errors
  - **Filter sidebar:** `aria-pressed` on language toggles, `aria-label` with count on clear button
  - **Program card:** `tabIndex={0}` + Enter key navigation, `role="article"`, human-readable match tier labels
  - **Compare tray:** 44px touch targets on remove buttons, `aria-label` with count on Compare button
  - **Comparison table:** `<caption>` added, sr-only "Values differ" annotations on highlighted cells
  - **Mobile compare cards:** 44px dot touch targets, `aria-label` on remove buttons
  - **Dashboard deadline card:** Visible urgency text labels (Urgent/Soon/Upcoming/Passed) alongside color bars
  - **Deadline timeline:** `role="list"` / `role="listitem"` semantics
  - **Saved programs list:** `aria-label` on all action buttons (remove, save notes, edit notes, status select)
  - **Profile actions:** `aria-expanded` on report toggle, `role="alert"`/`role="status"` on messages
  - **Intake progress bar:** `aria-hidden="true"` on decorative checkmark SVGs, `aria-label` with step names
  - **Step preferences:** `aria-pressed` on toggle chips

### Verification
- `npx tsc --noEmit`: pass
- `npx vitest run`: 9/9 pass
- All 17 files modified + 1 new file committed

### Notes
- Phase 3 is now fully complete (F018-F022 all done)
- Next: Phase 4 — beta testing, data QA, launch prep

---

## Session: 2026-02-11 (Phase 2 Issue Remediation)

### Completed
- Resolved all Phase 2 issues identified in the comprehensive review pass:
  - **Corrections API:** `/api/programs/[id]/corrections` now requires auth and writes `submitted_by = user.id`; profile UI prompts sign-in for correction submission.
  - **F013 selection logic:** top-program selector now balances SFUSD/private pools so default `limit=50` includes non-SFUSD programs for enrichment/scraping.
  - **Deadline safety:** enrichment writer no longer clears `program_deadlines` and now skips inserting duplicate `(program_id, school_year, deadline_type)` keys.
  - **Provenance attribution:** enrichment provenance source is now origin-aware (`sfusd`, `website-scrape`, `manual`); SFUSD deadlines provenance source corrected.
  - **F017 migration gap:** added `/api/intake/migrate` and auto-migration in `AuthProvider` to persist intake draft into `families` on authenticated session.
  - **F016 comparison gaps:** compare API + UI now include required rows (match tier, distance, attendance area, deadline summary) on desktop and mobile.
  - **F015 profile gaps:** added location section (address, map snippet, home distance when available) and expanded SSR metadata (canonical + Open Graph + Twitter).
  - **Provenance determinism:** profile provenance query now orders latest-first and field mapping preserves newest authoritative row.

### Verification
- `npm run typecheck`: pass
- `npm test`: pass (9/9)
- `pipeline/.venv/bin/python -m pytest -q`: pass (64/64)
- `npm run build`: pass (new route `/api/intake/migrate` included)

### Tracking
- Updated `KNOWN_ISSUES.md` to mark all reviewed Phase 2 items resolved with concrete resolution notes.

---

## Session: 2026-02-11 (Phase 2 Comprehensive Code Review)

### Scope
- Reviewed Phase 2 implementation (F013-F017) across frontend + pipeline against `ROADMAP.md` acceptance criteria.
- Audited Phase 2 API routes, auth flow, compare/profile UX behavior, and enrichment/deadlines pipeline interactions.
- Re-validated runtime health with project verification commands.

### Verification Results
- `npm run typecheck`: pass
- `npm test`: pass (9/9)
- `pipeline/.venv/bin/python -m pytest -q`: pass (64/64)
- `npm run build`: pass

### Findings (Highest Risk First)
- **High:** `POST /api/programs/[id]/corrections` cannot persist corrections due to `submitted_by: "anonymous"` conflicting with DB type/FK + RLS policy.
- **High:** F013 selector currently saturates top-50 with SFUSD rows, so private-program scraping/enrichment does not run under default settings.
- **High:** Re-running `pipeline enrich` can overwrite exact SFUSD deadlines written by `pipeline deadlines` (deadline records are deleted in enrichment writer, then replaced with generic entries).
- **Medium:** F017 acceptance gap: intake LocalStorage is not migrated into `families` on new account creation.
- **Medium:** F016 acceptance gap: compare UI omits required rows (distance, match tier, attendance area, deadlines).
- **Medium:** F015 acceptance gap: profile page still lacks map snippet/home-distance and OG metadata.
- **Medium/Low:** Provenance source labels are inaccurate for non-scraped data and tooltip record selection is nondeterministic when multiple provenance rows exist for a field.
- **Resolved During Review:** Prior Phase 2 RLS concern is now verified resolved (Supabase migration already contains ownership policies for `families` and `saved_programs`).

### Tracking
- Updated `KNOWN_ISSUES.md` with all newly identified Phase 2 defects/risks and updated RLS issue status to **Resolved**.

---

## Session: 2026-02-11 (Phase 2 Parallel Build)

### Completed
- **Phase 2 complete** — all 5 features (F013-F017) built and verified via parallel Agent Teams
- **Agent A (Pipeline):** Data enrichment
  - **F013: Top 50 Program Enrichment** — Built enrichment pipeline at `pipeline/src/pipeline/enrich/`. 50 programs enriched (SFUSD Pre-K/TK prioritized). 63 schedule records, 50 cost records, 59 language records, 200 provenance records. 53 programs now at >80% completeness. Language immersion auto-detected from program names. Website scraper built for future non-SFUSD use. CLI: `pipeline enrich [--dry-run] [--limit N] [--skip-scrape]`. 33 new tests.
  - **F014: Application Deadlines Collection** — SFUSD real 2026-27 enrollment dates (Nov 1 open, Jan 31 close, Mar 15 notifications, Apr 1 waitlist). All 502 programs now have deadline records (100% coverage). Generic estimates by program type for non-SFUSD. 88 provenance records for SFUSD sources. CLI: `pipeline deadlines [--dry-run] [--school-year]`. 10 new tests.
- **Agent B (Frontend):** Rich features
  - **F015: Program Profile Pages** — Dynamic route `/programs/[slug]` with SSR + `generateMetadata`. Query layer in `src/lib/db/queries/programs.ts`. Sections: header, key details with provenance tooltips, about, schedule, cost, deadlines, SFUSD connection. Data completeness progress bar. Correction form via `POST /api/programs/[id]/corrections`. Graceful "Not yet verified" placeholders.
  - **F016: Comparison Tool** — `CompareContext` (React context + localStorage) tracks up to 4 programs. Floating `CompareTray` at bottom of app layout. Desktop: side-by-side table with yellow highlight on differing values. Mobile: swipe-between-cards with dots and prev/next. 12 comparison attributes. API: `POST /api/programs/compare`.
  - **F017: User Auth & Saved Programs** — Supabase Auth (email + Google OAuth). `AuthProvider` + `AuthModal`. OAuth callback at `/auth/callback`. Middleware protects `/dashboard`. Dashboard (SSR): saved programs with status tracking (researching → toured → applied → waitlisted → accepted → enrolled → rejected), inline notes. Save button on profiles prompts sign-in if unauthenticated. CRUD: `GET/POST /api/saved-programs`, `PATCH/DELETE /api/saved-programs/[id]`.

### New Routes
- `/programs/[slug]` — SSR program profiles
- `/compare` — client-side comparison tool
- `/dashboard` — SSR protected dashboard
- `/auth/callback` — OAuth callback handler
- `POST /api/programs/[id]/corrections` — submit corrections
- `POST /api/programs/compare` — batch fetch for comparison
- `GET/POST /api/saved-programs` — list/save programs
- `PATCH/DELETE /api/saved-programs/[id]` — update/remove saved

### Verification
- TypeScript: clean (0 errors)
- Frontend tests: 9/9 passing
- Pipeline tests: 64/64 passing (21 original + 33 enrichment + 10 deadlines)
- Build: passes with all new routes registered
- No schema changes needed

### Notes
- RLS enforcement is via API-level ownership checks (user → family → saved_programs chain). Supabase-level RLS policies may need verification.
- Agent pipeline built website scraper infrastructure for future enrichment of non-SFUSD programs.
- Enrichment currently uses structured data extraction; actual website scraping for private programs is scaffolded but not yet run at scale.

### Next Session Should
1. Run `/orchestrate` for Phase 3 (features converge — both agents collaborate)
2. Phase 3 features: F018 K-path preview, F019 deadline tracker + email reminders, F020 SEO pages, F021 data freshness UI, F022 accessibility polish
3. Set up Resend account before F019 (deadline email reminders)
4. Set up Vercel deployment (still pending from Phase 0)
5. Consider importing Family Child Care Homes CSV (~200-400 more programs)
6. Verify Supabase RLS policies match API-level auth checks
7. Run enrichment scraper against actual program websites for non-SFUSD programs

---

## Session: 2026-02-11 (Issue Remediation Pass)

### Completed
- Implemented intake completion server flow:
  - Added `/api/intake/complete` to run geocode-and-discard, resolve attendance area, and upsert `families` for authenticated users.
  - Added sanitized search context persistence (no raw address) and redirect handoff to `/search`.
- Added intake location attendance preview:
  - New `/api/intake/geocode-preview` endpoint and Step 2 mini-map + attendance area preview UI.
- Implemented intake UX requirements:
  - Subsidy smart branching (hide subsidy question when budget > $3,000/month).
  - "Skip for now" action on preferences step.
  - LocalStorage intake persistence now redacts `homeAddress`.
- Replaced demo search data with Supabase-backed flow:
  - Added `/api/search` endpoint for program loading, family-context scoring, and attendance-area overlay payload.
  - Search page now loads real programs, supports loading/error states, and keeps map/list/filter behavior synchronized.
  - Fixed schedule filter logic (previously no-op).
- Added attendance area polygon overlay support:
  - `MapContainer` now supports polygon fill/outline overlay with toggle in search UI.
- Pipeline remediation:
  - Provenance writer is now source-aware (`ccl` vs `sfusd`) with source-specific tracked fields.
  - `load_programs` now recomputes completeness after geocoding.
  - Added SFUSD-specific loader module for baseline `sfusd_rules` + `program_sfusd_linkage` generation, wired into `sfusd-import`.

### Verification
- Frontend:
  - `npm run typecheck` passed.
  - `npm test` passed (9/9 tests).
  - `npm run build` passed.
- Pipeline:
  - `pipeline/.venv/bin/python -m pytest -q` passed (21/21 tests).
  - Dry-runs passed with new behavior:
    - `pipeline sfusd-import --dry-run --limit 5` (rules + linkage step present)
    - `pipeline ccl-import --dry-run --limit 5`

### Notes
- Remaining in-progress gap: SFUSD feeder-school enrichment and explicit CCL↔SFUSD dedupe strategy are still not fully implemented.
- Updated `KNOWN_ISSUES.md` statuses to reflect resolved vs in-progress items.

---

## Session: 2026-02-11 20:55 (Live Data Load)

### Completed
- **Loaded all real data into Supabase** — pipeline ran against live database for the first time
  - **CCL Import:** 414 licensed SF child care centers from CA CHHS, 403 geocoded via Mapbox
  - **SFUSD Import:** 88 programs (12 Pre-K + 74 TK-eligible elementary), all 88 geocoded
  - **Attendance Areas:** 58 SFUSD attendance area polygons loaded as PostGIS geometries
  - **Provenance:** 2,944 field provenance records written
  - **Total:** 502 programs in database, 501 geocoded
- **Created `pipeline/.env`** with Supabase + Mapbox credentials from `.env.local`
- **Ran data quality checks** — 0 schema errors, 3 warnings (2 missing license numbers from seed data, 1 ungeocoded address), 2 stale CCL records
- **Took data snapshot** for future diff comparisons

### Bug Fixes
- **Geocoding URL encoding:** Addresses with suite numbers (`#310`, `#150`) broke Mapbox URLs because `#` was treated as a URL fragment. Fixed by stripping suite/unit numbers and URL-encoding the query.
- **WKT polygon format:** Attendance area coordinate pairs were space-separated instead of comma-separated, causing PostGIS `parse error - invalid geometry`. Fixed separator to commas.
- **Geocode error resilience:** Cache lookup and store operations now wrapped in try/except so transient Supabase timeouts don't crash the entire 400+ record import.

### Verification
- TypeScript: pass (0 errors)
- Vitest: pass (9 tests)
- Pytest: pass (21 tests)
- Data quality: 0 errors, 3 warnings

### Next Session Should
1. Address Phase 1 gaps identified in code review (hard-coded demo data, intake geocode flow, schedule filter wiring)
2. Wire search view to Supabase instead of `DEMO_PROGRAMS` — real data is now available
3. Check CHHS portal for Family Child Care Homes CSV (~200-400 missing providers)
4. Run `/orchestrate` for Phase 2 parallel build (use `bypassPermissions` mode)
5. Agent A: F013 Top 50 Program Enrichment, F014 Application Deadlines
6. Agent B: F015 Program Profiles, F016 Comparison Tool, F017 User Auth & Saved Programs
7. Resend account still needed before Phase 3
8. Vercel deployment can be set up anytime

---

## Session: 2026-02-11 (Comprehensive Code Review)

### Scope
- Reviewed Phase 0 and Phase 1 implementation against `ROADMAP.md` acceptance criteria.
- Verified test/build status by running:
  - `npm run typecheck`
  - `npm test`
  - `pipeline/.venv/bin/python -m pytest -q`
  - Pipeline dry-runs: `sfusd-import --dry-run`, `ccl-import --dry-run`, `attendance-areas --dry-run`

### Verification Results
- TypeScript: pass
- Vitest: pass (9 tests, scoring only)
- Pipeline tests: pass (21 tests)
- Pipeline dry-runs: extraction/transform paths execute, but Phase 1 acceptance gaps remain (see findings)

### Findings (Completion Claim vs. Implementation)
- **F010 gap:** Intake submission still redirects to `/search` without geocode-and-discard, attendance area lookup, family persistence, or match computation.
- **F010 gap:** Location step does not render attendance-area mini-map; smart branching for subsidy question is not implemented; optional-step "Skip for now" behavior is not implemented.
- **F011/F012 gap:** Search page uses hard-coded `DEMO_PROGRAMS` instead of Supabase data.
- **F011 gap:** Attendance-area polygon overlay/toggle is not implemented.
- **F012 bug:** Schedule filter UI exists but is not applied in filtering logic.
- **F006 gap:** SFUSD pipeline command does not populate `program_sfusd_linkage` or `sfusd_rules`, and no implemented overlap dedupe between CCL/SFUSD records.
- **Pipeline data quality risk:** Provenance writer hardcodes `source: ccl` for all runs; completeness scoring is computed before geocoding and not recomputed after coordinates are added.
- **Privacy risk:** Raw home address is persisted in localStorage as part of intake state.
- **Documentation drift:** Phase 0/1 marked complete in status docs despite unchecked roadmap tasks and unresolved acceptance behaviors.

### Tracking
- Added detailed issue records to `KNOWN_ISSUES.md` for each finding above.
