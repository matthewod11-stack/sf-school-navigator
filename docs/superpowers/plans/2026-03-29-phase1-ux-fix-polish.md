# Phase 1: UX Fix & Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken search map view, polish the program profile page, and clean up project documentation so the repo has one driveable roadmap.

**Architecture:** Three independent features executed in sequence: doc cleanup (F028) first to establish the new roadmap, then map redesign (F026) which replaces the flex-based layout with a Full Map + Side Panel pattern using absolute positioning, then profile polish (F027) which fixes specific spacing/layout issues without restructuring the page.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Mapbox GL JS, Vaul (drawer component for mobile)

---

## File Map

### F028: Documentation Cleanup
- Move: `ROADMAP.md` → `docs/dev/V1_ROADMAP.md`
- Move: `KNOWN_ISSUES.md` resolved items → `docs/dev/V1_KNOWN_ISSUES.md`
- Move: `docs/dev/PROJECT_STATE.md` → `PROJECT_STATE.md` (root)
- Move: `docs/dev/PROGRESS.md` → `PROGRESS.md` (root)
- Rewrite: `V2_ROADMAP.md` → `ROADMAP.md` (new unified roadmap)
- Delete: `PROJECT_STATE.md` (root, 35-line stale version)
- Modify: `CLAUDE.md` (update file references)
- Modify: `KNOWN_ISSUES.md` (trim to open items only)
- Modify: `docs/dev/features.json` (update phases, add F026-F028)
- Modify: `docs/dev/AGENT_BOUNDARIES.md` (update for new phases)

### F026: Search Map Redesign
- Create: `src/app/(app)/search/map-panel.tsx` — Left panel overlay with program cards
- Create: `src/app/(app)/search/filter-modal.tsx` — Modal overlay for filters in map mode
- Create: `src/app/(app)/search/map-search-view.tsx` — Map mode layout (absolute map + panel)
- Modify: `src/app/(app)/search/search-view.tsx` — Remove split mode, delegate to map-search-view
- Modify: `src/app/(app)/search/program-card.tsx` — Add ref forwarding for scroll-to-card
- Modify: `src/components/map/map-container.tsx` — Add programmatic flyTo, pin highlight API

### F027: Profile Page Polish
- Modify: `src/app/(app)/programs/[slug]/page.tsx` — Fix grid layout, reposition actions
- Modify: `src/components/programs/location-section.tsx` — Fix map preview fallback
- Modify: `src/components/programs/profile-actions.tsx` — Inline with header, not floating sidebar

---

## Task 1: Documentation Cleanup (F028)

### Task 1.1: Archive V1 Roadmap

**Files:**
- Move: `ROADMAP.md` → `docs/dev/V1_ROADMAP.md`

- [ ] **Step 1: Move V1 roadmap to archive**

```bash
git mv ROADMAP.md docs/dev/V1_ROADMAP.md
```

- [ ] **Step 2: Verify the move**

Run: `ls docs/dev/V1_ROADMAP.md`
Expected: File exists

---

### Task 1.2: Archive Resolved Known Issues

**Files:**
- Create: `docs/dev/V1_KNOWN_ISSUES.md`
- Modify: `KNOWN_ISSUES.md`

- [ ] **Step 1: Copy current KNOWN_ISSUES.md to archive**

```bash
cp KNOWN_ISSUES.md docs/dev/V1_KNOWN_ISSUES.md
git add docs/dev/V1_KNOWN_ISSUES.md
```

- [ ] **Step 2: Rewrite KNOWN_ISSUES.md with only open items + parking lot**

Rewrite `KNOWN_ISSUES.md` to contain:
- The "How to Use This Document" section (keep as-is)
- The "Locked Architectural Decisions" table (keep as-is)
- Only the 2 open issues:
  - `[PHASE-1] Search Map view needs complete redesign` (status: In Progress, since we're about to fix it)
  - `[PHASE-1] Program profile page needs design polish` (status: Open)
- The "V2 Parking Lot" section (keep as-is)
- The "Edge Cases to Handle" section (keep as-is)
- The "Technical Debt" section (keep as-is)
- Remove ALL resolved issues (they're in the archive now)

- [ ] **Step 3: Commit**

```bash
git add KNOWN_ISSUES.md docs/dev/V1_KNOWN_ISSUES.md
git commit -m "docs: archive resolved known issues, keep open items only"
```

---

### Task 1.3: Move Progress and Project State to Root

**Files:**
- Move: `docs/dev/PROGRESS.md` → `PROGRESS.md`
- Move: `docs/dev/PROJECT_STATE.md` → `PROJECT_STATE.md` (replacing the stale 35-line version)

- [ ] **Step 1: Remove stale root PROJECT_STATE.md**

```bash
rm PROJECT_STATE.md
```

- [ ] **Step 2: Move files to root**

```bash
git mv docs/dev/PROGRESS.md PROGRESS.md
git mv docs/dev/PROJECT_STATE.md PROJECT_STATE.md
```

- [ ] **Step 3: Add catch-up entry to PROGRESS.md**

Append to `PROGRESS.md`:

```markdown
---

## Session: 2026-03-29 (V2 Unified Roadmap)

### Completed
- Brainstormed and approved unified V2 roadmap design spec
- Consolidated V1 Phase 4 + V2 features into single 4-phase plan
- Eliminated V2-G0 gate (site is live, monitoring deferred to traction)
- Decided map redesign pattern: Full Map + Side Panel (Zillow/Redfin)
- Decided filter approach: toolbar button → modal overlay in map mode
- Decided to remove Split view entirely (List + Map only)
- Decided profile page: fix specific issues, not full redesign
- Archived V1 roadmap and resolved known issues
- Moved PROGRESS.md and PROJECT_STATE.md to repo root
- Created unified ROADMAP.md from V2_ROADMAP.md

### Next Session Should
1. Execute Phase 1 implementation plan: F026 (map redesign), F027 (profile polish)
2. Map redesign is the priority — uses absolute positioning to fix Mapbox container issue
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: move PROGRESS.md and PROJECT_STATE.md to repo root"
```

---

### Task 1.4: Write Unified Roadmap

**Files:**
- Remove: `V2_ROADMAP.md`
- Create: `ROADMAP.md` (new unified roadmap)

- [ ] **Step 1: Delete old V2 roadmap**

```bash
rm V2_ROADMAP.md
```

- [ ] **Step 2: Write new unified ROADMAP.md**

Write `ROADMAP.md` based on the approved design spec at `docs/superpowers/specs/2026-03-29-v2-unified-roadmap-design.md`. The roadmap should include:

- Header with project context (V1 complete, site live, unified plan)
- Decisions log (from spec)
- Phase structure overview
- Phase 1: UX Fix & Polish (F026, F027, F028) — with checkboxes for each acceptance criterion
- Phase 2: Data Validation (V2-F001–F004) — carried from spec
- Phase 3: Elementary Expansion (V2-F005–F010) — carried from spec
- Phase 4: Education Content (V2-F011–F013) — carried from spec
- Pre-validation checklist
- Feature summary table
- Agent boundaries reference (link to docs/dev/AGENT_BOUNDARIES.md)

Mark F028 items as `[x]` (done by this point). Mark F026 and F027 as `[ ]`.

- [ ] **Step 3: Commit**

```bash
git add ROADMAP.md V2_ROADMAP.md docs/dev/V1_ROADMAP.md
git commit -m "docs: unified ROADMAP.md — 4 phases, 16 features, single source of truth"
```

---

### Task 1.5: Update Supporting Docs

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/dev/features.json`
- Modify: `docs/dev/AGENT_BOUNDARIES.md`

- [ ] **Step 1: Update CLAUDE.md**

Update the "Project Tracking" section to reflect new file locations:

```markdown
## Project Tracking

- `ROADMAP.md` — Unified V2 roadmap: 16 features across 4 phases
- `PROGRESS.md` — Session log
- `PROJECT_STATE.md` — Cross-surface context for external Claude sessions
- `KNOWN_ISSUES.md` — Open issues and V2 parking lot
- `docs/dev/features.json` — Machine-readable feature status
```

Remove any references to `V2_ROADMAP.md` or `docs/dev/PROGRESS.md`.

- [ ] **Step 2: Update features.json**

Add F026, F027, F028 entries. Update V2 features to reflect new phase numbers. Remove old Phase 4 entries (F023, F024, F025 — absorbed into unified plan or eliminated):

```json
{
  "features": [
    {"id": "F001", "name": "Project Scaffolding", "phase": "v1-0", "agent": "lead", "status": "pass"},
    {"id": "F002", "name": "Database Schema Design", "phase": "v1-0", "agent": "lead", "status": "pass"},
    {"id": "F003", "name": "Shared Types & Config", "phase": "v1-0", "agent": "lead", "status": "pass"},
    {"id": "F004", "name": "Privacy & Data Architecture", "phase": "v1-0", "agent": "lead", "status": "pass"},
    {"id": "F004b", "name": "Seed Data for Parallel Dev", "phase": "v1-0", "agent": "lead", "status": "pass"},
    {"id": "F005", "name": "CCL Data Import", "phase": "v1-1", "agent": "A", "status": "pass"},
    {"id": "F006", "name": "SFUSD Data Import", "phase": "v1-1", "agent": "A", "status": "pass"},
    {"id": "F007", "name": "Attendance Area Polygons", "phase": "v1-1", "agent": "A", "status": "pass"},
    {"id": "F008", "name": "Data Quality Framework", "phase": "v1-1", "agent": "A", "status": "pass"},
    {"id": "F009", "name": "App Shell & Routing", "phase": "v1-1", "agent": "B", "status": "pass"},
    {"id": "F010", "name": "Intake Wizard", "phase": "v1-1", "agent": "B", "status": "pass"},
    {"id": "F011", "name": "Map View", "phase": "v1-1", "agent": "B", "status": "pass"},
    {"id": "F012", "name": "List View & Filtering", "phase": "v1-1", "agent": "B", "status": "pass"},
    {"id": "F013", "name": "Top 50 Program Enrichment", "phase": "v1-2", "agent": "A", "status": "pass"},
    {"id": "F014", "name": "Application Deadlines Collection", "phase": "v1-2", "agent": "A", "status": "pass"},
    {"id": "F015", "name": "Program Profile Pages", "phase": "v1-2", "agent": "B", "status": "pass"},
    {"id": "F016", "name": "Comparison Tool", "phase": "v1-2", "agent": "B", "status": "pass"},
    {"id": "F017", "name": "User Auth & Saved Programs", "phase": "v1-2", "agent": "B", "status": "pass"},
    {"id": "F018", "name": "Kindergarten Path Preview", "phase": "v1-3", "agent": "converge", "status": "pass"},
    {"id": "F019", "name": "Deadline Tracker & Email Reminders", "phase": "v1-3", "agent": "converge", "status": "pass"},
    {"id": "F020", "name": "SEO Pages (Programmatic)", "phase": "v1-3", "agent": "converge", "status": "pass"},
    {"id": "F021", "name": "Data Freshness & Trust UI", "phase": "v1-3", "agent": "converge", "status": "pass"},
    {"id": "F022", "name": "Accessibility & Polish", "phase": "v1-3", "agent": "converge", "status": "pass"},
    {"id": "F026", "name": "Search Map Redesign", "phase": 1, "agent": "B", "status": "not-started"},
    {"id": "F027", "name": "Program Profile Polish", "phase": 1, "agent": "B", "status": "not-started"},
    {"id": "F028", "name": "Documentation Cleanup", "phase": 1, "agent": "lead", "status": "pass"},
    {"id": "V2-F001", "name": "URL/Link Validation", "phase": 2, "agent": "A", "status": "not-started"},
    {"id": "V2-F002", "name": "Address Verification", "phase": 2, "agent": "A", "status": "not-started"},
    {"id": "V2-F003", "name": "Missing Data Flagging", "phase": 2, "agent": "shared", "status": "not-started"},
    {"id": "V2-F004", "name": "Combined Quality Dashboard", "phase": 2, "agent": "A", "status": "not-started"},
    {"id": "V2-F005", "name": "Program Type Enum Expansion", "phase": 3, "agent": "lead", "status": "not-started"},
    {"id": "V2-F006", "name": "SFUSD Elementary Import", "phase": 3, "agent": "A", "status": "not-started"},
    {"id": "V2-F007", "name": "CDE Private/Charter Import", "phase": 3, "agent": "A", "status": "not-started"},
    {"id": "V2-F008", "name": "Scoring Adaptation", "phase": 3, "agent": "B", "status": "not-started"},
    {"id": "V2-F009", "name": "Child Profile Management", "phase": 3, "agent": "B", "status": "not-started"},
    {"id": "V2-F010", "name": "Elementary Filter/SEO Pages", "phase": 3, "agent": "B", "status": "not-started"},
    {"id": "V2-F011", "name": "Static Guide Pages", "phase": 4, "agent": "B", "status": "not-started"},
    {"id": "V2-F012", "name": "Contextual Intake Education", "phase": 4, "agent": "B", "status": "not-started"},
    {"id": "V2-F013", "name": "Search/Profile Education", "phase": 4, "agent": "B", "status": "not-started"}
  ]
}
```

- [ ] **Step 3: Update AGENT_BOUNDARIES.md**

Update the Features sections to reference new phase structure:

Agent A Features: `V2-F001, V2-F002, V2-F003 (pipeline half), V2-F004, V2-F006, V2-F007`
Agent B Features: `F026, F027, V2-F005 (shared), V2-F008, V2-F009, V2-F010, V2-F011, V2-F012, V2-F013`

Remove references to old V1 Phase 4 features (F023, F024, F025).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md docs/dev/features.json docs/dev/AGENT_BOUNDARIES.md
git commit -m "docs: update CLAUDE.md, features.json, agent boundaries for unified roadmap"
```

---

## Task 2: Search Map Redesign — Scaffolding (F026)

### Task 2.1: Add ref forwarding to ProgramCard

**Files:**
- Modify: `src/app/(app)/search/program-card.tsx:1-145`

- [ ] **Step 1: Add forwardRef to ProgramCard**

The ProgramCard component needs to accept a ref so the map panel can scroll to a specific card when a pin is clicked. Wrap the component with `React.forwardRef`:

```typescript
import { forwardRef } from "react";

interface ProgramCardProps {
  program: ProgramCardData;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onCompareToggle?: (id: string) => void;
  isCompared?: boolean;
  compareCount?: number;
}

const ProgramCard = forwardRef<HTMLDivElement, ProgramCardProps>(
  function ProgramCard({ program, isSelected, onSelect, onCompareToggle, isCompared, compareCount }, ref) {
    // ... existing component body, but change the outer div:
    return (
      <div ref={ref} /* ... existing className and onClick ... */>
        {/* ... existing content ... */}
      </div>
    );
  }
);

export default ProgramCard;
```

Keep all existing logic, styling, and props unchanged. Only add forwardRef wrapping.

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/search/program-card.tsx
git commit -m "refactor: add forwardRef to ProgramCard for scroll-to-card support"
```

---

### Task 2.2: Add flyTo and pin highlight API to MapContainer

**Files:**
- Modify: `src/components/map/map-container.tsx:1-479`

- [ ] **Step 1: Expose flyTo and highlight via imperative handle**

Add `useImperativeHandle` to MapContainer so the parent can programmatically pan the map and highlight a pin. Add a `ref` prop using `forwardRef`:

```typescript
import { forwardRef, useImperativeHandle } from "react";

export interface MapContainerHandle {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  highlightPin: (programId: string | null) => void;
}

const MapContainer = forwardRef<MapContainerHandle, MapContainerProps>(
  function MapContainer({ programs, homeCoordinates, attendanceArea, showAttendanceArea, onProgramClick, className }, ref) {
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      flyTo(lng: number, lat: number, zoom = 15) {
        mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 800 });
      },
      highlightPin(programId: string | null) {
        const map = mapRef.current;
        if (!map || !map.getSource("programs")) return;
        if (programId) {
          map.setFilter("unclustered-point-highlight", ["==", ["get", "id"], programId]);
        } else {
          map.setFilter("unclustered-point-highlight", ["==", ["get", "id"], ""]);
        }
      },
    }));

    // ... rest of existing component
  }
);
```

Also add a highlight layer after the existing unclustered-point layer in the map setup effect. This is a ring/glow around the selected pin:

```typescript
map.addLayer({
  id: "unclustered-point-highlight",
  type: "circle",
  source: "programs",
  filter: ["==", ["get", "id"], ""],
  paint: {
    "circle-radius": 18,
    "circle-color": "transparent",
    "circle-stroke-width": 3,
    "circle-stroke-color": "#2d6a4f",
    "circle-opacity": 0.8,
  },
});
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/map/map-container.tsx
git commit -m "feat: add flyTo and pin highlight API to MapContainer"
```

---

### Task 2.3: Create FilterModal component

**Files:**
- Create: `src/app/(app)/search/filter-modal.tsx`

- [ ] **Step 1: Create the filter modal**

This component wraps the existing filter controls in a modal dialog. It reuses the same filter state and onChange pattern as FilterSidebar but renders inside a modal overlay.

```typescript
"use client";

import { Fragment } from "react";
import type { SearchFilters } from "./search-view";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  programTypes: string[];
  languages: string[];
}

export default function FilterModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  programTypes,
  languages,
}: FilterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 mx-4 max-h-[70vh] w-full max-w-md overflow-y-auto rounded-lg border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-neutral-900">
            Filters
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close filters"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter controls — same structure as FilterSidebar internals */}
        {/* Budget slider */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Max Monthly Budget
            </label>
            <input
              type="range"
              min={0}
              max={4000}
              step={100}
              value={filters.maxBudget ?? 4000}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  maxBudget: Number(e.target.value) === 4000 ? null : Number(e.target.value),
                })
              }
              className="mt-1 w-full"
            />
            <div className="mt-0.5 text-sm text-neutral-600">
              {filters.maxBudget ? `Up to $${filters.maxBudget}/mo` : "Any budget"}
            </div>
          </div>

          {/* Program type checkboxes */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Program Type
            </label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {programTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    const current = filters.programTypes || [];
                    const next = current.includes(type)
                      ? current.filter((t) => t !== type)
                      : [...current, type];
                    onFiltersChange({ ...filters, programTypes: next });
                  }}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    (filters.programTypes || []).includes(type)
                      ? "bg-neutral-800 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule type checkboxes */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Schedule
            </label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {["full-day", "half-day-am", "half-day-pm", "extended"].map((sched) => (
                <button
                  key={sched}
                  onClick={() => {
                    const current = filters.scheduleTypes || [];
                    const next = current.includes(sched)
                      ? current.filter((s) => s !== sched)
                      : [...current, sched];
                    onFiltersChange({ ...filters, scheduleTypes: next });
                  }}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    (filters.scheduleTypes || []).includes(sched)
                      ? "bg-neutral-800 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {sched.replace(/-/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Language filter */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Languages
            </label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    const current = filters.languages || [];
                    const next = current.includes(lang)
                      ? current.filter((l) => l !== lang)
                      : [...current, lang];
                    onFiltersChange({ ...filters, languages: next });
                  }}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    (filters.languages || []).includes(lang)
                      ? "bg-neutral-800 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Scored only toggle */}
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={filters.scoredOnly ?? false}
              onChange={(e) =>
                onFiltersChange({ ...filters, scoredOnly: e.target.checked })
              }
              className="rounded border-neutral-300"
            />
            Show scored programs only
          </label>
        </div>

        {/* Apply button */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              onFiltersChange({
                sort: "match",
                query: "",
                maxBudget: null,
                maxDistance: null,
                programTypes: [],
                scheduleTypes: [],
                languages: [],
                dataFreshness: "any",
                scoredOnly: false,
              });
            }}
            className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-md bg-neutral-800 px-4 py-2 text-sm text-white hover:bg-neutral-900"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
```

Note: This duplicates filter control rendering from FilterSidebar. After the redesign works, a follow-up refactor can extract shared filter controls into a reusable component. For now, duplication is fine — it avoids entangling the working List view sidebar.

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors (may need to export SearchFilters type from search-view.tsx if not already exported)

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/search/filter-modal.tsx
git commit -m "feat(F026): add FilterModal component for map view"
```

---

### Task 2.4: Create MapPanel component

**Files:**
- Create: `src/app/(app)/search/map-panel.tsx`

- [ ] **Step 1: Create the left panel overlay**

This is the scrollable program list that overlays the map on the left side. It contains a search input, filter button, program count, and a scrollable list of ProgramCards.

```typescript
"use client";

import { useRef, useEffect, createRef, useMemo, type RefObject } from "react";
import ProgramCard from "./program-card";
import type { ProgramCardData } from "./program-card";

interface MapPanelProps {
  programs: ProgramCardData[];
  selectedProgramId: string | null;
  onSelectProgram: (id: string) => void;
  onCompareToggle: (id: string) => void;
  compareIds: string[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

export default function MapPanel({
  programs,
  selectedProgramId,
  onSelectProgram,
  onCompareToggle,
  compareIds,
  isCollapsed,
  onToggleCollapse,
  query,
  onQueryChange,
  onOpenFilters,
  activeFilterCount,
}: MapPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useMemo(() => {
    const refs: Record<string, RefObject<HTMLDivElement | null>> = {};
    programs.forEach((p) => {
      refs[p.id] = createRef<HTMLDivElement>();
    });
    return refs;
  }, [programs]);

  // Scroll to selected card when pin is clicked
  useEffect(() => {
    if (selectedProgramId && cardRefs[selectedProgramId]?.current) {
      cardRefs[selectedProgramId].current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedProgramId, cardRefs]);

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="absolute left-3 top-3 z-20 rounded-md bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-md hover:bg-neutral-50"
        aria-label="Show program list"
      >
        ☰ {programs.length} programs
      </button>
    );
  }

  return (
    <div className="absolute left-0 top-0 z-10 flex h-full w-[340px] flex-col border-r border-neutral-200 bg-white/95 backdrop-blur-sm lg:w-[380px]">
      {/* Header */}
      <div className="flex-none border-b border-neutral-200 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search programs..."
            className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          />
          <button
            onClick={onOpenFilters}
            className="relative rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-800 text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={onToggleCollapse}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
            aria-label="Collapse panel"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <div className="mt-2 text-xs text-neutral-500">
          {programs.length} programs found
        </div>
      </div>

      {/* Scrollable card list */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              ref={cardRefs[program.id]}
              program={program}
              isSelected={program.id === selectedProgramId}
              onSelect={onSelectProgram}
              onCompareToggle={onCompareToggle}
              isCompared={compareIds.includes(program.id)}
              compareCount={compareIds.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/search/map-panel.tsx
git commit -m "feat(F026): add MapPanel component — left panel overlay for map view"
```

---

### Task 2.5: Create MapSearchView component

**Files:**
- Create: `src/app/(app)/search/map-search-view.tsx`

- [ ] **Step 1: Create the map mode layout**

This component owns the map mode layout: absolute-positioned map with panel overlay. It receives filtered programs and all interaction state from the parent SearchView.

```typescript
"use client";

import { useRef, useState, useCallback } from "react";
import MapContainer, { type MapContainerHandle } from "@/components/map/map-container";
import MapPanel from "./map-panel";
import FilterModal from "./filter-modal";
import type { ProgramCardData } from "./program-card";
import type { SearchFilters } from "./search-view";

interface MapSearchViewProps {
  programs: ProgramCardData[];
  mapPrograms: Array<{
    id: string;
    name: string;
    primaryType: string;
    coordinates: { lng: number; lat: number };
    matchTier?: "strong" | "good" | "partial" | "hidden" | null;
    address?: string | null;
  }>;
  homeCoordinates?: { lng: number; lat: number } | null;
  attendanceArea?: { id: string; name: string; geometry: unknown } | null;
  showAttendanceArea: boolean;
  onToggleAttendanceArea: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  programTypes: string[];
  languages: string[];
  compareIds: string[];
  onCompareToggle: (id: string) => void;
}

export default function MapSearchView({
  programs,
  mapPrograms,
  homeCoordinates,
  attendanceArea,
  showAttendanceArea,
  onToggleAttendanceArea,
  filters,
  onFiltersChange,
  programTypes,
  languages,
  compareIds,
  onCompareToggle,
}: MapSearchViewProps) {
  const mapRef = useRef<MapContainerHandle>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handlePinClick = useCallback((programId: string) => {
    setSelectedProgramId(programId);
    mapRef.current?.highlightPin(programId);
  }, []);

  const handleCardSelect = useCallback((programId: string) => {
    setSelectedProgramId(programId);
    const program = mapPrograms.find((p) => p.id === programId);
    if (program) {
      mapRef.current?.flyTo(program.coordinates.lng, program.coordinates.lat);
      mapRef.current?.highlightPin(programId);
    }
  }, [mapPrograms]);

  // Count active filters for badge
  const activeFilterCount = [
    filters.maxBudget !== null,
    (filters.programTypes?.length ?? 0) > 0,
    (filters.scheduleTypes?.length ?? 0) > 0,
    (filters.languages?.length ?? 0) > 0,
    filters.scoredOnly,
  ].filter(Boolean).length;

  return (
    <div className="relative flex-1">
      {/* Map fills the container */}
      <MapContainer
        ref={mapRef}
        programs={mapPrograms}
        homeCoordinates={homeCoordinates}
        attendanceArea={attendanceArea}
        showAttendanceArea={showAttendanceArea}
        onProgramClick={handlePinClick}
        className="absolute inset-0"
      />

      {/* Map toolbar — top right */}
      <div className="absolute right-3 top-3 z-20 flex gap-2">
        <button
          onClick={onToggleAttendanceArea}
          className={`rounded-md px-3 py-1.5 text-xs font-medium shadow-md transition-colors ${
            showAttendanceArea
              ? "bg-neutral-800 text-white"
              : "bg-white text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          Attendance Areas
        </button>
      </div>

      {/* Side panel overlay */}
      <MapPanel
        programs={programs}
        selectedProgramId={selectedProgramId}
        onSelectProgram={handleCardSelect}
        onCompareToggle={onCompareToggle}
        compareIds={compareIds}
        isCollapsed={panelCollapsed}
        onToggleCollapse={() => setPanelCollapsed(!panelCollapsed)}
        query={filters.query || ""}
        onQueryChange={(q) => onFiltersChange({ ...filters, query: q })}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Filter modal */}
      <FilterModal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onFiltersChange={onFiltersChange}
        programTypes={programTypes}
        languages={languages}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/search/map-search-view.tsx
git commit -m "feat(F026): add MapSearchView — absolute map + panel overlay layout"
```

---

### Task 2.6: Refactor SearchView to use new map layout

**Files:**
- Modify: `src/app/(app)/search/search-view.tsx:1-463`

- [ ] **Step 1: Remove split mode, wire up MapSearchView**

This is the key integration step. Modify `search-view.tsx` to:

1. Change `viewMode` type from `"map" | "list" | "split"` to `"map" | "list"`
2. Change default from `"split"` to `"list"`
3. Remove the split view toggle button (keep only List and Map)
4. Remove the `style={{ height: "calc(100dvh - 16rem)" }}` hack
5. In map mode, render `<MapSearchView>` instead of the inline MapContainer
6. In list mode, keep existing FilterSidebar + card list (unchanged)

Key changes to the render section (around lines 314-461):

**View toggle** — replace the 3-button group with 2 buttons:
```typescript
const viewMode = useState<"list" | "map">("list");

// In the toggle UI:
<div className="flex rounded-md border border-neutral-200 bg-white">
  <button
    onClick={() => setViewMode("list")}
    className={`px-3 py-1 text-xs font-medium ${
      viewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-600 hover:bg-neutral-50"
    }`}
  >
    List
  </button>
  <button
    onClick={() => setViewMode("map")}
    className={`px-3 py-1 text-xs font-medium ${
      viewMode === "map" ? "bg-neutral-800 text-white" : "text-neutral-600 hover:bg-neutral-50"
    }`}
  >
    Map
  </button>
</div>
```

**Content area** — conditional on mode:
```typescript
{viewMode === "list" ? (
  // Existing list view layout (FilterSidebar + card list) — unchanged
  <div className="flex h-full w-full gap-6">
    <FilterSidebar ... />
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      {/* Sort, count, cards — existing code */}
    </div>
  </div>
) : (
  // New map view
  <MapSearchView
    programs={cardPrograms}
    mapPrograms={mapPrograms}
    homeCoordinates={searchContext?.homeCoordinates}
    attendanceArea={attendanceArea}
    showAttendanceArea={showAttendanceArea}
    onToggleAttendanceArea={() => setShowAttendanceArea(!showAttendanceArea)}
    filters={filters}
    onFiltersChange={setFilters}
    programTypes={availableProgramTypes}
    languages={availableLanguages}
    compareIds={compareContext?.programIds ?? []}
    onCompareToggle={handleCompareToggle}
  />
)}
```

Remove the `style={{ height: ... }}` on the content container. The map mode layout handles its own height via absolute positioning. The list mode uses normal flow.

The outer container should use `flex-1 min-h-0` to fill available space below the view toggle:

```typescript
<div className="flex min-h-0 flex-1 flex-col">
  {/* View toggle + count */}
  <div className="mb-3 flex items-center justify-between">
    {/* toggle buttons */}
    <span className="text-xs text-neutral-500">{filteredPrograms.length} programs</span>
  </div>
  {/* Content */}
  <div className="relative min-h-0 flex-1">
    {viewMode === "list" ? (
      /* list layout */
    ) : (
      <MapSearchView ... />
    )}
  </div>
</div>
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run existing tests**

Run: `npm test`
Expected: 9/9 passing (scoring tests unaffected by UI changes)

- [ ] **Step 4: Verify build succeeds**

Run: `npm run build`
Expected: Build passes

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/search/search-view.tsx
git commit -m "feat(F026): refactor SearchView — remove split mode, integrate MapSearchView"
```

---

### Task 2.7: Manual verification

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify List view works**

Navigate to `http://localhost:3000/search`. Default should be List view. Verify:
- Filter sidebar appears on the left
- Program cards render in the list
- Sorting works
- Filters work

- [ ] **Step 3: Verify Map view works**

Click "Map" toggle. Verify:
- Map fills the content area
- Left panel shows program cards
- Map pins render
- Clicking a pin scrolls the panel to that card
- Clicking a card pans the map to that pin
- Filter button opens the modal
- Panel collapse button works
- Attendance area toggle works

- [ ] **Step 4: Check for overflow**

Verify:
- Map does NOT overflow the header
- Map does NOT overflow the bottom of the viewport
- No scroll bars on the page when in map mode
- Panel scrolls independently

- [ ] **Step 5: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(F026): map view adjustments after manual testing"
```

---

## Task 3: Profile Page Polish (F027)

### Task 3.1: Fix section layout — full width

**Files:**
- Modify: `src/app/(app)/programs/[slug]/page.tsx:1-228`

- [ ] **Step 1: Change grid layout to single column with inline actions**

The current layout uses `lg:grid-cols-3` with a sidebar for actions. Change to a single-column layout where actions are inline with the header. This makes all section cards span full width.

Replace the grid wrapper (around lines 90-228) with a single-column flow:

```typescript
<div className="mx-auto max-w-3xl space-y-6">
  {/* Breadcrumb */}
  <nav className="mb-4 text-sm text-neutral-500">...</nav>

  {/* Header + actions inline */}
  <div>
    <ProfileHeader program={program} />
    <div className="mt-4">
      <ProfileActions programId={program.id} />
    </div>
  </div>

  {/* Data completeness bar — full width */}
  {program.dataCompletenessScore != null && (
    <div className="rounded-md border border-neutral-200 bg-white px-4 py-3">
      {/* completeness bar content */}
    </div>
  )}

  {/* All sections — full width, no grid */}
  <LocationSection coordinates={...} address={...} provenance={...} />

  <Card>
    <CardHeader><h2>Key Details</h2></CardHeader>
    <CardContent>
      {/* key details grid — existing content */}
    </CardContent>
  </Card>

  <AboutSection languages={...} tags={...} />
  <ScheduleSection schedules={...} provenance={...} />
  <CostSection costs={...} provenance={...} />
  <ApplicationSection deadlines={...} provenance={...} />
  {program.sfusdConnection && <SfusdSection ... />}

  {/* Last verified / data source — was in sidebar, now below sections */}
  <div className="text-xs text-neutral-500">
    {/* metadata content from old sidebar */}
  </div>
</div>
```

Remove the `lg:grid-cols-3` grid and the sidebar `<div>` entirely.

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/programs/[slug]/page.tsx
git commit -m "fix(F027): profile page — single column layout, full-width sections"
```

---

### Task 3.2: Fix ProfileActions — inline with header

**Files:**
- Modify: `src/components/programs/profile-actions.tsx:1-180`

- [ ] **Step 1: Change to horizontal inline layout**

Change the actions from a vertical sidebar layout to a horizontal row that sits below the header:

```typescript
// Change the outer wrapper from vertical to horizontal:
<div className="flex flex-wrap items-center gap-3">
  <SaveButton programId={programId} />
  <CompareButton programId={programId} />
  <button
    onClick={() => setShowReport(!showReport)}
    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
  >
    Report an issue
  </button>
</div>

{/* Report form — below buttons when expanded */}
{showReport && (
  <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
    {/* existing report form content */}
  </div>
)}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/programs/profile-actions.tsx
git commit -m "fix(F027): profile actions — horizontal inline layout"
```

---

### Task 3.3: Fix map preview in LocationSection

**Files:**
- Modify: `src/components/programs/location-section.tsx:1-93`

- [ ] **Step 1: Use program coordinates for map preview**

The current code only uses home coordinates (from localStorage) for the static map. It should use the program's own coordinates. The component receives `coordinates` as a prop — this is the program's coordinates. The static map URL generation at lines 50-59 already uses this correctly.

The issue is that some programs may have null coordinates. Update the fallback to be more informative:

```typescript
{staticMapUrl ? (
  <img
    src={staticMapUrl}
    alt={`Map showing location of program near ${address}`}
    className="h-44 w-full rounded-md border border-neutral-200 object-cover"
    loading="lazy"
  />
) : (
  <div className="flex h-44 w-full items-center justify-center rounded-md border border-neutral-200 bg-neutral-50">
    <span className="text-sm text-neutral-400">Map preview requires coordinates</span>
  </div>
)}
```

Also verify the `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is being read correctly. The current code uses `process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` which is correct for a client component.

- [ ] **Step 2: Verify the map renders for programs with coordinates**

Start dev server, navigate to a program profile that has coordinates (most do). Verify:
- Static map image renders
- Blue pin marker visible at program location
- Image is 700x260, displayed at h-44 w-full

- [ ] **Step 3: Commit**

```bash
git add src/components/programs/location-section.tsx
git commit -m "fix(F027): improve map preview fallback styling in location section"
```

---

### Task 3.4: Final verification and cleanup

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: 9/9 passing

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build passes

- [ ] **Step 4: Manual check of profile page**

Navigate to any program profile. Verify:
- All sections span full width (no dead space on right)
- Save/Compare/Report buttons are inline below the header
- Static map preview renders (for programs with coordinates)
- Spacing is consistent between sections

- [ ] **Step 5: Update KNOWN_ISSUES.md**

Mark the two open issues as resolved:

```markdown
### [PHASE-1] Search Map view needs complete redesign
**Status:** Resolved
**Resolution:** Replaced flex layout with Full Map + Side Panel pattern (F026). Map uses absolute positioning. Split view removed.

### [PHASE-1] Program profile page needs design polish
**Status:** Resolved
**Resolution:** Single-column layout, inline actions, full-width sections, improved map preview (F027).
```

- [ ] **Step 6: Update features.json**

Set F026 and F027 status to `"pass"`.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 1 — map redesign (F026) + profile polish (F027)"
```

---

## Execution Notes

- **Task 1 (doc cleanup)** should be done first — it establishes the new roadmap that all other work references.
- **Task 2 (map redesign)** is the largest task. Steps 2.1-2.5 create new components without touching existing code. Step 2.6 is the integration point where SearchView is modified. Step 2.7 is manual testing.
- **Task 3 (profile polish)** is independent of Task 2 and can be done in parallel if using agent teams.
- The FilterModal in Task 2.3 duplicates some controls from FilterSidebar. This is intentional — the List view sidebar should remain unchanged. A follow-up refactor can extract shared filter controls if the duplication bothers you.
- Type exports may need adjustment as components are connected. If `SearchFilters`, `ProgramCardData`, or `MapProgram` aren't already exported, export them from their source files.
- The `MapContainerHandle` ref pattern requires MapContainer to be wrapped with `forwardRef`. The existing component doesn't use forwardRef — Task 2.2 adds it.
