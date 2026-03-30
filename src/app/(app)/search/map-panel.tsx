"use client";

import React, { useEffect, useRef } from "react";
import { ProgramCard, type ProgramCardData } from "./program-card";

interface MapPanelProps {
  programs: ProgramCardData[];
  selectedProgramId: string | null;
  onSelectProgram: (id: string) => void;
  onCompareToggle?: (id: string) => void;
  compareIds?: string[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

export function MapPanel({
  programs,
  selectedProgramId,
  onSelectProgram,
  isCollapsed,
  onToggleCollapse,
  query,
  onQueryChange,
  onOpenFilters,
  activeFilterCount,
}: MapPanelProps) {
  // Map of program ID → ref for scroll-to-card
  const cardRefsRef = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(
    new Map()
  );

  // Keep refs in sync with current programs list
  programs.forEach((p) => {
    if (!cardRefsRef.current.has(p.id)) {
      cardRefsRef.current.set(p.id, React.createRef<HTMLDivElement>());
    }
  });

  // Scroll selected card into view whenever selectedProgramId changes
  useEffect(() => {
    if (!selectedProgramId) return;
    const ref = cardRefsRef.current.get(selectedProgramId);
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedProgramId]);

  if (isCollapsed) {
    return (
      <div className="absolute left-0 top-0 z-10 p-2">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white/90 px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur-sm hover:bg-white"
          aria-label="Open program list"
        >
          <span>☰</span>
          <span>
            {programs.length} program{programs.length !== 1 ? "s" : ""}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute left-0 top-0 z-10 flex h-full w-[340px] flex-col border-r border-neutral-200 bg-white/95 backdrop-blur-sm lg:w-[380px]">
      {/* Header */}
      <div className="flex-none border-b border-neutral-200 p-3">
        <div className="flex items-center gap-2">
          {/* Search input */}
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search programs…"
            className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {/* Filter button */}
          <button
            onClick={onOpenFilters}
            className="relative flex shrink-0 items-center gap-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
            aria-label="Open filters"
          >
            {/* Sliders icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="4" x2="4" y1="21" y2="14" />
              <line x1="4" x2="4" y1="10" y2="3" />
              <line x1="12" x2="12" y1="21" y2="12" />
              <line x1="12" x2="12" y1="8" y2="3" />
              <line x1="20" x2="20" y1="21" y2="16" />
              <line x1="20" x2="20" y1="12" y2="3" />
              <line x1="1" x2="7" y1="14" y2="14" />
              <line x1="9" x2="15" y1="8" y2="8" />
              <line x1="17" x2="23" y1="16" y2="16" />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Collapse button */}
          <button
            onClick={onToggleCollapse}
            className="flex shrink-0 items-center justify-center rounded-md border border-neutral-200 p-1.5 text-neutral-500 hover:bg-neutral-50"
            aria-label="Collapse panel"
          >
            {/* Chevron left icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-xs text-neutral-500">
          {programs.length} program{programs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Scrollable card list */}
      <div className="flex-1 overflow-y-auto">
        {programs.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-neutral-700">
              No programs match your filters
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {programs.map((p) => {
              const ref = cardRefsRef.current.get(p.id)!;
              return (
                <ProgramCard
                  key={p.id}
                  ref={ref}
                  program={p}
                  selected={selectedProgramId === p.id}
                  onClick={() => onSelectProgram(p.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
