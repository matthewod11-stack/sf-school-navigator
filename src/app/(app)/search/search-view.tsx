"use client";

import { useEffect, useMemo, useState } from "react";
import type { MapProgram } from "@/components/map/map-container";
import { useCompare } from "@/components/compare/compare-context";
import { FilterSidebar } from "./filter-sidebar";
import { MapSearchView } from "./map-search-view";
import { ProgramCard, type ProgramCardData } from "./program-card";
import type { SearchFilters, SortOption } from "@/types/api";
import type { GradeLevel, MatchTier, ProgramType, ScheduleType } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GRADE_LEVEL_LABELS } from "@/lib/program-types";

const SEARCH_CONTEXT_STORAGE_KEY = "sf-school-nav-search-context";
const SEARCH_CONTEXT_CHANGE_EVENT = "sf-school-nav-search-context-change";

type ViewMode = "map" | "list";

interface SearchContext {
  familyId?: string | null;
  activeChildId?: string | null;
  attendanceAreaId?: string | null;
  attendanceAreaName?: string | null;
  homeCoordinates?: { lng: number; lat: number } | null;
  familyDraft?: {
    budgetMonthlyMax: number | null;
    preferences: {
      philosophy: string[];
      languages: string[];
      mustHaves: string[];
      niceToHaves: string[];
    };
  } | null;
}

interface SearchProgram extends MapProgram {
  slug: string;
  ageRange?: string | null;
  costRange?: string | null;
  hours?: string | null;
  languages?: string[];
  gradeLevels: GradeLevel[];
  distanceKm?: number | null;
  costLow?: number | null;
  matchScore?: number | null;
  scheduleTypes: ScheduleType[];
  lastVerifiedAt?: string | null;
  dataCompletenessScore?: number | null;
}

interface AttendanceAreaOverlay {
  id: string;
  name: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

const DEFAULT_FILTERS: SearchFilters = {
  budgetMax: null,
  programTypes: [],
  gradeLevels: [],
  languages: [],
  scheduleTypes: [],
  maxDistanceKm: null,
  scoredOnly: false,
  query: null,
  verifiedWithinMonths: null,
};

function isStale(lastVerifiedAt: string | null | undefined, withinMonths: number): boolean {
  if (!lastVerifiedAt) return true;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - withinMonths);
  return new Date(lastVerifiedAt) < cutoff;
}

function findMostLimitingFilter(
  filters: SearchFilters,
  allPrograms: SearchProgram[]
): string | null {
  const tests: [string, (p: SearchProgram) => boolean][] = [
    ["budget", (p) => filters.budgetMax != null && (p.costLow ?? 0) > filters.budgetMax],
    ["program type", (p) => filters.programTypes.length > 0 && !filters.programTypes.includes(p.primaryType)],
    ["grade level", (p) => filters.gradeLevels.length > 0 && !filters.gradeLevels.some((level) => p.gradeLevels.includes(level))],
    ["language", (p) => filters.languages.length > 0 && !(p.languages ?? []).some((l) => filters.languages.includes(l))],
    ["schedule", (p) => filters.scheduleTypes.length > 0 && !filters.scheduleTypes.some((type) => p.scheduleTypes.includes(type))],
    ["distance", (p) => filters.maxDistanceKm != null && (p.distanceKm ?? Infinity) > filters.maxDistanceKm],
    ["scored only", (p) => filters.scoredOnly && (p.matchTier == null || p.matchTier === "hidden")],
    ["data freshness", (p) => filters.verifiedWithinMonths != null && isStale(p.lastVerifiedAt, filters.verifiedWithinMonths)],
  ];

  let maxRemoved = 0;
  let mostLimiting: string | null = null;

  for (const [name, test] of tests) {
    const removed = allPrograms.filter(test).length;
    if (removed > maxRemoved) {
      maxRemoved = removed;
      mostLimiting = name;
    }
  }

  return mostLimiting;
}

function LoadingState({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "map") {
    return (
      <div className="relative min-h-0 flex-1">
        <Skeleton className="absolute inset-0 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="w-full space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function SearchView() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("match");
  const [showFilters, setShowFilters] = useState(false);
  const [showAttendanceArea, setShowAttendanceArea] = useState(true);
  const [allPrograms, setAllPrograms] = useState<SearchProgram[]>([]);
  const [attendanceArea, setAttendanceArea] = useState<AttendanceAreaOverlay | null>(null);
  const [homeCoordinates, setHomeCoordinates] = useState<{ lng: number; lat: number } | null>(null);
  const [searchContext, setSearchContext] = useState<SearchContext | null>(null);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { programs: comparePrograms } = useCompare();
  const compareIds = useMemo(
    () => comparePrograms.map((p) => p.id),
    [comparePrograms],
  );
  const { add: compareAdd, remove: compareRemove, has: compareHas } = useCompare();
  const handleCompareToggle = (id: string) => {
    if (compareHas(id)) {
      compareRemove(id);
    } else {
      const program = filteredPrograms.find((p) => p.id === id);
      if (program) {
        compareAdd({ id: program.id, slug: program.slug, name: program.name });
      }
    }
  };

  useEffect(() => {
    function loadStoredContext() {
      try {
        const raw = localStorage.getItem(SEARCH_CONTEXT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SearchContext;
          setSearchContext(parsed);
          setHomeCoordinates(parsed.homeCoordinates ?? null);

          const budgetFromIntake = parsed.familyDraft?.budgetMonthlyMax ?? null;
          const preferredLanguages = parsed.familyDraft?.preferences?.languages ?? [];
          setFilters((prev) => ({
            ...prev,
            budgetMax: budgetFromIntake ?? prev.budgetMax,
            languages: preferredLanguages.length > 0 ? preferredLanguages : prev.languages,
          }));
        }
      } catch {
        // Ignore malformed localStorage state.
      } finally {
        setContextLoaded(true);
      }
    }

    loadStoredContext();
    window.addEventListener(SEARCH_CONTEXT_CHANGE_EVENT, loadStoredContext);
    return () => window.removeEventListener(SEARCH_CONTEXT_CHANGE_EVENT, loadStoredContext);
  }, []);

  useEffect(() => {
    if (!contextLoaded) return;

    let canceled = false;
    setIsLoading(true);
    setError(null);

    async function loadPrograms() {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ context: searchContext }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? "Failed to load programs");
        }

        const payload = (await response.json()) as {
          programs: SearchProgram[];
          attendanceArea: AttendanceAreaOverlay | null;
          context: { homeCoordinates: { lng: number; lat: number } | null };
        };

        if (canceled) return;
        setAllPrograms(payload.programs);
        setAttendanceArea(payload.attendanceArea);
        if (payload.context.homeCoordinates) {
          setHomeCoordinates(payload.context.homeCoordinates);
        }
      } catch (loadError) {
        if (canceled) return;
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load search results";
        setError(message);
      } finally {
        if (!canceled) setIsLoading(false);
      }
    }

    void loadPrograms();
    return () => {
      canceled = true;
    };
  }, [contextLoaded, refreshKey, searchContext]);

  const filteredPrograms = useMemo(() => {
    let result = allPrograms.filter((p) => {
      if (filters.query) {
        const q = filters.query.toLowerCase();
        if (!p.name.toLowerCase().includes(q)) return false;
      }
      if (filters.budgetMax != null && (p.costLow ?? 0) > filters.budgetMax) {
        return false;
      }
      if (
        filters.programTypes.length > 0 &&
        !filters.programTypes.includes(p.primaryType)
      ) {
        return false;
      }
      if (
        filters.gradeLevels.length > 0 &&
        !filters.gradeLevels.some((level) => p.gradeLevels.includes(level))
      ) {
        return false;
      }
      if (
        filters.languages.length > 0 &&
        !(p.languages ?? []).some((l) => filters.languages.includes(l))
      ) {
        return false;
      }
      if (
        filters.scheduleTypes.length > 0 &&
        !filters.scheduleTypes.some((type) => p.scheduleTypes.includes(type))
      ) {
        return false;
      }
      if (
        filters.maxDistanceKm != null &&
        (p.distanceKm ?? Infinity) > filters.maxDistanceKm
      ) {
        return false;
      }
      if (
        filters.scoredOnly &&
        (p.matchTier == null || p.matchTier === "hidden")
      ) {
        return false;
      }
      if (
        filters.verifiedWithinMonths != null &&
        isStale(p.lastVerifiedAt, filters.verifiedWithinMonths)
      ) {
        return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "match":
          return (b.matchScore ?? 0) - (a.matchScore ?? 0);
        case "distance":
          return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
        case "cost-low":
          return (a.costLow ?? Infinity) - (b.costLow ?? Infinity);
        case "cost-high":
          return (b.costLow ?? -1) - (a.costLow ?? -1);
        default:
          return 0;
      }
    });

    return result;
  }, [allPrograms, filters, sort]);

  const mostLimitingFilter =
    filteredPrograms.length === 0
      ? findMostLimitingFilter(filters, allPrograms)
      : null;

  const mapPrograms: MapProgram[] = filteredPrograms;

  const cardPrograms: ProgramCardData[] = filteredPrograms.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    primaryType: p.primaryType,
    address: p.address,
    matchTier: p.matchTier as MatchTier | null,
    ageRange: p.ageRange,
    costRange: p.costRange,
    hours: p.hours,
    languages: p.languages,
    gradeLevels: p.gradeLevels,
    distanceKm: p.distanceKm,
    lastVerifiedAt: p.lastVerifiedAt,
    dataCompletenessScore: p.dataCompletenessScore,
  }));

  const availableProgramTypes = useMemo(() => {
    const types = new Set<ProgramType>();
    for (const p of allPrograms) {
      types.add(p.primaryType);
    }
    return Array.from(types);
  }, [allPrograms]);

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    for (const p of allPrograms) {
      for (const l of p.languages ?? []) {
        langs.add(l);
      }
    }
    return Array.from(langs).sort();
  }, [allPrograms]);

  const availableGradeLevels = useMemo(() => {
    const levels = new Set<GradeLevel>();
    for (const p of allPrograms) {
      for (const level of p.gradeLevels) {
        levels.add(level);
      }
    }
    return Array.from(levels).sort(
      (a, b) =>
        Object.keys(GRADE_LEVEL_LABELS).indexOf(a) -
        Object.keys(GRADE_LEVEL_LABELS).indexOf(b)
    );
  }, [allPrograms]);

  return (
    <div className="flex h-full w-full gap-6">
      {/* Filter sidebar — visible in list mode, hidden in map mode (map has its own FilterModal) */}
      {viewMode === "list" && (
        <div
          className={`${
            showFilters ? "block" : "hidden"
          } fixed inset-0 z-30 overflow-y-auto bg-white p-6 lg:relative lg:inset-auto lg:z-auto lg:block lg:w-64 lg:shrink-0 lg:overflow-visible lg:bg-transparent lg:p-0`}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <h2 className="font-serif text-lg font-bold">Filters</h2>
            <button
              onClick={() => setShowFilters(false)}
              className="text-sm text-neutral-500"
            >
              Close
            </button>
          </div>
          <FilterSidebar
            filters={filters}
            sort={sort}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            resultCount={filteredPrograms.length}
          />
        </div>
      )}

      {/* Header bar — always visible */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {viewMode === "list" && (
              <button
                onClick={() => setShowFilters(true)}
                aria-expanded={showFilters}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 lg:hidden"
              >
                Filters
              </button>
            )}
            <div aria-live="polite">
              <h1 className="font-serif text-xl font-bold text-neutral-900">
                {filteredPrograms.length} Program{filteredPrograms.length !== 1 ? "s" : ""}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === "list" && attendanceArea && (
              <button
                onClick={() => setShowAttendanceArea((v) => !v)}
                aria-pressed={showAttendanceArea}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  showAttendanceArea
                    ? "border-neutral-800 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Area Overlay
              </button>
            )}
            <div role="group" aria-label="View mode" className="flex rounded-md border border-neutral-200">
              {(["list", "map"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  aria-pressed={viewMode === mode}
                  className={`px-3 py-1.5 text-sm capitalize ${
                    viewMode === mode
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-600 hover:bg-neutral-50"
                  } ${mode === "list" ? "rounded-l-md" : "rounded-r-md"}`}
                >
                  {mode === "list" ? "List" : "Map"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="shrink-0 rounded-lg border border-error-500/30 bg-error-500/5 p-4">
            <p className="text-sm text-error-500">{error}</p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              Retry
            </Button>
          </div>
        )}

        {isLoading ? (
          <LoadingState viewMode={viewMode} />
        ) : viewMode === "map" ? (
          <div className="relative" style={{ height: "calc(100dvh - 11rem)" }}>
            <MapSearchView
              programs={cardPrograms}
              mapPrograms={mapPrograms}
              homeCoordinates={homeCoordinates}
              attendanceArea={attendanceArea}
              showAttendanceArea={showAttendanceArea}
              onToggleAttendanceArea={() => setShowAttendanceArea((v) => !v)}
              filters={filters}
              onFiltersChange={setFilters}
              programTypes={availableProgramTypes}
              gradeLevels={availableGradeLevels}
              languages={availableLanguages}
              compareIds={compareIds}
              onCompareToggle={handleCompareToggle}
            />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="w-full">
              {filteredPrograms.length === 0 ? (
                <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
                  <p className="font-medium text-neutral-900">
                    No programs match your filters
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    {mostLimitingFilter
                      ? `Try adjusting the "${mostLimitingFilter}" filter to see more results.`
                      : "Try relaxing some filters to see more results."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cardPrograms.map((p) => (
                    <ProgramCard
                      key={p.id}
                      program={p}
                      selected={selectedProgramId === p.id}
                      onClick={() => setSelectedProgramId(p.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
