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

### [PHASE-4] Search Map view needs complete redesign
**Status:** In Progress
**Severity:** High
**Discovered:** 2026-02-12
**Updated:** 2026-03-29
**Description:** The search Map view is fundamentally broken. Incremental CSS fixes (flex height propagation, overflow-hidden, calc adjustments) have not resolved the core issue: the Mapbox GL container expands beyond its parent bounds, overlapping the nav header and filter sidebar.
- **Map view:** Map overflows its container, overlapping header and sidebar. Programs load correctly (501 found) but layout is unusable.
- **Split view:** Decision: REMOVE this option entirely. Simplify to Map + List only.
- **List view:** Works correctly — 501 programs, filter sidebar, proper card layout.
**Root cause:** The flex-based layout approach doesn't work reliably with Mapbox GL's container sizing. The map needs a fundamentally different container strategy.
**Next step:** F026 — Full Map + Side Panel redesign (position:absolute map, overlay panel). See ROADMAP.md.

### [PHASE-4] Program profile page needs design polish
**Status:** Open
**Severity:** Medium
**Discovered:** 2026-03-23
**Description:** The program profile page (`/programs/[slug]`) has several UX issues:
- Spacing/padding inconsistencies throughout — feels unfinished
- Location section shows "Map preview unavailable" instead of a static Mapbox image
- Save/Compare/Report buttons float awkwardly to the right, disconnected from content
- "Visit website" link appears incorrect for some programs
- Section cards (Location, Key Details, About, Schedule) don't span full page width, leaving dead space on right
**Rating:** 6/10 — functional but doesn't match the quality of the List view or homepage.
**Next step:** F027 — Program Profile Polish. See ROADMAP.md.

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
| Pipeline venv not set up locally | Phase 2 prerequisite | Medium | `pipeline/.venv` needs to be restored before Phase 2 (Data Validation) work can begin. |

---

*Last updated: 2026-03-29 (Stripped resolved issues; archived to docs/dev/V1_KNOWN_ISSUES.md)*
