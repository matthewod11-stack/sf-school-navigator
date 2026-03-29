"use client";

import { useCallback, useRef, useState } from "react";
import {
  MapContainer,
  type MapContainerHandle,
  type MapProgram,
} from "@/components/map/map-container";
import { MapPanel } from "./map-panel";
import { FilterModal } from "./filter-modal";
import type { ProgramCardData } from "./program-card";
import type { SearchFilters } from "@/types/api";
import type { ProgramType } from "@/types/domain";

interface MapSearchViewProps {
  programs: ProgramCardData[];
  mapPrograms: MapProgram[];
  homeCoordinates?: { lng: number; lat: number } | null;
  attendanceArea?: {
    id: string;
    name: string;
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  } | null;
  showAttendanceArea: boolean;
  onToggleAttendanceArea: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  programTypes: ProgramType[];
  languages: string[];
  compareIds: string[];
  onCompareToggle: (id: string) => void;
}

function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.budgetMax != null) count++;
  if (filters.programTypes.length > 0) count++;
  if (filters.scheduleTypes.length > 0) count++;
  if (filters.languages.length > 0) count++;
  if (filters.scoredOnly) count++;
  return count;
}

export function MapSearchView({
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

  const handlePinClick = useCallback(
    (programId: string) => {
      setSelectedProgramId(programId);
      mapRef.current?.highlightPin(programId);
    },
    [],
  );

  const handleCardSelect = useCallback(
    (programId: string) => {
      setSelectedProgramId(programId);
      const program = mapPrograms.find((p) => p.id === programId);
      if (program) {
        mapRef.current?.flyTo(program.coordinates.lng, program.coordinates.lat);
      }
      mapRef.current?.highlightPin(programId);
    },
    [mapPrograms],
  );

  const activeFilterCount = countActiveFilters(filters);

  return (
    <div className="relative h-full w-full">
      {/* Full-bleed map */}
      <MapContainer
        ref={mapRef}
        programs={mapPrograms}
        homeCoordinates={homeCoordinates}
        attendanceArea={attendanceArea}
        showAttendanceArea={showAttendanceArea}
        onProgramClick={handlePinClick}
        className="absolute inset-0"
      />

      {/* Panel overlay */}
      <MapPanel
        programs={programs}
        selectedProgramId={selectedProgramId}
        onSelectProgram={handleCardSelect}
        onCompareToggle={onCompareToggle}
        compareIds={compareIds}
        isCollapsed={panelCollapsed}
        onToggleCollapse={() => setPanelCollapsed((v) => !v)}
        query={filters.query ?? ""}
        onQueryChange={(q) =>
          onFiltersChange({ ...filters, query: q || null })
        }
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Attendance area toggle */}
      {attendanceArea && (
        <div className="absolute right-3 top-3 z-20">
          <button
            onClick={onToggleAttendanceArea}
            aria-pressed={showAttendanceArea}
            className={`rounded-md border px-3 py-1.5 text-sm shadow-sm backdrop-blur-sm ${
              showAttendanceArea
                ? "border-neutral-800 bg-neutral-900/90 text-white"
                : "border-neutral-300 bg-white/90 text-neutral-700 hover:bg-white"
            }`}
          >
            Area Overlay
          </button>
        </div>
      )}

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
