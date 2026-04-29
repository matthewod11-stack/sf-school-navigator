"use client";

import type { SearchFilters } from "@/types/api";
import type { GradeLevel, ProgramType, ScheduleType } from "@/types/domain";
import { FILTER_PROGRAM_TYPE_LABELS, GRADE_LEVEL_LABELS } from "@/lib/program-types";

const SCHEDULE_LABELS: Record<ScheduleType, string> = {
  "full-day": "Full Day",
  "half-day-am": "Half Day (AM)",
  "half-day-pm": "Half Day (PM)",
  "extended-day": "Extended Day",
};

const ALL_SCHEDULE_TYPES = Object.keys(SCHEDULE_LABELS) as ScheduleType[];

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

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  programTypes: ProgramType[];
  gradeLevels: GradeLevel[];
  languages: string[];
}

export function FilterModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  programTypes,
  gradeLevels,
  languages,
}: FilterModalProps) {
  if (!isOpen) return null;

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

  function resetFilters() {
    onFiltersChange(DEFAULT_FILTERS);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter programs"
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-xl bg-white shadow-xl"
      >
        <div className="flex max-h-[70vh] flex-col overflow-hidden rounded-xl">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-4">
            <h2 className="font-serif text-base font-bold text-neutral-900">
              Filters
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-6">
              {/* Budget */}
              <div className="space-y-2">
                <label
                  htmlFor="modal-budget"
                  className="block text-xs font-semibold uppercase tracking-wide text-neutral-500"
                >
                  Max Monthly Budget
                </label>
                <input
                  id="modal-budget"
                  type="range"
                  min={0}
                  max={4000}
                  step={100}
                  value={filters.budgetMax ?? 4000}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      budgetMax:
                        Number(e.target.value) === 4000
                          ? null
                          : Number(e.target.value),
                    })
                  }
                  className="w-full accent-neutral-800"
                />
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>$0</span>
                  <span className="font-medium text-neutral-800">
                    {filters.budgetMax === null
                      ? "No limit"
                      : `$${filters.budgetMax.toLocaleString()}/mo`}
                  </span>
                  <span>$4,000+</span>
                </div>
              </div>

              {/* Program Type */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Program Type
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {programTypes.map((type) => {
                    const active = filters.programTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleProgramType(type)}
                        aria-pressed={active}
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          active
                            ? "border-neutral-800 bg-neutral-800 text-white"
                            : "border-neutral-200 bg-neutral-100 text-neutral-600 hover:border-neutral-400"
                        }`}
                      >
                        {FILTER_PROGRAM_TYPE_LABELS[type]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {gradeLevels.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Grade
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {gradeLevels.map((level) => {
                      const active = filters.gradeLevels.includes(level);
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleGradeLevel(level)}
                          aria-pressed={active}
                          className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                            active
                              ? "border-neutral-800 bg-neutral-800 text-white"
                              : "border-neutral-200 bg-neutral-100 text-neutral-600 hover:border-neutral-400"
                          }`}
                        >
                          {GRADE_LEVEL_LABELS[level]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Schedule
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SCHEDULE_TYPES.map((type) => {
                    const active = filters.scheduleTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleScheduleType(type)}
                        aria-pressed={active}
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          active
                            ? "border-neutral-800 bg-neutral-800 text-white"
                            : "border-neutral-200 bg-neutral-100 text-neutral-600 hover:border-neutral-400"
                        }`}
                      >
                        {SCHEDULE_LABELS[type]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Languages */}
              {languages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Language
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((lang) => {
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
                              : "border-neutral-200 bg-neutral-100 text-neutral-600 hover:border-neutral-400"
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Scored only */}
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={filters.scoredOnly}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, scoredOnly: e.target.checked })
                  }
                  className="rounded border-neutral-300 text-neutral-800 focus:ring-neutral-700"
                />
                <span className="text-sm text-neutral-700">
                  Show scored programs only
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-neutral-100 px-5 py-4">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
