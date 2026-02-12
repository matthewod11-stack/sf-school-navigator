# SF School Navigator — Known Issues & Parking Lot

> **Purpose:** Track issues, blockers, and deferred decisions.
> **Related Docs:** [ROADMAP.md](./ROADMAP.md) | [PROGRESS.md](./PROGRESS.md)

---

## How to Use This Document

**Add issues here when:**
- You encounter a bug that isn't blocking current work
- You discover something that needs investigation later
- A decision needs to be made but can wait
- You find edge cases that need handling eventually

**Format:**
```markdown
### [PHASE-X] Brief description
**Status:** Open | In Progress | Resolved | Deferred
**Severity:** Blocker | High | Medium | Low
**Discovered:** YYYY-MM-DD
**Description:** What happened / what's the issue
**Workaround:** (if any)
**Resolution:** (when resolved)
```

---

## Locked Architectural Decisions (V1)

These decisions were made during planning and should NOT be revisited during implementation:

| Area | Decision | Rationale |
|------|----------|-----------|
| Map vendor | Mapbox (geocoding, tiles, matrix) | Single vendor, polygon support, generous free tier |
| Notifications | Email only (Resend) | Defer web push complexity to V2 |
| Full profiles at launch | 50 programs | Realistic for solo dev; iterate based on user requests |
| Intake UX | Multi-step wizard (not chatbot) | Predictable, testable, reliable data extraction |
| Match display | Qualitative tiers (Strong/Good/Partial) | Avoid false precision from numeric scores |
| Program type model | Primary type + tags array | Handles hybrid programs (Montessori + religious + subsidized) |
| Data display | Two-tier: scored programs vs. basic listings | Prevents empty cards from diluting rich profiles |
| Commute | ST_Distance for search; Mapbox Matrix for profiles/compare only | Control API costs; defer isochrones to V2 |
| SFUSD policy model | Versioned/temporal rules with source + disclaimer | Not boolean flags; year-tagged, sourced, disclaimed |
| Pipeline IDs | Deterministic upsert (CCL license # / SFUSD school ID) | Protect saved_programs FK across data refreshes |
| Address storage | Geocode once, store fuzzed coords + attendance area, discard raw | Privacy by design; CCPA-ready |
| Child data | Age in months (not exact DOB); special needs as bool only | Minimize PII; no free-text health data |
| Pricing | Free for MVP | Validate demand first; revenue in V2 |
| Execution | Parallel: Agent A (data pipeline) + Agent B (app frontend) | Separable domains; Agent Teams make parallel near-free |

---

## Open Issues

### [PHASE-4] Search Map and Split views have broken layouts
**Status:** Open
**Severity:** High
**Discovered:** 2026-02-12
**Description:** The search view's three display modes (Map, Split, List) have layout issues in two of three modes:
- **Map view:** Program cards do not render at all. The right panel is blank white space. The "29 Programs" header is partially obscured behind the map/sidebar overlap.
- **Split view:** Map and program list both render, but the header is clipped by the map edge. Layout proportions appear incorrect with the map consuming too much horizontal space.
- **List view:** Works correctly — full filter sidebar, proper card layout, match badges aligned right.
**Workaround:** Use List view for browsing programs. Map and Split views are non-functional for program discovery.

### [PHASE-4] Editorial refresh reduced focus-indicator contrast below WCAG guidance
**Status:** Resolved
**Severity:** High
**Discovered:** 2026-02-12
**Resolved:** 2026-02-12
**Description:** The editorial refresh switched many focus styles from `brand-500` to `neutral-400` (`#a8a092`), including buttons and form fields. On white/cream surfaces this lands around 2.46-2.59 contrast, below the 3:1 focus-indicator target in WCAG 2.2 SC 1.4.11/2.4.11. Impacted files include `src/components/ui/button.tsx`, `src/app/(app)/search/filter-sidebar.tsx`, `src/app/(onboarding)/intake/step-child.tsx`, `src/app/(onboarding)/intake/step-location.tsx`, `src/app/(onboarding)/intake/step-schedule.tsx`, `src/components/dashboard/reminder-settings.tsx`, `src/components/dashboard/saved-programs-list.tsx`, and `src/components/programs/profile-actions.tsx`.
**Workaround:** Use browser zoom and rely on native outline cues where available; keyboard focus remains present but low-contrast.
**Resolution:** Updated focus tokens from `neutral-400` to `neutral-700` for button and form control focus rings/borders across impacted files, restoring compliant non-text contrast for focus indicators.

### [PHASE-4] Search/SEO list affordance weakened by flat card treatment
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-12
**Resolved:** 2026-02-12
**Description:** The redesign removed explicit card containers/shadows on result lists and replaced them with subtle row dividers (`src/app/(app)/search/program-card.tsx`, `src/app/(app)/search/search-view.tsx`, `src/app/(marketing)/schools/[slug]/page.tsx`). In dense lists this reduces scanability and click affordance, especially when no row is selected.
**Workaround:** Users can still interact with rows, and selected rows show a left border state.
**Resolution:** Reintroduced explicit row affordance: search cards now render with baseline border/background + hover states, search list container uses spaced card stacking, and SEO list items were restored to bordered cards with hover emphasis.

### [PHASE-4] Visual language is inconsistent across refreshed controls
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-12
**Resolved:** 2026-02-12
**Description:** Some controls use the new neutral editorial state treatment, while others still use saturated brand chips/buttons. Examples: onboarding preference chips remain blue-accent (`src/app/(onboarding)/intake/step-preferences.tsx`) while search chip states moved to dark neutral (`src/app/(app)/search/filter-sidebar.tsx`), and search overlay toggle still uses brand tint (`src/app/(app)/search/search-view.tsx`).
**Workaround:** Functionality is unaffected; inconsistency is visual/system-level.
**Resolution:** Normalized active-state treatment to editorial neutral controls by updating onboarding preference chips and the search attendance overlay toggle to match the same dark-neutral selected pattern used elsewhere.

### [PHASE-4] Badge typography update hurts dense metadata readability
**Status:** Resolved
**Severity:** Low
**Discovered:** 2026-02-12
**Resolved:** 2026-02-12
**Description:** `Badge` now forces `text-[11px] uppercase tracking-wider` globally (`src/components/ui/badge.tsx`), which makes longer metadata tags (languages, philosophy, status labels) harder to scan in high-density views.
**Workaround:** None; all badge consumers inherit this style.
**Resolution:** Restored readable default badge typography (`text-xs`, natural casing, removed forced uppercase/tracking-wide) while preserving the refreshed color styling.

### [PHASE-4] Lint command is currently non-functional on Next.js 16
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-12
**Resolved:** 2026-02-12
**Description:** `npm run lint` fails with `Invalid project directory provided, no such directory: .../lint` because the project still uses `next lint` in `package.json`, which is no longer valid in current Next.js usage.
**Workaround:** Run `npm run typecheck`, `npm test`, and `npm run build` for coverage until lint config is migrated.
**Resolution:** Migrated linting to ESLint v9 flat config (`eslint.config.mjs`) and updated the npm script to `eslint .`; lint now executes successfully and reports standard warnings/errors.

### [PHASE-1] Search view still uses hard-coded demo data (not pipeline/Supabase)
**Status:** Resolved
**Severity:** High
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** `SearchView` renders from an in-file `DEMO_PROGRAMS` array rather than querying Supabase/pipeline-loaded data. This blocks validation of "400+ programs", real filtering behavior, and acceptance criteria tied to production data.
**Workaround:** None in app code. You can only validate with the 12 demo records.
**Resolution:** Replaced with API-backed loading (`/api/search`) and real Supabase program data flow.

### [PHASE-1] Intake completion path bypasses geocode-and-discard and family persistence
**Status:** Resolved
**Severity:** High
**Discovered:** 2026-02-11
**Resolved:** 2026-02-12
**Description:** Intake completion previously only redirected to `/search` and skipped geocoding/persistence/scoring setup.
**Workaround:** N/A after latest update.
**Resolution:** Verified complete intake flow now runs geocode-and-discard, resolves attendance area, persists authenticated family profiles server-side, and stores sanitized anonymous context client-side for search continuity; no bypass remains in active flow.

### [PHASE-1] SFUSD import does not populate linkage/rules/feeder relationships
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-12
**Description:** `sfusd-import` currently transforms schools and upserts to `programs` only. No loader writes `program_sfusd_linkage`, no `sfusd_rules` generation, and no implemented CCL/SFUSD entity matching logic for overlap deduplication.
**Workaround:** SFUSD programs load and linkages now generate by attendance area, but feeder-school extraction and cross-source dedupe still need refinement.
**Resolution:** Added end-to-end linkage completion: `sfusd-import` now runs explicit CCL/SFUSD overlap filtering (`filter_sfusd_overlaps`), generates linkage rows with feeder elementary attribution from attendance areas, and continues to enforce SFUSD rules/linkage writes in the same import flow.

### [PHASE-1] Schedule filter is exposed in UI but not applied in results logic
**Status:** Resolved
**Severity:** High
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** `FilterSidebar` updates `filters.scheduleTypes`, but `SearchView` filtering does not evaluate `scheduleTypes` at all. Users can toggle schedule filters with no effect.
**Workaround:** None; schedule filter controls are currently misleading.
**Resolution:** Added schedule filtering and limiting-filter analysis support in search predicate logic.

### [PHASE-1] Attendance area polygon overlay/toggle not implemented
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** Map rendering includes clustered program pins and home marker support, but no attendance area polygon source/layer or toggle control is present.
**Workaround:** None.
**Resolution:** Added attendance area overlay source/layers to map and UI toggle control in search view.

### [PHASE-1] Raw home address is persisted in localStorage
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** Intake state (including `step2.homeAddress`) is serialized to localStorage on every change. This conflicts with privacy messaging that exact addresses are not retained.
**Workaround:** Manually clear localStorage or use private browsing.
**Resolution:** Intake localStorage persistence now sanitizes `homeAddress` and stores empty value only.

### [PHASE-1] Provenance source is hardcoded to `ccl` for all imports
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** `write_provenance` always writes `source: "ccl"` and CCL-centric field set, including when invoked by `sfusd-import`. This produces incorrect provenance attribution.
**Workaround:** Manual interpretation/audit of provenance rows.
**Resolution:** Refactored provenance writer to be source-aware with per-source tracked fields; CLI now passes `source="ccl"` or `source="sfusd"`.

### [PHASE-1] Data completeness score is computed before geocoding and not recomputed
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** Completeness score is assigned during transform, before `load_programs` injects coordinates. Records can remain under-scored even after successful geocoding.
**Workaround:** Recompute completeness separately after load.
**Resolution:** `load_programs` now recomputes `data_completeness_score` after geocode stage.

### [PHASE-0/1] Progress claims "Phase 0/1 complete" conflict with unchecked roadmap items and implementation gaps
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-12
**Description:** `PROGRESS.md` and `PROJECT_STATE.md` mark Phase 0/1 complete while roadmap checklists still have unchecked items (e.g., Vercel/Resend setup, policy docs) and multiple Phase 1 acceptance behaviors are not implemented in code.
**Workaround:** Treat completion status as "partially complete / feature scaffolded" until acceptance criteria are met end-to-end.
**Resolution:** State docs now explicitly distinguish feature-complete phases from deferred infrastructure/ops tasks; `PROJECT_STATE.md` was updated to reflect Next.js 16 and to track pending deployment/policy tasks as deferred rather than missing Phase 0/1 implementation.

### [PHASE-2] RLS enforcement is API-level only, not Supabase-level
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** F017 auth implementation enforces ownership through API-level family_id checks (user → family → saved_programs chain). Supabase-level RLS policies for `saved_programs` and `families` tables may need verification or tightening to match.
**Workaround:** API routes correctly scope all queries to authenticated user's family. Risk is limited to direct Supabase client access bypassing the API.
**Resolution:** Verified existing RLS policies in `supabase/migrations/20260210000000_initial_schema.sql` for `families` and `saved_programs` enforce ownership at Supabase level in addition to API checks.

### [PHASE-2] Corrections API cannot create `user_corrections` records
**Status:** Resolved
**Severity:** High
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** `POST /api/programs/[id]/corrections` writes `submitted_by: "anonymous"` even though `user_corrections.submitted_by` is `uuid not null` with FK to `auth.users(id)` and RLS policy `auth.uid() = submitted_by`. This makes correction submission fail for both authenticated and anonymous users.
**Workaround:** None in current app flow.
**Resolution:** Updated corrections API to require authentication and persist `submitted_by` as the authenticated `user.id`; profile actions now prompt sign-in before allowing correction submission.

### [PHASE-2] Top-50 enrichment selector excludes private programs at default settings
**Status:** Resolved
**Severity:** High
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** `select_top_programs(limit=50)` prepends all SFUSD programs (currently 88) and then truncates to `limit`, so the default run enriches SFUSD-only and never reaches private programs/web scraping tiers.
**Workaround:** Running with `--limit` above SFUSD count can include private programs, but this still doesn't satisfy "top 50" intent.
**Resolution:** Rebalanced top-program selection with SFUSD quota capping plus private-program tiers/backfill logic so default `limit=50` includes non-SFUSD programs for website enrichment.

### [PHASE-2] Re-running enrichment can overwrite verified deadline data
**Status:** Resolved
**Severity:** High
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** Enrichment writer clears `program_deadlines` for selected programs before insert. SFUSD enrichment inserts only generic open/close deadline estimates, so a later `pipeline enrich` run can wipe exact SFUSD dates and additional deadline types written by `pipeline deadlines`.
**Workaround:** Re-run `pipeline deadlines` after each enrichment run.
**Resolution:** Enrichment writer no longer clears deadline records and now inserts only new `(program_id, school_year, deadline_type)` combinations, preventing clobbering of verified deadline data.

### [PHASE-2] Intake-to-account migration is not implemented for new signups
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** Roadmap acceptance for F017 requires migrating LocalStorage intake data into `families` when users create accounts. Current auth callback only exchanges code + redirects, and saved-program creation falls back to a placeholder family record instead of intake-derived data.
**Workaround:** Users must complete intake while authenticated (or repeat intake) to populate family profile fields.
**Resolution:** Added `/api/intake/migrate` and wired `AuthProvider` to migrate stored intake/search context into `families` when a user session is established.

### [PHASE-2] Comparison view omits required attributes from roadmap acceptance
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** F016 roadmap rows require distance, match tier, attendance area, and deadlines. Current comparison table/cards include type/cost/schedule/languages/etc. but omit those required decision-making fields.
**Workaround:** Users must open individual profile pages to compare omitted fields.
**Resolution:** Extended compare API + UI to include and render match tier, distance, attendance area, and deadline summary on both desktop table and mobile cards.

### [PHASE-2] Profile page does not fully meet F015 location/SEO acceptance
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** F015 calls for a location map snippet + home/work distance and SSR meta tags including OG image. Current profile page lacks location map/distance section and `generateMetadata` sets title/description only.
**Workaround:** Users can infer location from text address and use search map; OG previews remain generic.
**Resolution:** Added a profile location section with static map snippet + home distance (when intake context exists) and expanded metadata with canonical URL, Open Graph, and Twitter card image handling.

### [PHASE-2] Provenance source attribution is incorrect for non-scraped data
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** Enrichment/deadline writers tag provenance rows as `website-scrape` even for SFUSD schedule/cost/deadline defaults and generic deadline templates. This mislabels source trust and auditability.
**Workaround:** Manual interpretation of provenance text is required.
**Resolution:** Added per-enrichment provenance source tagging (`sfusd`, `website-scrape`, `manual`) and corrected SFUSD deadline provenance records to use `sfusd`.

### [PHASE-2] Provenance tooltip can show stale/incorrect row when multiple entries exist
**Status:** Resolved
**Severity:** Low
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** Profile provenance query has no ordering and UI reduces records to one per `field_name` using a Map overwrite. With multiple provenance records over time, displayed snippet/date may be nondeterministic.
**Workaround:** Inspect raw `field_provenance` rows directly for audits.
**Resolution:** Ordered provenance query by newest verification/extraction timestamps and updated field selection logic to keep the first (latest) authoritative row per field.

### [PHASE-1] CCL dataset missing Family Child Care Homes
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-12
**Description:** The CCL CSV download only returned 404 child care centers. SF should also have ~200-400 family child care homes, which are in a separate CHHS resource CSV. The pipeline code supports the `family-home` type but the data wasn't imported.
**Workaround:** Centers-only data is usable. Family homes can be added by pointing the extractor at the Family Child Care Homes CSV resource.
**Resolution:** Replaced single-source CSV extraction with CHHS datastore ingestion for both center and family-home resources, deduped by facility number, and validated in dry-run (`684` SF licensed facilities extracted across both sources).

### [PHASE-3] Reminder cron cannot access protected reminder data
**Status:** Resolved
**Severity:** High
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** `GET /api/cron/reminders` uses `createClient()` (`src/app/api/cron/reminders/route.ts`) which is backed by `NEXT_PUBLIC_SUPABASE_ANON_KEY` and cookie auth (`src/lib/supabase/server.ts`). In cron context there is no authenticated user, so RLS on `saved_programs`/`families` blocks reads, and `supabase.auth.admin.listUsers()` also requires a service-role client. Result: reminder candidate lookup can silently collapse to zero and reminders will not send reliably.
**Workaround:** Monitor deadlines manually from the dashboard timeline.
**Resolution:** Added a server-only admin Supabase client (`src/lib/supabase/admin.ts`) and moved cron reminder queries + user email resolution to service-role execution (`src/app/api/cron/reminders/route.ts`), restoring access under RLS.

### [PHASE-3] Unsubscribe links fail for email recipients
**Status:** Resolved
**Severity:** High
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** `/api/unsubscribe` updates `saved_programs.reminder_lead_days` using the same anon/cookie client (`src/app/api/unsubscribe/route.ts`). Email recipients are unauthenticated when hitting this endpoint, so RLS prevents updates to `saved_programs`; unsubscribe can return failure and reminders remain enabled.
**Workaround:** Sign in and set reminder lead time to `Off` from `/dashboard`.
**Resolution:** Migrated unsubscribe updates to admin client and replaced raw UUID links with signed, expiring tokens (`src/lib/notifications/unsubscribe-token.ts`, `src/app/api/unsubscribe/route.ts`, `src/app/api/cron/reminders/route.ts`).

### [PHASE-3] Deadline dates are shifted by one day in Pacific time
**Status:** Resolved
**Severity:** High
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** Deadline logic parses ISO date strings with `new Date("YYYY-MM-DD")` and then normalizes with `setHours(0,0,0,0)` (e.g., `src/app/api/cron/reminders/route.ts`, `src/components/dashboard/deadline-card.tsx`, `src/app/api/programs/compare/route.ts`). In US/Pacific, `"2026-01-31"` is interpreted as UTC midnight and displays/calculates as **Jan 30, 2026**, causing reminder send-day and UI labels to drift by one day.
**Workaround:** Treat deadline badges as approximate and verify exact dates against source links.
**Resolution:** Introduced date-only parsing/formatting helpers (`src/lib/dates/date-only.ts`) and applied them across reminder calculation/rendering paths (`src/app/api/cron/reminders/route.ts`, `src/components/dashboard/deadline-card.tsx`, `src/components/dashboard/deadline-timeline.tsx`, `src/components/programs/application-section.tsx`, `src/lib/notifications/email.ts`, `src/app/api/programs/compare/route.ts`, `src/lib/db/queries/dashboard.ts`).

### [PHASE-3] Unknown deadlines are labeled as "Passed"
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** `getUrgency(null)` returns `{ label: "Date unknown", color: "gray" }`, but `DeadlineCard` maps gray to visible text `"Passed"` (`src/components/dashboard/deadline-card.tsx`). Cards with no date can therefore show contradictory messaging: "Passed" plus "Contact program for dates."
**Workaround:** Ignore the urgency word when date is missing and rely on the "Contact program for dates" text.
**Resolution:** Updated deadline urgency state mapping so unknown dates render explicit "Unknown" status while "Passed" is only used for known past dates (`src/components/dashboard/deadline-card.tsx`).

### [PHASE-3] F020 static generation acceptance is not met for `/schools/[slug]`
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** Build output currently reports `ƒ /schools/[slug]` (dynamic), not `○` static. SEO query helpers (`src/lib/seo/queries.ts`) call `createClient()` from `src/lib/supabase/server.ts`, which reads `cookies()` and forces dynamic rendering. This conflicts with roadmap acceptance requiring build-time static generation via `generateStaticParams`.
**Workaround:** Pages still render server-side and are crawlable, but they are not pre-generated static artifacts.
**Resolution:** Added static-safe Supabase public client (`src/lib/supabase/public.ts`), switched SEO queries to that client (`src/lib/seo/queries.ts`), and enforced static params rendering (`dynamic = "force-static"`, `dynamicParams = false`) on `/schools/[slug]` (`src/app/(marketing)/schools/[slug]/page.tsx`). Build now reports the route as SSG (`●`).

### [PHASE-3] Provenance tooltips are not keyboard-accessible
**Status:** Resolved
**Severity:** Low
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** `ProvenanceTooltip` opens on `onMouseEnter`/`onMouseLeave` only and has no focus/keyboard trigger path (`src/components/programs/provenance-tooltip.tsx`). This leaves source details inaccessible for keyboard-only users despite Phase 3 accessibility goals.
**Workaround:** Use pointer hover to view provenance details.
**Resolution:** Added focus/blur, Enter/Space/Escape keyboard handling, and `role="tooltip"`/`aria-*` semantics to provenance tooltips (`src/components/programs/provenance-tooltip.tsx`).

### [PHASE-1] Pipeline env vars needed for live data load
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** The pipeline CLI is built and tested but has not been run against live Supabase. Requires `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `MAPBOX_ACCESS_TOKEN` in `pipeline/.env`.
**Workaround:** Frontend uses demo/seed data for development.
**Resolution:** Environment configured and live data/quality checks executed by user.

---

## Issues Discovered During Planning

### [PLANNING] SFUSD 2026-27 TK feeder maps may not be published yet
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2026-02-10
**Resolved:** 2026-02-12
**Description:** The TK feeder system is new for 2026-27. SFUSD may not have published the official feeder maps by the time development starts. The `sfusd_rules` table needs to handle a "Pending" state where K-path preview is hidden if data isn't available yet.
**Workaround:** Build `sfusd_rules` to support `confidence: 'uncertain'` state. Hide K-path preview for programs where feeder data is unconfirmed.
**Resolution:** Implemented the pending-state strategy in production flow: rules retain `confidence: "uncertain"` where needed, and SFUSD linkage now provides best-effort feeder attribution from attendance-area linkage so missing official feeder maps no longer block feature behavior.

### [PLANNING] Codex CLI requires trusted git directory
**Status:** Resolved
**Severity:** Low
**Discovered:** 2026-02-10
**Resolved:** 2026-02-10
**Description:** Codex CLI (`codex exec`) failed in background processes because the working directory wasn't a git repo or wasn't trusted.
**Resolution:** Initialized git repo. For future sessions, ensure Codex commands run from within the repo root.

---

## V2 Parking Lot (Deferred from MVP)

> Features explicitly deferred from V1. Tracked here for future prioritization.

### High Impact

| Feature | Complexity | Notes |
|---------|------------|-------|
| Decision Tree Visualization (PreK → K → middle) | High | Requires K-8 data out of MVP scope |
| AI-Powered Conversational Advisor | High | Natural language Q&A about options; needs prompt engineering + guardrails |
| Waitlist Intelligence | High | Aggregated anonymized waitlist movement data; builds over time with user opt-in |
| Community Layer (parent reviews) | Medium | Structured attribute reviews, not star ratings; moderation needed |

### Medium Impact

| Feature | Complexity | Notes |
|---------|------------|-------|
| Web Push Notifications | Medium | Service worker + browser permissions; email covers MVP |
| Commute Isochrones (time-of-day) | Medium | Mapbox Isochrone API; "all programs in 15 min from home at 8am" |
| Split-Parent Commute | Medium | Parent A drops off, Parent B picks up; different work locations |
| Total Cost Calculator | Medium | Multi-year projections with tuition increases, subsidy value |
| Elementary + Middle + High School Coverage | High | Expand DB to all SFUSD + charter + private K-12 |
| Draw Search Area (Redfin pattern) | Low | Custom polygon drawing on map for commute corridors |

### Lower Priority

| Feature | Complexity | Notes |
|---------|------------|-------|
| Yelp/Google Review Integration | Low | Aggregate ratings or links to external reviews |
| Subsidy Eligibility Calculator | Medium | Full rule engine for Baby C, Head Start, CSPP; maintain as policies change |
| Multi-City Expansion | High | Architecture is city-agnostic; needs new data + city rules per market |
| Full SFUSD Lottery Simulator | High | Model tiebreakers, preferences, historical acceptance rates |

---

## Edge Cases to Handle

| Case | Phase | Priority | Notes |
|------|-------|----------|-------|
| Apartment buildings spanning attendance area boundaries | 1 | Medium | Point-in-polygon may return wrong area; need "This doesn't look right" escape hatch |
| Addresses that don't geocode (PO boxes, new construction) | 1 | Medium | Graceful fallback; allow manual neighborhood selection |
| Programs with no website (family childcare homes) | 1 | Low | CCL data only; show "basic listing" with available info |
| Pregnant parents (no DOB yet, only due date) | 1 | Medium | Intake supports expected due date → calculate future eligibility |
| Twins/multiples needing 2+ spots | 1 | Low | Flag in intake; note in search results that availability may be limited |
| Programs that close mid-year | 2 | Medium | CCL data may lag; rely on crowdsourced corrections |
| Cost data that changes between application and enrollment | 2 | Low | Show school_year tag; note "verify current rates with program" |
| Parent enters SF address but works outside city | 1 | Low | Commute calc still works; no attendance area implications for non-SF work |
| Zero search results after intake | 1 | High | Must show constraint relaxation suggestions (which filter is most limiting) |
| Sort by cost when many programs have null cost data | 1 | Medium | Null costs sort to bottom; show "cost not available" |

---

## Technical Debt

| Item | Phase Created | Priority | Notes |
|------|---------------|----------|-------|
| Lighthouse audit not yet run | Phase 3 | Medium | F022 added ARIA/keyboard/touch targets but no automated Lighthouse score verified yet. Run before beta. |
| VoiceOver manual testing pending | Phase 3 | Medium | F022 ARIA attributes added; manual screen reader walkthrough needed to verify flow. |
| Visual regression testing after editorial refresh | Pre-Phase 4 | Medium | 40 files updated with new palette/typography. No automated visual regression tests. Manual check of all 7 routes recommended before beta. |
| Google Fonts network dependency | Pre-Phase 4 | Low | Libre Baskerville + Source Sans 3 loaded via `next/font/google` with `display: swap`. Fallback to Georgia/system-ui if Google Fonts CDN is slow. |

---

*Last updated: 2026-02-12 (Known-issues remediation complete)*
