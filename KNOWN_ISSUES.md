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

### [PHASE-1] Search view still uses hard-coded demo data (not pipeline/Supabase)
**Status:** Resolved
**Severity:** High
**Discovered:** 2026-02-11
**Resolved:** 2026-02-11
**Description:** `SearchView` renders from an in-file `DEMO_PROGRAMS` array rather than querying Supabase/pipeline-loaded data. This blocks validation of "400+ programs", real filtering behavior, and acceptance criteria tied to production data.
**Workaround:** None in app code. You can only validate with the 12 demo records.
**Resolution:** Replaced with API-backed loading (`/api/search`) and real Supabase program data flow.

### [PHASE-1] Intake completion path bypasses geocode-and-discard and family persistence
**Status:** In Progress
**Severity:** High
**Discovered:** 2026-02-11
**Description:** Intake completion previously only redirected to `/search` and skipped geocoding/persistence/scoring setup.
**Workaround:** N/A after latest update.
**Resolution:** Added `/api/intake/complete` server flow with geocode-and-discard, attendance area resolution, sanitized search context persistence, and authenticated `families` upsert. Remaining: optional expansion of anonymous persistence strategy.

### [PHASE-1] SFUSD import does not populate linkage/rules/feeder relationships
**Status:** In Progress
**Severity:** Medium
**Discovered:** 2026-02-11
**Description:** `sfusd-import` currently transforms schools and upserts to `programs` only. No loader writes `program_sfusd_linkage`, no `sfusd_rules` generation, and no implemented CCL/SFUSD entity matching logic for overlap deduplication.
**Workaround:** SFUSD programs load and linkages now generate by attendance area, but feeder-school extraction and cross-source dedupe still need refinement.
**Resolution:** Added `ensure_sfusd_rules` + `load_sfusd_linkages` and wired both into `sfusd-import`. Remaining: richer feeder attribution and explicit CCL/SFUSD dedupe strategy.

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
**Status:** In Progress
**Severity:** Medium
**Discovered:** 2026-02-11
**Description:** `PROGRESS.md` and `PROJECT_STATE.md` mark Phase 0/1 complete while roadmap checklists still have unchecked items (e.g., Vercel/Resend setup, policy docs) and multiple Phase 1 acceptance behaviors are not implemented in code.
**Workaround:** Treat completion status as "partially complete / feature scaffolded" until acceptance criteria are met end-to-end.
**Resolution:** Phase 1 gaps addressed in remediation session (demo data → real API, schedule filter, attendance overlay, localStorage redaction). Remaining unchecked items (Vercel deploy, Resend setup, ToS/Privacy drafts, Supabase query logging config) are infrastructure tasks deferred to Phase 3/4.

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
**Status:** Open
**Severity:** Medium
**Discovered:** 2026-02-11
**Description:** The CCL CSV download only returned 404 child care centers. SF should also have ~200-400 family child care homes, which are in a separate CHHS resource CSV. The pipeline code supports the `family-home` type but the data wasn't imported.
**Workaround:** Centers-only data is usable. Family homes can be added by pointing the extractor at the Family Child Care Homes CSV resource.
**Resolution:** Pending — download and integrate the Family Child Care Homes CSV in next pipeline run.

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
**Status:** Open
**Severity:** Medium
**Discovered:** 2026-02-10
**Description:** The TK feeder system is new for 2026-27. SFUSD may not have published the official feeder maps by the time development starts. The `sfusd_rules` table needs to handle a "Pending" state where K-path preview is hidden if data isn't available yet.
**Workaround:** Build `sfusd_rules` to support `confidence: 'uncertain'` state. Hide K-path preview for programs where feeder data is unconfirmed.
**Resolution:** Pending data availability from SFUSD.

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

---

*Last updated: 2026-02-11 (F022 accessibility pass complete)*
