"use client";

import type { SearchFilters, SortOption } from "@/types/api";
import type { GradeLevel, ProgramType, ScheduleType } from "@/types/domain";
import { PROGRAM_LANGUAGES } from "@/lib/config/cities/sf";
import { Button } from "@/components/ui/button";
import { FILTER_PROGRAM_TYPE_LABELS, GRADE_LEVEL_LABELS, GRADE_LEVELS } from "@/lib/program-types";

const SCHEDULE_LABELS: Record<ScheduleType, string> = {
  "full-day": "Full Day",
  "half-day-am": "Half Day (AM)",
  "half-day-pm": "Half Day (PM)",
  "extended-day": "Extended Day",
};

const ALL_PROGRAM_TYPES = Object.keys(FILTER_PROGRAM_TYPE_LABELS) as ProgramType[];
const ALL_SCHEDULE_TYPES = Object.keys(SCHEDULE_LABELS) as ScheduleType[];

interface FilterSidebarProps {
  filters: SearchFilters;
  sort: SortOption;
  onFiltersChange: (filters: SearchFilters) => void;
  onSortChange: (sort: SortOption) => void;
  resultCount: number;
}

export function FilterSidebar({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  resultCount,
}: FilterSidebarProps) {
  function toggleProgramType(type: ProgramType) {
    const next = filters.programTypes.includes(type)
      ? filters.programTypes.filter((t) => t !== type)
      : [...filters.programTypes, type];
    onFiltersChange({ ...filters, programTypes: next });
  }

  function toggleScheduleType(type: ScheduleType) {
    const next = filters.scheduleTypes.includes(type)
      ? filters.scheduleTypes.filter((t) => t !== type)
      : [...filters.scheduleTypes, type];
    onFiltersChange({ ...filters, scheduleTypes: next });
  }

  function toggleGradeLevel(level: GradeLevel) {
    const next = filters.gradeLevels.includes(level)
      ? filters.gradeLevels.filter((g) => g !== level)
      : [...filters.gradeLevels, level];
    onFiltersChange({ ...filters, gradeLevels: next });
  }

  function toggleLanguage(lang: string) {
    const next = filters.languages.includes(lang)
      ? filters.languages.filter((l) => l !== lang)
      : [...filters.languages, lang];
    onFiltersChange({ ...filters, languages: next });
  }

  function clearFilters() {
    onFiltersChange({
      budgetMax: null,
      programTypes: [],
      gradeLevels: [],
      languages: [],
      scheduleTypes: [],
      maxDistanceKm: null,
      scoredOnly: false,
      query: null,
      verifiedWithinMonths: null,
    });
  }

  const hasActiveFilters =
    filters.budgetMax !== null ||
    filters.programTypes.length > 0 ||
    filters.gradeLevels.length > 0 ||
    filters.languages.length > 0 ||
    filters.scheduleTypes.length > 0 ||
    filters.maxDistanceKm !== null ||
    filters.scoredOnly ||
    Boolean(filters.query) ||
    filters.verifiedWithinMonths !== null;

  return (
    <aside className="space-y-6">
      {/* Sort */}
      <div className="space-y-2">
        <label
          htmlFor="sort"
          className="block text-xs font-semibold uppercase tracking-wide text-neutral-500"
        >
          Sort by
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
        >
          <option value="match">Best Match</option>
          <option value="distance">Distance</option>
          <option value="cost-low">Cost: Low to High</option>
          <option value="cost-high">Cost: High to Low</option>
        </select>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <label
          htmlFor="query"
          className="block text-xs font-semibold uppercase tracking-wide text-neutral-500"
        >
          Search
        </label>
        <input
          id="query"
          type="text"
          placeholder="Program name..."
          value={filters.query ?? ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              query: e.target.value || null,
            })
          }
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
        />
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <label
          htmlFor="budget"
          className="block text-xs font-semibold uppercase tracking-wide text-neutral-500"
        >
          Max Monthly Budget
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
            $
          </span>
          <input
            id="budget"
            type="number"
            min={0}
            step={100}
            placeholder="No limit"
            value={filters.budgetMax ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                budgetMax: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="block w-full rounded-md border border-neutral-300 py-2 pl-7 pr-3 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Distance */}
      <div className="space-y-2">
        <label
          htmlFor="distance"
          className="block text-xs font-semibold uppercase tracking-wide text-neutral-500"
        >
          Max Distance (km)
        </label>
        <select
          id="distance"
          value={filters.maxDistanceKm ?? ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              maxDistanceKm: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
        >
          <option value="">Any distance</option>
          <option value={1}>1 km</option>
          <option value={2}>2 km</option>
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
        </select>
      </div>

      {/* Program Types */}
      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Program Type
        </legend>
        <div className="space-y-1.5">
          {ALL_PROGRAM_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.programTypes.includes(type)}
                onChange={() => toggleProgramType(type)}
                className="rounded border-neutral-300 text-neutral-800 focus:ring-neutral-700"
              />
              <span className="text-neutral-700">
                {FILTER_PROGRAM_TYPE_LABELS[type]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Grade
        </legend>
        <div className="grid grid-cols-2 gap-1.5">
          {GRADE_LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.gradeLevels.includes(level)}
                onChange={() => toggleGradeLevel(level)}
                className="rounded border-neutral-300 text-neutral-800 focus:ring-neutral-700"
              />
              <span className="text-neutral-700">{GRADE_LEVEL_LABELS[level]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Schedule */}
      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Schedule
        </legend>
        <div className="space-y-1.5">
          {ALL_SCHEDULE_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.scheduleTypes.includes(type)}
                onChange={() => toggleScheduleType(type)}
                className="rounded border-neutral-300 text-neutral-800 focus:ring-neutral-700"
              />
              <span className="text-neutral-700">
                {SCHEDULE_LABELS[type]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Languages */}
      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Languages
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {PROGRAM_LANGUAGES.map((lang) => {
            const active = filters.languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                aria-pressed={active}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? "border-neutral-800 bg-neutral-800 text-white"
                    : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Data Freshness */}
      <div className="space-y-2">
        <label
          htmlFor="freshness"
          className="block text-xs font-semibold uppercase tracking-wide text-neutral-500"
        >
          Data Freshness
        </label>
        <select
          id="freshness"
          value={filters.verifiedWithinMonths ?? ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              verifiedWithinMonths: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
        >
          <option value="">Any</option>
          <option value={3}>Verified within 3 months</option>
          <option value={6}>Verified within 6 months</option>
          <option value={12}>Verified within 1 year</option>
        </select>
      </div>

      {/* Scored only */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.scoredOnly}
          onChange={(e) =>
            onFiltersChange({ ...filters, scoredOnly: e.target.checked })
          }
          className="rounded border-neutral-300 text-neutral-800 focus:ring-neutral-700"
        />
        <span className="text-neutral-700">Only show matched programs</span>
      </label>

      {/* Clear */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          aria-label={`Clear all filters (${
            [
              filters.budgetMax !== null,
              filters.programTypes.length > 0,
              filters.gradeLevels.length > 0,
              filters.languages.length > 0,
              filters.scheduleTypes.length > 0,
              filters.maxDistanceKm !== null,
              filters.scoredOnly,
              Boolean(filters.query),
              filters.verifiedWithinMonths !== null,
            ].filter(Boolean).length
          } active)`}
          className="w-full"
        >
          Clear all filters
        </Button>
      )}

      <p className="text-xs text-neutral-500">
        {resultCount} program{resultCount !== 1 ? "s" : ""} found
      </p>
    </aside>
  );
}
