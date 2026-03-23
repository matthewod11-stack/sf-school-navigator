# SF School Navigator — Product Specification (MVP)

**Helping San Francisco parents navigate PreK decisions with confidence and clarity**

February 2026 — Draft v1.0
Target: Solo build with AI-assisted development

---

## 1. The Problem

Parents entering San Francisco's childcare and preschool system face a fragmented, high-stakes decision with inadequate tools. The city has over 500 early childhood programs spanning public Head Start, city-subsidized centers, family childcare homes, SFUSD Pre-K and TK programs, private Montessori schools, language immersion programs, co-ops, and religious schools. Costs range from free (subsidized/TK) to $3,900/month at private centers. Waitlists in popular neighborhoods like Noe Valley and Inner Sunset can stretch over a year.

There is no single place where a parent can see all their options filtered by what matters to them. The current process involves cross-referencing the SF Department of Early Childhood's portal, SFUSD's enrollment site, individual school websites, Winnie listings, and Facebook groups. A parent making this decision for the first time has no way to understand how a PreK choice connects to kindergarten placement, which SFUSD attendance area they fall in, or how the new TK feeder system will affect their child's path.

The PreK decision is especially consequential in SF because of the SFUSD lottery system. Children who attend an SFUSD Pre-K or TK program in a given attendance area receive a tiebreaker preference for kindergarten at that school. Only about 65% of families get their top kindergarten choice. A parent who doesn't understand this linkage at the PreK stage may inadvertently limit their child's options two years later.

---

## 2. Target User

The MVP targets parents of children ages 0–3 who are entering the SF early childhood system for the first time. Specifically:

- First-time parents in San Francisco who don't yet have a child in any program
- Parents relocating to SF with a young child
- Parents whose child is aging out of infant care and transitioning to a preschool/PreK program

**Out of scope for MVP:** parents navigating elementary, middle, or high school transitions; nannies or au pair arrangements; families outside SF city limits.

---

## 3. MVP Scope

The MVP covers the PreK entry point only (ages 2–4), across all program types available in San Francisco. It answers one question: "What are my best childcare/preschool options, given my family's specific situation?"

### 3.1 Guided Intake

A conversational onboarding flow (not a form) that captures the family's constraints and preferences. The intake should feel like talking to a knowledgeable friend who asks the right questions.

| Category | Data Captured | Why It Matters |
|----------|--------------|----------------|
| **Child** | Date of birth, any known special needs or developmental considerations | Determines age eligibility for programs; triggers specialized program filters |
| **Location** | Home address, work address(es) of parent(s)/caregivers doing drop-off/pickup | Drives commute calculations; identifies SFUSD attendance area; surfaces neighborhood options |
| **Budget** | Monthly budget ceiling; interest in subsidies/financial aid; employer FSA/benefits | Filters to affordable options; surfaces subsidy eligibility (Baby C, Head Start, CSPP) |
| **Schedule** | Required days/hours; need for before/after care; start date | Many programs are part-time only; extended care availability varies widely |
| **Preferences** | Educational philosophy (Montessori, play-based, Reggio, etc.); language immersion; religious affiliation; outdoor/nature focus | Over a third of SF preschools offer bilingual programs; philosophy varies significantly across providers |
| **Logistics** | Siblings in other programs; car vs. transit vs. walking; flexibility on neighborhood | Sibling policies affect placement; transit accessibility matters for car-free families |

### 3.2 Program Map & Search

An interactive map showing all viable programs based on intake answers. Each program card surfaces the information that matters to this specific parent, not a generic profile.

- Map view with filterable pins (color-coded by program type: public, private, religious, home-based)
- List view as alternative, sortable by distance, cost, or match score
- Each program card shows: name, type, cost range, ages served, hours, languages, distance from home/work, and a match score based on intake preferences
- Quick-filter toggles for hard constraints (e.g. "only show programs under $2,000/month", "must have Spanish immersion")
- Click-through to a detailed program profile page

### 3.3 Program Profiles

A detail page for each program with structured, comparable information. This is where we add value beyond what's on the program's own website.

- Program basics: address, phone, website, hours, calendar
- Cost breakdown: tuition, fees, deposit, financial aid availability, subsidy acceptance
- Licensing status and history (pulled from CA Community Care Licensing)
- Staff-to-child ratios
- Educational approach description
- Language programs offered
- Before/after care and summer program details
- Application process: deadlines, waitlist status (if known), how to apply
- SFUSD connection: which attendance area this program falls in, and what that means for the K lottery

### 3.4 Side-by-Side Comparison

Parents can select 2–4 programs and view them in a comparison table. Columns are programs; rows are attributes. Differences are visually flagged. This is one of the most requested features in parent forums — no existing tool does this well.

### 3.5 Deadline & Application Tracker

A dashboard showing all saved programs with their application windows, deadlines, and required documents. Parents can mark status (researching, applied, waitlisted, accepted, enrolled). Push notifications for upcoming deadlines.

- Timeline view of application windows across saved programs
- Checklist of required documents per program
- Status tracking per program (researching → toured → applied → waitlisted → accepted → enrolled)
- Reminder notifications (configurable: 2 weeks before, 1 week before, day of)

### 3.6 Kindergarten Path Preview

For each program a parent is considering, show the downstream kindergarten implications. This is the strategic differentiator — the "so what" that no other tool provides.

- Which SFUSD attendance area the program falls in
- Whether attending this PreK/TK gives a tiebreaker for the associated elementary school
- The feeder school relationship (for SFUSD TK programs starting 2026–27)
- A simple explanation of what the SFUSD lottery means for this family based on their address

This is kept deliberately simple in MVP — just enough to make the connection visible. The full decision-tree visualization is a V2 feature.

---

## 4. Data Architecture

### 4.1 Data Sources

| Source | What It Provides | Format | Update Frequency |
|--------|-----------------|--------|-----------------|
| **CA Community Care Licensing (CCL)** | Licensed childcare centers and family childcare homes: name, address, capacity, license status, inspection history | Public dataset / API | Monthly |
| **SF Dept of Early Childhood (DEC)** | Early Learning For All network: participating programs, subsidy info, quality ratings | Website scraping + manual | Quarterly |
| **SFUSD Enrollment Data** | Pre-K and TK program locations, attendance areas, feeder relationships, application deadlines | Public PDFs + website | Annual (Oct) |
| **Individual School Websites** | Tuition, philosophy, hours, application process, language offerings | Manual + AI-assisted extraction | Annual |
| **SFUSD GIS / Attendance Area Maps** | Geographic boundaries for each elementary school attendance area | GeoJSON / Shapefile | As changed |

### 4.2 Data Model (Simplified)

The core entity is a **Program**. Each program has:

- **Identity:** name, address, coordinates, phone, website, type (center, family childcare, SFUSD, private, religious, charter)
- **Eligibility:** age range (min/max in months), licensing status, license number
- **Cost:** monthly tuition (low/high range), registration fee, deposit, accepts subsidies (bool), financial aid available (bool)
- **Schedule:** days offered, hours (open/close), extended care available, summer program
- **Pedagogy:** approach (enum: Montessori, Reggio, play-based, academic, Waldorf, religious, mixed), languages offered
- **Capacity:** total spots, staff-to-child ratio, current waitlist status (open, short, long, closed)
- **SFUSD linkage:** attendance area ID, feeder elementary school, tiebreaker eligible (bool)
- **Metadata:** last verified date, data source, data completeness score

Secondary entities: **Family** (intake data), **SavedProgram** (family + program + status), **AttendanceArea** (polygon + linked schools).

### 4.3 Data Collection Strategy

For MVP, the realistic approach is a hybrid of automated and manual collection. The city has roughly 500+ programs to cover.

1. Start with CCL public data as the base layer — this gives you every licensed program with address, capacity, and license type.
2. Overlay SFUSD data for all public Pre-K and TK programs, including attendance area mappings.
3. Use AI-assisted web scraping (Claude or similar) to extract tuition, hours, and philosophy from the top 100–150 private programs by enrollment volume.
4. Manually verify and enrich the top 50 most-searched programs based on early user behavior.
5. Crowdsource corrections: let parents flag stale data and submit updates (moderated).

**Target for launch:** 80%+ of licensed programs with basic info (name, address, type, ages, cost range). 50+ programs with full profiles.

---

## 5. Technical Architecture

Designed for a solo developer using AI-assisted tools. Prioritizes speed to launch and low operational overhead.

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js (App Router) + Tailwind CSS | Fast iteration with AI tools; SSR for SEO; built-in API routes |
| **Maps** | Mapbox GL JS or Google Maps JS API | Interactive filtering, attendance area overlays, commute isochrones |
| **Database** | Supabase (PostgreSQL + PostGIS) | Spatial queries for geo search; built-in auth; real-time subscriptions; generous free tier |
| **Auth** | Supabase Auth (email + Google OAuth) | Bundled with DB; handles sessions; low setup overhead |
| **Hosting** | Vercel | Zero-config Next.js deployment; edge functions; preview deploys |
| **Notifications** | Resend (email) + web push | Deadline reminders; simple API; free tier covers MVP volume |
| **Data Pipeline** | Python scripts + Claude API for extraction | One-time and periodic scraping; AI-assisted data normalization from school websites |

### 5.1 Key Technical Decisions

**PostGIS for spatial queries:** The app needs to answer questions like "show me all programs within a 15-minute commute of my home" and "which SFUSD attendance area does this address fall in." PostGIS handles both natively. Supabase includes PostGIS out of the box.

**Attendance area polygons:** SFUSD publishes attendance area boundaries. These get stored as PostGIS geometries. When a parent enters their home address, we do a point-in-polygon query to identify their attendance area and surface the associated elementary schools and tiebreaker implications.

**Match scoring:** A simple weighted scoring algorithm based on the parent's intake preferences. Not ML — just parameterized weights. Example: if a parent says Spanish immersion is a must-have, programs with Spanish immersion get a big boost. If it's a nice-to-have, smaller boost. Easy to tune and explain.

---

## 6. Core User Flows

### 6.1 First Visit / Onboarding

1. Parent lands on homepage. Clear value prop: "Find the right preschool for your family in San Francisco."
2. Clicks "Get Started." Enters child's birth date. App determines age eligibility.
3. Enters home address. App identifies SFUSD attendance area and shows it on a small map.
4. Guided preference questions (3–4 screens): budget range, schedule needs, educational philosophy preferences, language preferences, any must-haves.
5. Results: map view of matching programs. Parent can toggle between map and list view.
6. Prompted to create an account to save results and get deadline reminders. Can browse without account.

### 6.2 Exploring Programs

1. From results, parent clicks a program pin or card.
2. Program profile opens with all structured data. If this is an SFUSD program, the kindergarten path preview is shown.
3. Parent can "Save" to their list, triggering the application tracker.
4. Parent can "Compare" — adds to comparison tray (persistent bottom bar). When 2+ programs are in the tray, "Compare" button activates.

### 6.3 Application Tracking

1. From their dashboard, parent sees all saved programs with current status.
2. Timeline view shows application windows and deadlines across all saved programs.
3. Parent updates status as they progress (toured, applied, etc.).
4. Reminders fire based on configured lead times before deadlines.

---

## 7. SF-Specific Context Baked Into MVP

The app needs to encode institutional knowledge that experienced SF parents take for granted but newcomers don't have:

**The SFUSD lottery system:** SF uses citywide choice for elementary schools. Parents rank schools; assignment uses tiebreakers (sibling, attendance area, equity). About 65% get their first choice. The app should explain this plainly and show how PreK choices connect to lottery positioning.

**TK feeder system (new in 2026–27):** Starting with the 2026–27 school year, all SFUSD TK programs feed into a specific elementary school. TK students are automatically promoted to kindergarten at their feeder school. This is a major change that most parents don't know about yet. The app should surface this for any parent considering SFUSD TK.

**Baby C subsidies:** SF's Proposition C funds now cover full childcare costs for families earning up to ~200% of area median income (~$310K for a family of four). Many eligible families don't know about this. The app should include a simple eligibility check during intake.

**Language immersion pipeline:** SFUSD offers immersion programs in Cantonese, Mandarin, Spanish, Korean, Japanese, and Filipino. Seats are split between fluent and non-fluent speakers. Students who attend an SFUSD language PreK/TK have the highest tiebreaker for immersion kindergarten. Parents interested in immersion need to plan early.

**Neighborhood dynamics:** Waitlist length, program density, and options vary dramatically by neighborhood. The Sunset has different dynamics than the Mission, which is different from Pacific Heights. The app should reflect this without requiring the parent to already know the landscape.

---

## 8. Monetization (MVP)

MVP launches free. The goal is to validate demand, build a user base, and collect data on what parents value most. Revenue comes in V2.

Planned revenue model for post-MVP:

- **Freemium subscription:** Free tier includes search, map, and basic profiles. Paid tier ($10–15/month) adds comparison tool, deadline tracker with reminders, kindergarten path preview, and saved family profiles.
- **Consultation referrals:** For families with complex situations (special needs placement, private school admissions strategy), connect with vetted educational consultants. Revenue share model.

**What we won't do:** Schools will not pay for placement or boosted visibility. The moment programs can buy better positioning, parent trust evaporates. The product only works if parents believe the recommendations are unbiased.

---

## 9. Success Metrics

| Metric | Target (3 months post-launch) | Why This Matters |
|--------|------------------------------|-----------------|
| **Completed intakes** | 500+ | Validates that parents find the onboarding worth completing |
| **Programs saved per user** | 3+ average | Shows parents are finding relevant options, not bouncing |
| **Comparison usage** | 30%+ of users with saved programs | Validates the comparison tool adds value beyond search |
| **Return visits** | 40%+ return within 2 weeks | School search is a multi-session activity; return visits indicate ongoing utility |
| **Data accuracy reports** | <5% of profiles flagged as inaccurate | Data quality is existential — if parents can't trust the info, they won't use the tool |
| **NPS** | 50+ | Parents who love it will be the primary distribution channel (word of mouth) |

---

## 10. Build Timeline

Estimated for a solo developer working ~20 hours/week with AI-assisted tooling.

| Phase | Work | Duration |
|-------|------|----------|
| **Phase 1** | Data collection: CCL data import, SFUSD program data, attendance area polygons, top 50 private school profiles | 2–3 weeks |
| **Phase 2** | Core app: intake flow, map/search, program profiles, basic filtering | 3–4 weeks |
| **Phase 3** | Comparison tool, save/track functionality, user accounts | 2–3 weeks |
| **Phase 4** | Deadline tracker, kindergarten path preview, notifications | 2–3 weeks |
| **Phase 5** | Polish, beta testing with 20–30 SF parents, data QA | 2 weeks |

**Total estimated: 11–15 weeks to launch-ready MVP.** Ideal launch window is late summer/early fall, ahead of the October SFUSD application window for the following school year.

---

## 11. V2 Roadmap

Features explicitly deferred from MVP, roughly prioritized by expected impact.

### 11.1 Decision Tree Visualization

Full interactive visualization showing: "If you choose Program X for PreK, here are your likely kindergarten paths, and from each of those, here's what middle school looks like." This is the big strategic differentiator but requires K–8 data that's out of scope for PreK-focused MVP.

### 11.2 Elementary + Middle + High School Coverage

Expand the program database to cover all SFUSD schools, charter schools, and private K–12 options. Each transition point (PreK→K, 5th→6th, 8th→9th) becomes a supported decision. Includes Lowell and SOTA's specialized application processes.

### 11.3 Community Layer

Verified parent reviews, structured around specific attributes rather than generic star ratings. Examples: "How does this school handle food allergies?" "What's pickup actually like at 3pm?" Parent-to-parent matching for families with similar profiles who've already navigated the decision.

### 11.4 Total Cost Calculator

Multi-year cost projection across different school paths. Factor in tuition increases (~4% annual for private), financial aid estimates, before/after care, summer programs, and the value of subsidies. Show the real 5-year and 13-year cost of different paths.

### 11.5 Commute Simulation

Beyond straight-line distance: real commute modeling based on time of day, transit routes, driving vs. walking vs. biking. Show isochrone maps ("all programs reachable in 15 minutes from your home at 8am"). Factor in two-parent households where pickup/dropoff is split.

### 11.6 AI-Powered Advisor

A conversational interface where parents can ask natural language questions about their options. "Should I prioritize getting into an SFUSD TK for the lottery advantage, or is the Montessori program at X worth the cost?" The system would use the parent's intake data and program knowledge to provide contextual guidance. Not financial or educational advice — structured decision support.

### 11.7 Waitlist Intelligence

Aggregated, anonymized data on waitlist movement from users who opt in. Over time, this builds into a prediction model: "Historically, 40% of families on the Rooftop School waitlist receive an offer by June." No existing tool has this data.

### 11.8 Multi-City Expansion

The data model and app architecture are city-agnostic. The SF-specific logic (SFUSD lottery, attendance areas, Baby C) is encapsulated in a city configuration layer. Expansion to other complex school markets (NYC, LA, Chicago, DC) would require new data collection and city-specific rule encoding but no architecture changes.

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Data goes stale** | Parents lose trust if they find outdated tuition or closed programs | Show "last verified" dates prominently; crowdsource corrections; prioritize the top 50 programs for manual verification |
| **Incomplete coverage** | Parents in underserved neighborhoods may see few results | Launch with CCL as base layer so every licensed program appears, even with minimal detail. Flag incomplete profiles rather than hiding them. |
| **SFUSD policy changes** | The assignment system is politically contentious; rules could change | Encode SFUSD rules as configurable logic, not hardcoded. Monitor board meetings. The zone-based system (Board Policy 5101.2) was approved but implementation keeps getting delayed — be prepared for either system. |
| **Low initial traffic** | Hard to build momentum without existing user base | Target the SF Parents Coalition, SFUSD Lottery Support Group on Facebook, local parenting groups, and neighborhood Nextdoor communities. Time launch to September–October when enrollment season starts. |
| **Legal liability** | Parents make decisions based on app data that turns out to be wrong | Clear disclaimers that data is informational, not official. Always link to primary sources. Never position as financial or educational advice. |

---

## 13. Open Questions

- Should the MVP intake include a subsidy eligibility calculator, or just flag whether a family might qualify and link to the DEC application?
- How much SFUSD lottery explanation belongs in the app vs. linking out to SFUSD resources and the Parent Coalition's guides?
- Is the comparison tool essential for MVP, or could it be deferred to reduce initial scope? (Leaning: keep it — it's a primary differentiator.)
- What's the right level of detail for the kindergarten path preview? Too much and it's overwhelming; too little and it's not useful.
- Should the app name reference "school" (broader, positions for expansion) or "preschool/childcare" (narrower, clearer for MVP audience)?
- Mobile-first or responsive web? Given that parents often research on phones during commutes and downtime, mobile-first seems right, but the comparison tool works better on larger screens.
