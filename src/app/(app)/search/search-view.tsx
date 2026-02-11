"use client";

import { useState, useMemo } from "react";
import { MapContainer, type MapProgram } from "@/components/map/map-container";
import { FilterSidebar } from "./filter-sidebar";
import { ProgramCard, type ProgramCardData } from "./program-card";
import type { SearchFilters, SortOption } from "@/types/api";
import type { MatchTier } from "@/types/domain";

// Demo data — enriched for card display
interface DemoProgram extends MapProgram {
  ageRange?: string;
  costRange?: string;
  hours?: string;
  languages?: string[];
  distanceKm?: number;
  costLow?: number;
  matchScore?: number;
}

const DEMO_PROGRAMS: DemoProgram[] = [
  { id: "1", name: "Bright Horizons FiDi", primaryType: "center", coordinates: { lng: -122.3986, lat: 37.7936 }, matchTier: "strong", address: "100 Pine St", ageRange: "6 mo - 5 yr", costRange: "$2,200-$3,000/mo", hours: "7am-6pm", languages: ["English"], distanceKm: 3.2, costLow: 2200, matchScore: 92 },
  { id: "2", name: "Little Steps Family Care", primaryType: "family-home", coordinates: { lng: -122.4306, lat: 37.7516 }, matchTier: "good", address: "234 Noe St", ageRange: "12 mo - 4 yr", costRange: "$1,500-$1,800/mo", hours: "8am-5:30pm", languages: ["English", "Spanish"], distanceKm: 1.4, costLow: 1500, matchScore: 78 },
  { id: "3", name: "SF Montessori Academy", primaryType: "montessori", coordinates: { lng: -122.4374, lat: 37.7649 }, matchTier: "strong", address: "500 Hayes St", ageRange: "2 yr - 6 yr", costRange: "$2,500-$3,200/mo", hours: "8:30am-3pm", languages: ["English"], distanceKm: 2.1, costLow: 2500, matchScore: 88 },
  { id: "4", name: "SFUSD Pre-K at Clarendon", primaryType: "sfusd-prek", coordinates: { lng: -122.4568, lat: 37.7569 }, matchTier: "good", address: "500 Clarendon Ave", ageRange: "4 yr - 5 yr", costRange: "Free", hours: "8am-2:30pm", languages: ["English", "Mandarin"], distanceKm: 3.8, costLow: 0, matchScore: 75 },
  { id: "5", name: "Mission Waldorf School", primaryType: "waldorf", coordinates: { lng: -122.4194, lat: 37.7599 }, matchTier: "partial", address: "3065 Mission St", ageRange: "3 yr - 6 yr", costRange: "$1,800-$2,400/mo", hours: "8:30am-3pm", languages: ["English", "Spanish"], distanceKm: 2.8, costLow: 1800, matchScore: 60 },
  { id: "6", name: "St. Peter's Preschool", primaryType: "religious", coordinates: { lng: -122.4107, lat: 37.8017 }, matchTier: null, address: "450 Filbert St", ageRange: "2 yr - 5 yr", costRange: "$1,200-$1,600/mo", hours: "9am-12pm", languages: ["English"], distanceKm: 5.1, costLow: 1200 },
  { id: "7", name: "Inner Sunset Co-op", primaryType: "co-op", coordinates: { lng: -122.4696, lat: 37.7629 }, matchTier: "good", address: "1360 9th Ave", ageRange: "2 yr - 5 yr", costRange: "$800-$1,200/mo", hours: "9am-1pm", languages: ["English"], distanceKm: 4.2, costLow: 800, matchScore: 72 },
  { id: "8", name: "Head Start Bayview", primaryType: "head-start", coordinates: { lng: -122.3932, lat: 37.7299 }, matchTier: null, address: "4800 3rd St", ageRange: "3 yr - 5 yr", costRange: "Free", hours: "8am-3pm", languages: ["English"], distanceKm: 7.5, costLow: 0 },
  { id: "9", name: "Richmond TK Program", primaryType: "sfusd-tk", coordinates: { lng: -122.4807, lat: 37.7797 }, matchTier: "partial", address: "650 25th Ave", ageRange: "4 yr - 5 yr", costRange: "Free", hours: "8am-2:30pm", languages: ["English", "Cantonese"], distanceKm: 6.0, costLow: 0, matchScore: 55 },
  { id: "10", name: "Noe Valley Nursery", primaryType: "center", coordinates: { lng: -122.4339, lat: 37.7499 }, matchTier: "strong", address: "1021 Sanchez St", ageRange: "18 mo - 5 yr", costRange: "$2,000-$2,800/mo", hours: "7:30am-5:30pm", languages: ["English"], distanceKm: 1.0, costLow: 2000, matchScore: 95 },
  { id: "11", name: "Sunset Family Daycare", primaryType: "family-home", coordinates: { lng: -122.4938, lat: 37.7556 }, matchTier: null, address: "2330 42nd Ave", ageRange: "6 mo - 4 yr", costRange: "$1,400-$1,700/mo", hours: "7:30am-5pm", languages: ["English", "Cantonese"], distanceKm: 7.8, costLow: 1400 },
  { id: "12", name: "Excelsior Learning Center", primaryType: "other", coordinates: { lng: -122.4316, lat: 37.7229 }, matchTier: null, address: "4900 Mission St", ageRange: "2 yr - 5 yr", costRange: "$1,100-$1,500/mo", hours: "8am-5pm", languages: ["English", "Spanish"], distanceKm: 6.3, costLow: 1100 },
];

const DEFAULT_FILTERS: SearchFilters = {
  budgetMax: null,
  programTypes: [],
  languages: [],
  scheduleTypes: [],
  maxDistanceKm: null,
  scoredOnly: false,
  query: null,
};

type ViewMode = "map" | "list" | "split";

function findMostLimitingFilter(
  filters: SearchFilters,
  allPrograms: DemoProgram[]
): string | null {
  // Test each filter individually to find which one eliminates the most
  const tests: [string, (p: DemoProgram) => boolean][] = [
    ["budget", (p) => filters.budgetMax != null && (p.costLow ?? 0) > filters.budgetMax],
    ["program type", (p) => filters.programTypes.length > 0 && !filters.programTypes.includes(p.primaryType)],
    ["language", (p) => filters.languages.length > 0 && !(p.languages ?? []).some((l) => filters.languages.includes(l))],
    ["distance", (p) => filters.maxDistanceKm != null && (p.distanceKm ?? Infinity) > filters.maxDistanceKm],
    ["scored only", (p) => filters.scoredOnly && (p.matchTier == null || p.matchTier === "hidden")],
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

export function SearchView() {
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("match");
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters
  const filteredPrograms = useMemo(() => {
    let result = DEMO_PROGRAMS.filter((p) => {
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
        filters.languages.length > 0 &&
        !(p.languages ?? []).some((l) => filters.languages.includes(l))
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
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "match":
          return (b.matchScore ?? 0) - (a.matchScore ?? 0);
        case "distance":
          return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
        case "cost-low":
          return (a.costLow ?? 0) - (b.costLow ?? 0);
        case "cost-high":
          return (b.costLow ?? 0) - (a.costLow ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [filters, sort]);

  const mostLimitingFilter =
    filteredPrograms.length === 0
      ? findMostLimitingFilter(filters, DEMO_PROGRAMS)
      : null;

  // Map programs derived from filtered list
  const mapPrograms: MapProgram[] = filteredPrograms;

  // Card data from demo programs
  const cardPrograms: ProgramCardData[] = filteredPrograms.map((p) => ({
    id: p.id,
    name: p.name,
    primaryType: p.primaryType,
    address: p.address,
    matchTier: p.matchTier as MatchTier | null,
    ageRange: p.ageRange,
    costRange: p.costRange,
    hours: p.hours,
    languages: p.languages,
    distanceKm: p.distanceKm,
  }));

  return (
    <div className="flex w-full gap-6">
      {/* Filter sidebar — desktop always visible, mobile toggle */}
      <div
        className={`${
          showFilters ? "block" : "hidden"
        } fixed inset-0 z-30 overflow-y-auto bg-white p-6 lg:relative lg:inset-auto lg:z-auto lg:block lg:w-64 lg:shrink-0 lg:overflow-visible lg:bg-transparent lg:p-0`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <h2 className="text-lg font-bold">Filters</h2>
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

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(true)}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 lg:hidden"
            >
              Filters
            </button>
            <h1 className="text-xl font-bold text-neutral-900">
              {filteredPrograms.length} Program{filteredPrograms.length !== 1 ? "s" : ""}
            </h1>
          </div>
          <div className="flex rounded-md border border-neutral-200">
            {(["map", "split", "list"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm capitalize ${
                  viewMode === mode
                    ? "bg-brand-600 text-white"
                    : "text-neutral-600 hover:bg-neutral-50"
                } ${mode === "map" ? "rounded-l-md" : mode === "list" ? "rounded-r-md" : ""}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          className={`flex flex-1 gap-4 ${
            viewMode === "split" ? "flex-col lg:flex-row" : ""
          }`}
          style={{ minHeight: "calc(100vh - 200px)" }}
        >
          {/* Map */}
          {(viewMode === "map" || viewMode === "split") && (
            <MapContainer
              programs={mapPrograms}
              onProgramClick={setSelectedProgramId}
              className={`rounded-lg ${
                viewMode === "map"
                  ? "h-full w-full"
                  : "h-[400px] w-full lg:h-auto lg:flex-1"
              }`}
            />
          )}

          {/* List */}
          {(viewMode === "list" || viewMode === "split") && (
            <div
              className={`overflow-y-auto ${
                viewMode === "list"
                  ? "w-full"
                  : "w-full lg:w-[380px] lg:shrink-0"
              }`}
            >
              {filteredPrograms.length === 0 ? (
                <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
                  <p className="text-neutral-900 font-medium">
                    No programs match your filters
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    {mostLimitingFilter
                      ? `Try adjusting the "${mostLimitingFilter}" filter to see more results.`
                      : "Try relaxing some filters to see more results."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
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
          )}
        </div>
      </div>
    </div>
  );
}
