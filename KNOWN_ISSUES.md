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
**Status:** Open
**Severity:** High
**Discovered:** 2026-02-11
**Description:** `SearchView` renders from an in-file `DEMO_PROGRAMS` array rather than querying Supabase/pipeline-loaded data. This blocks validation of "400+ programs", real filtering behavior, and acceptance criteria tied to production data.
**Workaround:** None in app code. You can only validate with the 12 demo records.
**Resolution:** Pending — replace demo dataset with Supabase-backed query flow and loading states.

### [PHASE-1] Intake completion path bypasses geocode-and-discard and family persistence
**Status:** Open
**Severity:** High
**Discovered:** 2026-02-11
**Description:** Final intake submission currently redirects directly to `/search` and does not geocode the address, resolve attendance area, store fuzzed coordinates, create a `families` row, or compute match scores.
**Workaround:** Demo-only navigation works, but no real intake outcome is persisted.
**Resolution:** Pending — wire `StepReview` submit to server-side geocoding + family write + scored search handoff.

### [PHASE-1] SFUSD import does not populate linkage/rules/feeder relationships
**Status:** Open
**Severity:** High
**Discovered:** 2026-02-11
**Description:** `sfusd-import` currently transforms schools and upserts to `programs` only. No loader writes `program_sfusd_linkage`, no `sfusd_rules` generation, and no implemented CCL/SFUSD entity matching logic for overlap deduplication.
**Workaround:** SFUSD programs can appear in `programs`, but kindergarten-path features cannot be trusted from pipeline output alone.
**Resolution:** Pending — add explicit transforms/loaders for attendance linkage, feeder relationships, rules, and deterministic dedupe strategy.

### [PHASE-1] Schedule filter is exposed in UI but not applied in results logic
**Status:** Open
**Severity:** High
**Discovered:** 2026-02-11
**Description:** `FilterSidebar` updates `filters.scheduleTypes`, but `SearchView` filtering does not evaluate `scheduleTypes` at all. Users can toggle schedule filters with no effect.
**Workaround:** None; schedule filter controls are currently misleading.
**Resolution:** Pending — apply `scheduleTypes` in the filtering predicate and include it in "most limiting filter" logic.

### [PHASE-1] Attendance area polygon overlay/toggle not implemented
**Status:** Open
**Severity:** Medium
**Discovered:** 2026-02-11
**Description:** Map rendering includes clustered program pins and home marker support, but no attendance area polygon source/layer or toggle control is present.
**Workaround:** None.
**Resolution:** Pending — add attendance area GeoJSON source/layers and toggle state.

### [PHASE-1] Raw home address is persisted in localStorage
**Status:** Open
**Severity:** Medium
**Discovered:** 2026-02-11
**Description:** Intake state (including `step2.homeAddress`) is serialized to localStorage on every change. This conflicts with privacy messaging that exact addresses are not retained.
**Workaround:** Manually clear localStorage or use private browsing.
**Resolution:** Pending — avoid persisting raw address, or immediately replace with derived/fuzzed location payload after geocoding.

### [PHASE-1] Provenance source is hardcoded to `ccl` for all imports
**Status:** Open
**Severity:** Medium
**Discovered:** 2026-02-11
**Description:** `write_provenance` always writes `source: "ccl"` and CCL-centric field set, including when invoked by `sfusd-import`. This produces incorrect provenance attribution.
**Workaround:** Manual interpretation/audit of provenance rows.
**Resolution:** Pending — make provenance writer source-aware and field-map-aware per pipeline command.

### [PHASE-1] Data completeness score is computed before geocoding and not recomputed
**Status:** Open
**Severity:** Medium
**Discovered:** 2026-02-11
**Description:** Completeness score is assigned during transform, before `load_programs` injects coordinates. Records can remain under-scored even after successful geocoding.
**Workaround:** Recompute completeness separately after load.
**Resolution:** Pending — recompute score post-geocode or include score recomputation in load stage.

### [PHASE-0/1] Progress claims "Phase 0/1 complete" conflict with unchecked roadmap items and implementation gaps
**Status:** Open
**Severity:** Medium
**Discovered:** 2026-02-11
**Description:** `PROGRESS.md` and `PROJECT_STATE.md` mark Phase 0/1 complete while roadmap checklists still have unchecked items (e.g., Vercel/Resend setup, policy docs) and multiple Phase 1 acceptance behaviors are not implemented in code.
**Workaround:** Treat completion status as "partially complete / feature scaffolded" until acceptance criteria are met end-to-end.
**Resolution:** Pending — reconcile status docs with measurable acceptance verification.

### [PHASE-1] CCL dataset missing Family Child Care Homes
**Status:** Open
**Severity:** Medium
**Discovered:** 2026-02-11
**Description:** The CCL CSV download only returned 404 child care centers. SF should also have ~200-400 family child care homes, which are in a separate CHHS resource CSV. The pipeline code supports the `family-home` type but the data wasn't imported.
**Workaround:** Centers-only data is usable. Family homes can be added by pointing the extractor at the Family Child Care Homes CSV resource.
**Resolution:** Pending — download and integrate the Family Child Care Homes CSV in next pipeline run.

### [PHASE-1] Pipeline env vars needed for live data load
**Status:** Open
**Severity:** Medium
**Discovered:** 2026-02-11
**Description:** The pipeline CLI is built and tested but has not been run against live Supabase. Requires `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `MAPBOX_ACCESS_TOKEN` in `pipeline/.env`.
**Workaround:** Frontend uses demo/seed data for development.
**Resolution:** Set env vars and run `pipeline ccl-import` + `pipeline sfusd-import` + `pipeline attendance-areas`.

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

*(Track shortcuts that need revisiting)*

| Item | Phase Created | Priority | Notes |
|------|---------------|----------|-------|
| *(none yet — project hasn't started building)* | | | |

---

*Last updated: February 2026*
