# Progress Log — SF School Navigator

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

## Session: 2026-03-23 14:00 (Continuation — PROJECT_STATE update + SF Standard response)

### Completed
- **PROJECT_STATE.md fully updated** — brought cross-surface context document from 2026-02-12 to current state. Updated: overview (repo public), stack table (Vercel live, OG images), directory layout (docs/dev reorganization, new routes), current state (March 23 session entry), V2-G0 gate (Privacy/ToS/OG done), key decisions (#19-21: remove Split view, map needs redesign, repo is public), planning artifacts (new paths), priorities (P0-P4 rewrite), cross-surface notes (local dev setup, live URLs, SF Standard opportunity).
- **SF Standard response** — drafted email reply to Griffin's positive response. Advised keeping limitations for the phone call rather than email (option 3: one-line acknowledgment of "rough edges" + push to call).

### In Progress
- Nothing — clean handoff

### Issues Encountered
- None

### Next Session Should
1. **P0: Map view complete redesign** — use `frontend-design` skill, remove Split view, design from scratch
2. **P1: Program profile page polish** — spacing, map preview, action buttons, website links
3. **P2: V2-G0 gate items** — Sentry, PostHog, Lighthouse, proxy.ts rename
4. **Follow up with Griffin at The SF Standard** — schedule phone call

---

## Session: 2026-03-23 (Public Showcase + Dev Environment Revival)

### Context
Applied to The SF Standard's open call for tinkerers/hackers/community leaders. Made repo public, polished for showcase, then revived local dev environment and started fixing issues.

### Completed
- **Repo made PUBLIC** at https://github.com/matthewod11-stack/sf-school-navigator
- **README.md** — Professional showcase README with civic data story, features, tech stack, privacy architecture, getting started, hero screenshot
- **MIT LICENSE** added
- **GitHub topics** — 10 topics (civic-tech, san-francisco, education, open-data, nextjs, typescript, python, supabase, mapbox, postgis)
- **Internal docs reorganized** — Moved AGENT_BOUNDARIES.md, PROGRESS.md, PROGRESS_ARCHIVE.md, PROJECT_STATE.md, features.json to `docs/dev/`. Moved Schools.md to `docs/SPEC.md`. Removed empty `solutions/`.
- **Privacy Policy page** — `/privacy` route with editorial design, adapted from PRIVACY.md
- **Terms of Service page** — `/terms` route with data accuracy/SFUSD disclaimers
- **Footer fixed** — Dead `href="#"` links replaced with `/privacy` and `/terms` using Next.js Link
- **Dynamic OG images** — Root + per-school pages via Satori/`next/og`
- **Root metadata expanded** — openGraph, twitter card, metadataBase, title template
- **Search API fix** — Zod schema rejected `null` context (only allowed `undefined`); added `.nullable()`
- **metadataBase fix** — `NEXT_PUBLIC_SITE_URL` lacked `https://` prefix; added protocol normalization
- **Search layout partial fix** — Added `overflow-hidden`, `min-h-0`, `shrink-0`, and height adjustments. Map view still broken.
- **Local dev environment** — `npm install`, `vercel link`, `vercel env pull`, dev server running. Typecheck + 9/9 tests passing.

### Verification
- `npm run typecheck`: pass
- `npm test`: pass (9/9)
- `npm run build`: pass (all routes including 18 OG images)
- List view: 501 programs loading, looks good
- Privacy + Terms pages: rendering correctly with editorial design
- Homepage: looks great

### What's NOT Done — NEXT SESSION PRIORITY

#### P0: Search Map View — Complete Reimagining Required
The map view is fundamentally broken and needs a design-first rebuild, not incremental CSS fixes:
- **Map overlaps header and nav** — height calculation (`calc(100dvh - 16rem)`) is still not constraining the map correctly. The Mapbox container expands beyond its parent bounds.
- **Filter sidebar slides behind map** — on desktop, the sidebar and map container overlap instead of sitting side-by-side
- **The entire Map/Split view architecture is wrong** — flex-based height propagation with Mapbox GL doesn't work reliably. Consider: CSS Grid layout, or a completely separate full-screen map page instead of trying to embed it in the same flex layout as List view.
- **Remove Split view option** — confirmed unnecessary by user. Remove the "Split" toggle button and simplify to Map + List only.
- **Recommended approach**: Use `frontend-design` skill for a clean redesign of the search page with two distinct modes: List (current, working) and Map (full-width map with program panel overlay or slide-out drawer)

#### P1: Program Profile Page Polish
The profile page (`/programs/[slug]`) needs significant design work:
- **Spacing/padding issues** — Text spacing feels off throughout, "immediately takes you out of it"
- **No map preview** — Location section shows "Map preview unavailable" instead of a static Mapbox map
- **Save/Compare/Report buttons** — Floating awkwardly to the right, disconnected from the content
- **Website link is wrong** — "Visit website" link appears broken/incorrect for programs
- **Overall quality: 6/10** — Needs editorial design polish to match the quality of the List view and homepage
- **Section card widths** — Cards (Location, Key Details, About, Schedule) don't span full width, leaving dead space on the right

#### P2: Remaining V2-G0 Gate Items
- Sentry error monitoring (need account)
- PostHog analytics (need account)
- Lighthouse audit (target >80 performance, >90 accessibility)
- VoiceOver manual pass
- Visual regression sweep
- middleware.ts → proxy.ts rename (Next.js 16 deprecation warning)

#### P3: V2 Feature Work (Phases 5-7)
See `V2_ROADMAP.md` for full scope. Blocked on V2-G0 gate completion.

### Tracking
- `KNOWN_ISSUES.md`: Map/Split layout bug marked "Resolved" (partial — map still needs rebuild)
- `README.md`: created
- `LICENSE`: created
- `docs/dev/PROGRESS.md`: this session
- Applied to: https://the-san-francisco-standard.breezy.hr/p/11845b557433-open-call-for-tinkerers-hackers-and-community-leaders

---

## Session: 2026-02-12 (V2 Roadmap Planning)

### Scope
- Planned V2 roadmap covering 13 features across 3 new phases (5-7), shifting from Phase 4 polish to building more substance first.
- V2 addresses three gaps from live testing: data trust (validation pipeline), coverage (elementary K-5), and parent education (guides + contextual help).

### Completed
- **Created `V2_ROADMAP.md`** — standalone V2 roadmap document with 13 features:
  - Phase 5: Data Validation Pipeline (4 features) — URL checks, address verification, missing data flagging, combined quality dashboard
  - Phase 6: Elementary School Expansion (6 features) — type enum expansion, SFUSD elementary import, CDE private/charter import, scoring adaptation, multi-child intake, elementary filter/SEO pages
  - Phase 7: Education & Content (3 features) — static guide pages, contextual intake education, search/profile education
- **Updated `ROADMAP.md`** — added V2 reference link in header
- **Updated `features.json`** — added 13 V2 feature entries (V2-F001 through V2-F013)
- Documented dependency chain, agent boundaries, pre-validation checklist, and key technical decisions needing resolution

### Key Decisions Deferred
1. Private school data source (CDE vs NCES vs GreatSchools)
2. Multi-child data model (JSONB vs separate table)
3. Guide content format (MDX vs React components)
4. Quality issues storage (DB table vs JSON files)

### Tracking
- `V2_ROADMAP.md`: created
- `ROADMAP.md`: V2 link added
- `features.json`: 13 V2 entries added
- `PROGRESS.md`: this planning session logged

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



