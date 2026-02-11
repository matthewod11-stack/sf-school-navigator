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

*(None yet — project is in pre-build planning phase)*

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
