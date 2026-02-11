# ROADMAP — SF School Navigator MVP

> **Spec:** Schools.md
> **Feedback:** consolidated_feedback.md (Claude + Codex + Gemini)
> **Execution Mode:** PARALLEL-READY
> **Quality Bar:** Polished
> **Estimated Duration:** 14–18 weeks at ~20h/week
> **Validated:** 2026-02-10
> **Validation Sources:** Claude (in-session), Gemini (CLI)
> **Status:** APPROVED WITH CHANGES
> **Changes Applied:** 2 critical, 3 important (see validation notes below)

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Map vendor | Mapbox (geocoding, tiles, matrix) | Single vendor, polygon support, generous free tier |
| Notifications | Email only (Resend) | Defer web push complexity to V2 |
| Full profiles at launch | 50 programs | Realistic for solo dev; iterate based on user requests |
| Intake UX | Multi-step wizard (not chatbot) | Predictable, testable, reliable data extraction |
| Match display | Qualitative tiers (Strong/Good/Partial) | Avoid false precision from numeric scores |
| Program type model | Primary type + tags array | Handles hybrid programs (Montessori + religious + subsidized) |
| Data display | Two-tier: scored programs vs. basic listings | Prevents empty cards from diluting rich profiles |
| Commute | PostGIS ST_Distance for search results; Mapbox Matrix (travel time) only on profile/compare pages | Defer isochrones and split-parent routing to V2 |
| SFUSD policy model | Versioned/temporal rules with source + disclaimer | Not boolean flags; year-tagged, sourced, disclaimed |
| Execution | Parallel: Data Pipeline (Agent A) + App Frontend (Agent B) | Separable domains; Agent Teams make parallel near-free |

---

## V1 Success Criteria

The MVP succeeds if:

1. A parent can enter their family situation and see a personalized, filtered list of PreK programs in SF
2. Programs display accurate, structured data with clear "last verified" dates
3. Parents can save, compare (2-4), and track application status for programs
4. The kindergarten path connection is visible for SFUSD programs (with disclaimers)
5. Email reminders fire for upcoming application deadlines
6. 50+ programs have full profiles; 400+ have basic listings
7. Data is trustworthy enough that <5% of profiles get flagged as inaccurate by beta testers

---

## Out of Scope (V2 Parking Lot)

Explicitly deferred. Do NOT build these in V1:

- [ ] Web push notifications (email only for MVP)
- [ ] Real-time commute isochrones / time-of-day routing
- [ ] Split-parent pickup/dropoff commute optimization
- [ ] AI-powered conversational advisor (chatbot)
- [ ] Parent reviews / community layer
- [ ] Waitlist intelligence / prediction
- [ ] Total cost calculator (multi-year projection)
- [ ] Decision tree visualization (PreK → K → middle)
- [ ] Elementary / middle / high school coverage
- [ ] Multi-city expansion
- [ ] Draw-your-own search area on map (Redfin pattern)
- [ ] Yelp/Google aggregate review scores (link to external reviews is fine)
- [ ] Subsidy eligibility calculator (flag + link out only)
- [ ] Full SFUSD lottery explanation (short summary + link to Parent Coalition)

---

## Phase 0: Foundation (Shared — Team Lead)

**Duration:** 1–2 weeks
**Purpose:** Scaffold project, define shared contracts, design database schema incorporating all review feedback.

### F001: Project Scaffolding

- [x] Initialize Next.js 15 (App Router) + Tailwind CSS + TypeScript
- [x] Configure Supabase project (PostgreSQL + PostGIS + Auth)
- [x] Set up Mapbox account and API keys
- [ ] Configure Vercel deployment with preview deploys
- [ ] Set up Resend account for transactional email
- [x] Configure environment variables (.env.local, Vercel env)
- [x] Initialize git repo with .gitignore (exclude .env, node_modules, .next)
- **Acceptance:** `npm run dev` serves a blank Next.js app. Supabase dashboard accessible. Mapbox token works. Vercel preview deploy succeeds on push.
- **Verification:** Deploy a "Hello World" page to Vercel preview URL.

### F002: Database Schema Design

- [x] Design and apply schema migrations incorporating review feedback:

**Core tables:**
```
programs
  - id, name, slug, address, coordinates (PostGIS POINT, SRID 4326)
  - phone, website, primary_type (enum), license_number, license_status
  - logo_url, featured_image_url
  - age_min_months, age_max_months
  - potty_training_required (bool|null)
  - data_completeness_score (0-100)
  - last_verified_at, data_source, created_at, updated_at

program_tags
  - program_id, tag (e.g. "montessori", "outdoor", "accepts-subsidies", "co-op")

program_schedules
  - program_id, schedule_type (enum: full-day, half-day-am, half-day-pm)
  - days_per_week (2,3,5), open_time, close_time
  - extended_care_available (bool), summer_program (bool)
  - operates (enum: school-year, full-year)
  - monthly_cost_low, monthly_cost_high
  - registration_fee, deposit

program_languages
  - program_id, language, immersion_type (enum: full, dual, exposure)

program_costs
  - program_id, school_year (e.g. "2026-27")
  - tuition_monthly_low, tuition_monthly_high
  - registration_fee, deposit
  - accepts_subsidies (bool), financial_aid_available (bool)

program_deadlines
  - program_id, school_year, deadline_type (enum: application-open, application-close, notification, waitlist)
  - date, description, source_url, verified_at

sfusd_rules
  - id, school_year, rule_type (enum: attendance-area, tiebreaker, feeder, lottery)
  - rule_text, explanation_plain, source_url, confidence (enum: confirmed, likely, uncertain)
  - effective_date, reviewed_at

attendance_areas
  - id, name, geometry (PostGIS POLYGON, SRID 4326)
  - school_year, linked_elementary_school_ids

program_sfusd_linkage
  - program_id, attendance_area_id, school_year
  - feeder_elementary_school, tiebreaker_eligible (bool)
  - rule_version_id (FK to sfusd_rules)

field_provenance
  - id, program_id, field_name, value_text
  - source (enum: ccl, sfusd, website-scrape, manual, user-correction)
  - raw_snippet (original text AI extracted from)
  - extracted_at, verified_at, verified_by

user_corrections
  - id, program_id, field_name, suggested_value
  - submitted_by (user_id), submitted_at
  - status (enum: pending, approved, rejected), reviewed_at, reviewed_by

families
  - id, user_id
  - child_dob (encrypted or null — store age_months instead if possible)
  - child_expected_due_date
  - has_special_needs (bool|null — no free text)
  - has_multiples (bool), num_children (int)
  - potty_trained (bool|null)
  - home_attendance_area_id (FK — store this, not raw address)
  - home_coordinates_fuzzed (PostGIS POINT — rounded to ~200m)
  - budget_monthly_max, subsidy_interested (bool)
  - schedule_days_needed, schedule_hours_needed
  - transport_mode (enum: car, transit, walk, bike)
  - preferences JSONB (philosophy[], languages[], must_haves[], nice_to_haves[])
  - created_at, updated_at

saved_programs
  - family_id, program_id
  - status (enum: researching, toured, applied, waitlisted, accepted, enrolled, rejected)
  - notes, reminder_lead_days (default: 14)
  - created_at, updated_at

geocode_cache
  - address_hash, coordinates (PostGIS POINT), attendance_area_id
  - provider (enum: mapbox), cached_at
```

- [x] Enable PostGIS extension in Supabase
- [x] Create GiST indexes on: `programs.coordinates`, `attendance_areas.geometry`
- [x] Configure Row Level Security (RLS): default deny-all, whitelist per table
- [x] Write Supabase RLS policies: users can only read/write their own family + saved_programs
- **Acceptance:** All tables created. RLS enabled. GiST indexes built. A test point-in-polygon query returns correct attendance area.
- **Verification:** Run `SELECT * FROM attendance_areas WHERE ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326));` and verify it returns a valid area.

### F003: Shared Types & Config

- [x] Define TypeScript domain types matching DB schema (`types/domain.ts`)
- [x] Define API request/response types (`types/api.ts`)
- [x] Define Zod validation schemas for all user inputs (`lib/validation/`)
- [x] Create SF-specific config module (`lib/config/cities/sf/`)
  - SFUSD rule definitions (loaded from DB, cached)
  - Neighborhood names and rough boundaries
  - Subsidy income thresholds for Baby C eligibility flagging
- [x] Define match scoring algorithm:
  - **Hard filters** (must-haves): program excluded if unmet (e.g., budget ceiling, required language, potty training)
  - **Weighted boosts** (nice-to-haves): 0-10 per attribute, configurable
  - **Missing data**: neutral (no boost/penalty), program card shows "info not available" badge
  - **Display**: qualitative tiers — "Strong Match" (80%+), "Good Match" (60-79%), "Partial Match" (40-59%), no score shown below 40% or if data completeness < 50%
- [x] Write scoring function with tests (`lib/scoring/`)
- [x] Define slug generation strategy: `slugify(name)-neighborhood` (unique, stable across re-imports)
- **Acceptance:** Types compile. Zod schemas validate sample inputs. Scoring function returns correct tiers for 5 test cases (strong match, good match, partial match, missing data, filtered out).
- **Verification:** `npm run typecheck && npm test -- scoring`

### F004b: Seed Data for Parallel Development

- [x] Create 10–15 realistic seed programs (mix of types, data completeness levels)
- [x] Include 2–3 attendance area polygons (covering common SF neighborhoods)
- [x] Include sample SFUSD rules and feeder relationships
- [x] Load via a `seed.sql` script that both agents can use during development
- [x] Seed data enables Agent B to build UI without waiting for Agent A's pipeline
- **Acceptance:** `npm run db:seed` loads test data. Map shows pins. Intake resolves an attendance area. Profile page renders with complete and incomplete program examples.
- **Verification:** Run seed script. Navigate intake → map → profile → compare with seed data.

### F004: Privacy & Data Architecture

- [x] Write PRIVACY.md documenting data handling decisions:
  - Home addresses: geocode once via Mapbox, store fuzzed coordinates (~200m) + attendance area ID, discard raw address
  - Work addresses: geocode once, store fuzzed coordinates, discard raw address
  - Child DOB: store as age_in_months at intake time (not exact date) unless user explicitly saves profile
  - Special needs: boolean only, no free text
  - All PII in dedicated tables with RLS
  - No PII in logs, error reports, or analytics
- [x] Implement geocode-and-discard flow in `lib/geo/geocode.ts`
- [ ] Configure Supabase to not log query parameters on family-related tables
- [ ] Write Terms of Service and Privacy Policy drafts (can be refined later)
- [x] Add SFUSD disclaimer text: "Based on current SFUSD policies as of [date]. Policies are subject to change. Verify all information with SFUSD directly. This tool provides informational guidance, not official enrollment advice."
- **Acceptance:** Geocoding function returns fuzzed coordinates + attendance area. No raw addresses stored in DB. Privacy policy draft exists.
- **Verification:** Manual test: enter address → verify DB stores only fuzzed point + area ID, not original string.

---

## Phase 1: Data Pipeline + App Shell (PARALLEL)

**Duration:** 3–4 weeks
**Agent A:** Data Pipeline (Python)
**Agent B:** App Frontend (Next.js)

### Agent A: Data Pipeline

#### F005: CCL Data Import

- [x] Download CA Community Care Licensing dataset for San Francisco county
- [x] Write Python extraction script (`pipeline/src/pipeline/extract/ccl.py`)
- [x] Parse: facility name, address, license type, capacity, license status, license number, ages served
- [x] Geocode all addresses via Mapbox, store in `geocode_cache`
- [x] Normalize to `programs` table schema
- [x] Use CCL license number as stable key for deterministic upsert (prevents breaking `saved_programs` FK references on re-import)
- [x] Load into Supabase with `data_source = 'ccl'`
- [x] Store raw CCL record in `field_provenance` for each field
- [x] Set `data_completeness_score` based on fields populated
- **Acceptance:** 400+ licensed SF programs loaded into `programs` table. Each has name, address, coordinates, license info, capacity, primary type. Completeness scores calculated.
- **Verification:** `SELECT COUNT(*) FROM programs WHERE data_source = 'ccl';` returns 400+. Sample 10 programs and verify address/name accuracy against CCL source.

#### F006: SFUSD Data Import

- [x] Extract SFUSD Pre-K and TK program data from enrollment PDFs/website
- [x] Use SFUSD school ID as stable key for deterministic upsert (prevents breaking saved_programs FK on re-import)
- [x] Map each program to attendance area
- [x] Extract feeder school relationships (2026-27 TK feeder system)
- [x] Load into `programs` (or match to existing CCL records by address/name)
- [x] Load attendance area data into `program_sfusd_linkage`
- [x] Create initial `sfusd_rules` records for 2026-27 school year
- [x] Entity match: deduplicate programs that appear in both CCL and SFUSD data
- **Acceptance:** All SFUSD Pre-K and TK programs loaded. Each linked to attendance area. Feeder relationships stored with school_year tag. Entity matching deduplicates >90% of overlaps.
- **Verification:** Pick 5 known SFUSD TK programs. Verify each has correct attendance area and feeder school in DB.

#### F007: Attendance Area Polygons

- [x] Download SFUSD attendance area boundary GeoJSON/Shapefile
- [x] Validate geometries (no self-intersections, correct SRID 4326)
- [x] Load into `attendance_areas` table with PostGIS
- [x] Test point-in-polygon queries for 10 known SF addresses
- [x] Link each attendance area to its elementary school(s)
- **Acceptance:** All SFUSD attendance areas loaded as valid PostGIS polygons. Point-in-polygon query correctly identifies area for 10 test addresses across different neighborhoods.
- **Verification:** Query 10 addresses spanning Sunset, Mission, Noe Valley, Pacific Heights, Richmond, SOMA, etc. Verify each returns expected attendance area.

#### F008: Data Quality Framework

- [x] Build freshness check script (`pipeline/src/pipeline/quality/freshness_checks.py`)
- [x] Build schema validation script (`pipeline/src/pipeline/quality/schema_checks.py`)
- [x] Build diff report for data updates (`pipeline/src/pipeline/quality/diff_report.py`)
- [x] Create `source_mappings.yaml` and `enums.yaml` config files
- [x] Set up data snapshots directory for before/after comparison
- **Acceptance:** Quality scripts run against loaded data. Freshness report shows last-updated dates per source. Schema check catches invalid records. Diff report shows changes between snapshots.
- **Verification:** Intentionally insert a bad record (missing coordinates). Verify schema check catches it.

### Agent B: App Frontend

#### F009: App Shell & Routing

- [x] Set up route groups: `(marketing)`, `(onboarding)`, `(app)`
- [x] Create layout components for each group
- [x] Homepage with value prop: "Find the right preschool for your family in San Francisco"
- [x] "Get Started" CTA → routes to intake
- [x] Navigation header (minimal: logo, "Get Started" / "Dashboard" if logged in)
- [x] Mobile-responsive base layout (mobile-first)
- [x] Configure Supabase client (server + client components)
- **Acceptance:** Homepage renders with value prop and CTA. Route groups load correct layouts. Mobile layout works on 375px viewport. Supabase client initializes without errors.
- **Verification:** Visual check on mobile and desktop. Click "Get Started" → navigates to intake.

#### F010: Intake Wizard

- [x] Multi-step form (not chatbot): 4-5 screens
  - **Step 1:** Child info — DOB (or expected due date), potty training status, special needs (bool), multiples
  - **Step 2:** Location — home address (geocoded, then discarded), show attendance area on mini-map
  - **Step 3:** Budget & schedule — monthly max, subsidy interest, days/hours needed, start date
  - **Step 4:** Preferences — philosophy (multi-select), languages (multi-select), must-haves vs. nice-to-haves
  - **Step 5:** Review & results
- [x] Smart branching: skip subsidy question if budget > $3,000/month
- [x] Warm, friendly copy (not form-like)
- [x] Progress indicator (step N of 5)
- [x] LocalStorage persistence: intake state saved on every step change
- [x] On completion: geocode address → store fuzzed coordinates + attendance area → compute match scores → redirect to results
- [x] Allow "Skip for now" on optional steps (preferences)
- [x] Zod validation on each step before advancing
- **Acceptance:** User completes 5-step wizard. Address geocoded, fuzzed, stored. Attendance area identified and shown on mini-map. All data validated with Zod. State persists in LocalStorage across page refreshes. Results page shows matched programs.
- **Verification:** Complete intake with test data. Refresh mid-wizard → state preserved. Complete → verify DB has family record with fuzzed coordinates and attendance area (no raw address).

#### F011: Map View

- [x] Mapbox GL JS integration with React wrapper
- [x] Display program pins from Supabase query
- [x] Pin styles: shapes + colors for accessibility (circle=center, square=home-based, diamond=SFUSD, triangle=religious)
- [x] Two-tier pins: solid/large for scored programs, small/hollow for basic listings
- [x] Attendance area polygon overlay (toggle-able)
- [x] User's (fuzzed) home location marker
- [x] Click pin → program summary popup
- [x] Cluster pins at low zoom levels
- [x] Responsive: full-screen on mobile, side-panel on desktop
- **Acceptance:** Map renders with all programs as pins. Pins use shapes+colors. Attendance area overlay works. Clicking a pin shows program summary. Clusters at low zoom. Works on mobile and desktop.
- **Verification:** Load map with 400+ programs. Verify no performance issues. Toggle attendance area overlay. Click 3 pins. Test on mobile viewport.

#### F012: List View & Filtering

- [x] Toggle between map and list view
- [x] List view: program cards sorted by match score (default), distance, or cost
- [x] Each card shows: name, type badge, cost range, ages, hours, languages, distance, match tier badge, "last verified" date
- [x] Facet filter sidebar (pre-filled from intake, editable):
  - Budget range slider
  - Program type checkboxes
  - Language dropdown
  - Schedule (full-day, half-day, etc.)
  - Distance radius
  - "Show only scored programs" toggle
- [x] Text search bar: find programs by name (pg_trgm or ILIKE on program name)
- [x] Filter changes update both list and map simultaneously
- [x] "No results" state with suggestions to relax constraints (show which filter is most limiting)
- [x] Loading skeleton states
- **Acceptance:** List view renders program cards with all fields. Sorting works (score, distance, cost). Filters update results in real-time. "No results" shows constraint relaxation suggestions. Skeleton loading states display during data fetch.
- **Verification:** Apply filters that produce 0 results → verify suggestion appears. Sort by each option → verify order. Change a filter → verify map pins update too.

---

## Phase 2: Rich Features + Data Enrichment (PARALLEL)

**Duration:** 3–4 weeks
**Agent A:** Data enrichment (top 50 programs)
**Agent B:** Profiles, Compare, Save, Auth

### Agent A: Data Enrichment

#### F013: Top 50 Program Enrichment

- [ ] Identify top 50 programs (by enrollment volume / neighborhood coverage)
- [ ] For each: extract from website using AI-assisted scraping
  - Logo and featured photo (store URLs in `programs.logo_url`, `programs.featured_image_url`)
  - Tuition breakdown (store in `program_costs` with school_year)
  - Schedule options (store in `program_schedules`)
  - Educational philosophy description
  - Languages offered (store in `program_languages`)
  - Application process, deadlines (store in `program_deadlines`)
  - Before/after care details
  - Staff-to-child ratios
- [ ] Store raw text snippet in `field_provenance` for every AI-extracted field
- [ ] Manual verification pass on all 50 programs
- [ ] Update `data_completeness_score` and `last_verified_at`
- [ ] Use Firecrawl or Apify for extraction scaffolding where possible
- **Acceptance:** 50 programs have complete profiles: cost, schedule options, philosophy, languages, deadlines. Each AI-extracted field has provenance (raw snippet stored). All 50 manually verified. Completeness scores > 80%.
- **Verification:** Query `SELECT COUNT(*) FROM programs WHERE data_completeness_score > 80;` returns 50+. Spot-check 10 programs against their actual websites.

#### F014: Application Deadlines Collection

- [ ] Collect structured deadline data for SFUSD programs (application open/close dates)
- [ ] Collect deadline data for top 50 private programs where available
- [ ] Store in `program_deadlines` with school_year, source_url, verified_at
- [ ] Mark programs with unknown deadlines as "Contact program for dates"
- [ ] For programs without exact dates, add `generic_deadline_estimate` (e.g., "Applications typically open Jan–Feb") based on program type norms, clearly labeled as estimates
- **Acceptance:** SFUSD program deadlines loaded. At least 30 of top 50 programs have deadline data. Unknown deadlines clearly flagged. Generic estimates provided for remaining programs so tracker isn't empty.
- **Verification:** Query `program_deadlines` for 2026-27 school year. Verify SFUSD dates match published timeline.

### Agent B: App Features

#### F015: Program Profile Pages

- [ ] Dynamic route: `/programs/[slug]`
- [ ] Full profile layout:
  - Header: name, type badge, match tier badge, "last verified" date
  - Location: address, map snippet, distance from home/work
  - Cost section: tuition range, fees, subsidy acceptance, financial aid (with school_year tag)
  - Schedule section: all schedule options with costs
  - About: philosophy, languages, staff ratios
  - Application: deadlines, waitlist status, how to apply, required documents
  - SFUSD connection (if applicable): attendance area, feeder school, tiebreaker status, policy disclaimer
  - Data provenance tooltips: hover to see "Extracted from website on [date]: '[raw snippet]'"
- [ ] "Save" button → adds to saved programs
- [ ] "Compare" button → adds to comparison tray
- [ ] "Report incorrect info" button → creates `user_correction` record
- [ ] SEO: SSR with meta tags (title, description, OG image)
- [ ] Handle incomplete profiles gracefully: show available data, flag missing with "Not yet verified"
- **Acceptance:** Profile page renders all available data. Incomplete fields show "Not yet verified." Data provenance tooltips work. Save/Compare/Report buttons function. Page is SSR with proper meta tags.
- **Verification:** Load a fully enriched program → all sections populated. Load a basic (CCL-only) program → available data shown, missing fields flagged. View page source → meta tags present.

#### F016: Comparison Tool

- [ ] Persistent comparison tray (bottom bar on desktop, floating button on mobile)
- [ ] Add/remove programs from tray (max 4)
- [ ] Comparison page: `/compare`
  - Desktop: side-by-side table (columns = programs, rows = attributes)
  - Mobile: swipe-between-cards pattern
- [ ] Rows: cost, schedule options, philosophy, languages, ages, distance, match tier, attendance area, deadlines
- [ ] Visual diff: highlight cells where values differ between programs
- [ ] "Missing data" cells clearly marked
- **Acceptance:** Can add 2-4 programs to tray. Comparison table renders with all attributes. Differences highlighted. Mobile shows swipe-cards. Missing data marked.
- **Verification:** Add 3 programs (1 full profile, 1 partial, 1 basic). Verify table renders correctly. Differences highlighted. Mobile swipe works.

#### F017: User Auth & Saved Programs

- [ ] Supabase Auth: email + Google OAuth
- [ ] Sign-up prompt after intake completion (non-blocking — can browse without account)
- [ ] When user creates account: migrate LocalStorage intake data to `families` table
- [ ] Dashboard page: `/dashboard`
  - Saved programs list with status badges
  - Status update dropdown per program (researching → toured → applied → waitlisted → accepted → enrolled)
  - Notes field per saved program
- [ ] RLS: users can only see/modify their own family + saved programs
- **Acceptance:** Email and Google sign-up work. LocalStorage data migrates to DB on account creation. Dashboard shows saved programs with status management. RLS prevents cross-user data access.
- **Verification:** Create account → verify family record in DB matches LocalStorage intake. Save 3 programs, update statuses. Log in as different user → verify can't see first user's data.

---

## Phase 3: Integration & Polish (Converge)

**Duration:** 2–3 weeks
**Both agents converge. Team lead coordinates.**

#### F018: Kindergarten Path Preview

- [ ] On program profile (SFUSD programs only):
  - Show attendance area name
  - Show whether attending gives tiebreaker (with school_year tag)
  - Show feeder elementary school (for TK programs, 2026-27+)
  - Show 1-sentence plain-English explanation of what this means
  - Show disclaimer (from F004) prominently
  - Link to SFUSD official enrollment page
- [ ] On comparison table: include K-path row for SFUSD programs
- [ ] In search results: subtle badge on SFUSD programs ("K-path advantage")
- **Acceptance:** SFUSD program profiles show K-path preview with all 4 data points + disclaimer. Non-SFUSD programs don't show this section. Comparison table includes K-path row. Search results show badge.
- **Verification:** View 3 SFUSD programs → verify K-path data matches `sfusd_rules` table. View 2 private programs → verify no K-path section appears.

#### F019: Deadline Tracker & Email Reminders

- [ ] Dashboard timeline view: horizontal timeline showing saved programs' deadlines
- [ ] Deadline cards: program name, deadline type, date, days remaining
- [ ] Color coding: green (>30 days), yellow (7-30 days), red (<7 days), gray (passed)
- [ ] Configurable reminder: user sets lead time per saved program (default: 14 days)
- [ ] Resend integration: transactional email for deadline reminders
  - Email template: program name, deadline type, date, link to program profile
  - Send at configured lead time
- [ ] Cron job (Vercel cron or Supabase pg_cron): check daily for upcoming deadlines, queue emails
- [ ] Unsubscribe link in every email
- [ ] Programs with unknown deadlines show "Contact program for dates" (no reminder possible)
- **Acceptance:** Timeline renders saved programs' deadlines correctly. Color coding works. Email sends at configured lead time. Unsubscribe works. Unknown deadlines handled gracefully.
- **Verification:** Save a program with a deadline 7 days out. Verify email sends. Verify timeline shows it in yellow. Click unsubscribe → verify no more emails.

#### F020: SEO Pages (Programmatic)

- [ ] Generate static pages for high-value searches:
  - `/schools/[neighborhood]-preschools` (e.g., `/schools/noe-valley-preschools`)
  - `/schools/[language]-immersion-sf` (e.g., `/schools/spanish-immersion-sf`)
  - `/schools/affordable-preschools-sf` (under $2,000/month)
  - `/schools/sfusd-prek-programs`
- [ ] Each page: title, meta description, filtered program list, CTA to start intake
- [ ] `generateStaticParams` for all pages at build time
- [ ] Sitemap.xml with all program profile URLs + SEO pages
- [ ] robots.txt allowing crawl
- **Acceptance:** SEO pages render server-side with correct content. Meta tags appropriate. Sitemap includes all pages. Google can discover and crawl all public pages.
- **Verification:** View page source of 3 SEO pages → content in HTML. Validate sitemap.xml. Check robots.txt.

#### F021: Data Freshness & Trust UI

- [ ] "Last verified" badge on every program card and profile
- [ ] Data completeness indicator on profile (e.g., "Profile 85% complete")
- [ ] Provenance tooltips on AI-extracted fields ("Source: program website, Feb 2026")
- [ ] "Data freshness" filter in search: option to hide programs not verified in >6 months
- [ ] "Report incorrect info" flow: modal with field selector + correction + submit → creates `user_correction`
- [ ] Admin review queue for user corrections (can be simple Supabase dashboard for MVP)
- **Acceptance:** All profiles show last-verified date. Provenance tooltips work on enriched fields. Report flow submits corrections to queue. Freshness filter works.
- **Verification:** Check 5 programs for last-verified badge. Hover over extracted field → tooltip shows source. Submit a correction → verify it appears in `user_corrections` table.

#### F022: Accessibility & Polish

- [ ] Map pins: shapes + colors (circle, square, diamond, triangle)
- [ ] Keyboard navigation for map interactions
- [ ] ARIA labels on all interactive elements
- [ ] Color contrast audit (WCAG AA minimum)
- [ ] Screen reader testing on intake wizard and program profiles
- [ ] Mobile touch targets ≥ 44px
- [ ] Loading states: skeletons for cards, spinners for actions
- [ ] Error states: friendly messages, retry buttons, no raw errors exposed
- [ ] 404 page for invalid program slugs
- **Acceptance:** Lighthouse accessibility score > 90. Keyboard navigation works through all major flows. Screen reader announces all interactive elements correctly. Mobile touch targets adequate.
- **Verification:** Run Lighthouse audit. Tab through intake → results → profile → save flow. Test with VoiceOver on macOS.

---

## Phase 4: Beta & Launch Prep

**Duration:** 2 weeks

#### F023: Beta Testing

- [ ] Recruit 20–30 SF parents (target: mix of neighborhoods, income levels, first-time + relocating)
- [ ] Create beta feedback form (Google Form or Typeform)
- [ ] Beta test protocol:
  - Complete intake with real family situation
  - Find and save 3+ programs
  - Use comparison tool
  - Check K-path preview (if applicable)
  - Rate data accuracy for programs they know
  - Report any bugs or confusing UX
- [ ] Track: completion rate, time to first save, programs saved, accuracy reports
- [ ] Triage feedback: bugs → fix immediately, UX → fix if <1 day effort, feature requests → V2 parking lot
- **Acceptance:** 20+ parents complete beta test. <5% of checked profiles flagged as inaccurate. No critical bugs remaining. Intake completion rate > 70%.
- **Verification:** Beta feedback spreadsheet shows 20+ responses. Bug tracker clear of critical/high items.

#### F024: Data QA & Verification

- [ ] Cross-reference top 50 program profiles against current websites
- [ ] Verify all SFUSD program data against latest enrollment documents
- [ ] Verify attendance area polygons produce correct results for 20 test addresses
- [ ] Check all application deadlines for 2026-27 school year accuracy
- [ ] Update `last_verified_at` for all checked programs
- [ ] Address any corrections submitted during beta
- **Acceptance:** Top 50 programs verified against source. Attendance areas verified. Deadlines current. All beta corrections addressed.
- **Verification:** Verification log shows check date + result for each program.

#### F025: Launch Prep

- [ ] Privacy Policy finalized and linked from footer
- [ ] Terms of Service finalized and linked from footer
- [ ] SFUSD disclaimer reviewed by someone with legal knowledge
- [ ] Performance: Lighthouse performance score > 80
- [ ] Error monitoring: Sentry configured
- [ ] Analytics: PostHog or similar configured (privacy-respecting, no child PII in events)
- [ ] Custom domain configured on Vercel
- [ ] OG images for homepage and program pages
- [ ] 301 redirects plan (if replacing any existing content)
- **Acceptance:** Legal pages live. Performance adequate. Monitoring configured. Domain live.
- **Verification:** Visit production URL. Check Sentry dashboard. Check analytics dashboard. Verify privacy policy accessible.

---

## Agent Boundaries (Parallel Execution)

### Agent A: Data Pipeline

**Owns:**
- `pipeline/` (entire Python pipeline directory)
- Database seed data and migration scripts for data tables
- `program_*` table data (programs, tags, schedules, languages, costs, deadlines)
- `attendance_areas` table data
- `sfusd_rules` table data
- `field_provenance` table data

**Read-only:**
- `types/domain.ts` (to ensure pipeline output matches app types)
- Database schema (shared, defined in Phase 0)

**Features:** F005, F006, F007, F008, F013, F014

### Agent B: App Frontend

**Owns:**
- `src/` (entire Next.js application)
- `src/app/` routes and pages
- `src/components/` React components
- `src/lib/` application logic (scoring, geo, validation)
- UI-related database queries (RPC functions, client queries)
- Auth configuration
- Email templates

**Read-only:**
- `types/domain.ts` (shared)
- Database schema (shared, defined in Phase 0)
- `pipeline/` (reference only, don't modify)

**Features:** F009, F010, F011, F012, F015, F016, F017

### Shared (Team Lead Manages)

- `types/` — domain types, API types, DB types
- Database schema migrations
- `lib/config/` — shared configuration
- `ROADMAP.md`, `PROGRESS.md`
- Environment variables

### Phase 3+ (Converge)

F018–F025 are collaborative. Team lead assigns based on availability and expertise fit.

---

## Feature Summary

| ID | Feature | Phase | Agent | Status |
|----|---------|-------|-------|--------|
| F001 | Project Scaffolding | 0 | Lead | done |
| F002 | Database Schema | 0 | Lead | done |
| F003 | Shared Types & Config | 0 | Lead | done |
| F004 | Privacy & Data Architecture | 0 | Lead | done |
| F004b | Seed Data for Parallel Dev | 0 | Lead | done |
| F005 | CCL Data Import | 1 | A | done |
| F006 | SFUSD Data Import | 1 | A | done |
| F007 | Attendance Area Polygons | 1 | A | done |
| F008 | Data Quality Framework | 1 | A | done |
| F009 | App Shell & Routing | 1 | B | done |
| F010 | Intake Wizard | 1 | B | done |
| F011 | Map View | 1 | B | done |
| F012 | List View & Filtering | 1 | B | done |
| F013 | Top 50 Program Enrichment | 2 | A | done |
| F014 | Application Deadlines | 2 | A | done |
| F015 | Program Profile Pages | 2 | B | done |
| F016 | Comparison Tool | 2 | B | done |
| F017 | User Auth & Saved Programs | 2 | B | done |
| F018 | Kindergarten Path Preview | 3 | — | not-started |
| F019 | Deadline Tracker & Reminders | 3 | — | not-started |
| F020 | SEO Pages | 3 | — | not-started |
| F021 | Data Freshness & Trust UI | 3 | — | not-started |
| F022 | Accessibility & Polish | 3 | — | not-started |
| F023 | Beta Testing | 4 | — | not-started |
| F024 | Data QA & Verification | 4 | — | not-started |
| F025 | Launch Prep | 4 | — | not-started |
