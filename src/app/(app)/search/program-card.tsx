"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EducationTooltip } from "@/components/education/education-tooltip";
import { useCompare } from "@/components/compare/compare-context";
import { QualityBanner } from "@/components/programs/quality-banner";
import type { GradeLevel, ProgramType, MatchTier } from "@/types/domain";
import { MATCH_TIER_EDUCATION, SEARCH_PROFILE_EDUCATION } from "@/lib/content/education";
import { formatGradeLevels, isElementaryProgramType, PROGRAM_TYPE_LABELS } from "@/lib/program-types";

const TIER_COLORS: Record<MatchTier, "green" | "blue" | "yellow" | "gray"> = {
  strong: "green",
  good: "blue",
  partial: "yellow",
  hidden: "gray",
};

export interface ProgramCardData {
  id: string;
  slug: string;
  name: string;
  primaryType: ProgramType;
  address?: string | null;
  matchTier?: MatchTier | null;
  ageRange?: string | null;
  gradeLevels: GradeLevel[];
  costRange?: string | null;
  hours?: string | null;
  languages?: string[];
  distanceKm?: number | null;
  lastVerifiedAt?: string | null;
  dataCompletenessScore?: number | null;
}

interface ProgramCardProps {
  program: ProgramCardData;
  selected: boolean;
  onClick: () => void;
}

export const ProgramCard = React.forwardRef<HTMLDivElement, ProgramCardProps>(
  function ProgramCard({ program, selected, onClick }, ref) {
  const { add, remove, has, isFull } = useCompare();
  const inCompare = has(program.id);

  function handleCompareToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (inCompare) {
      remove(program.id);
    } else {
      add({ id: program.id, slug: program.slug, name: program.name });
    }
  }

  return (
    <div
      ref={ref}
      role="article"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
      className={`block w-full rounded-md border bg-white p-4 text-left transition-colors cursor-pointer ${
        selected
          ? "border-brand-300 bg-brand-50 shadow-sm"
          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-serif truncate text-sm font-semibold text-neutral-900">
            <Link
              href={`/programs/${program.slug}`}
              className="hover:text-brand-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {program.name}
            </Link>
          </h2>
          {program.address && (
            <p className="mt-0.5 truncate text-xs text-neutral-500">
              {program.address}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {program.matchTier && program.matchTier !== "hidden" && (
            <EducationTooltip
              label={`What ${program.matchTier} match means`}
              description={MATCH_TIER_EDUCATION[program.matchTier]}
            >
              <Badge color={TIER_COLORS[program.matchTier]}>
                {program.matchTier === "strong" ? "Strong Match" : program.matchTier === "good" ? "Good Match" : "Partial Match"}
              </Badge>
            </EducationTooltip>
          )}
          <button
            onClick={handleCompareToggle}
            disabled={!inCompare && isFull}
            className={`rounded px-3 py-1.5 text-xs transition-colors ${
              inCompare
                ? "bg-brand-100 text-brand-700 hover:bg-brand-200"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40"
            }`}
          >
            {inCompare ? "- Compare" : "+ Compare"}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge color="gray">{PROGRAM_TYPE_LABELS[program.primaryType]}</Badge>
        {program.gradeLevels.length > 0 && (
          <EducationTooltip
            label="What grade labels mean"
            description={SEARCH_PROFILE_EDUCATION.gradeLevels}
          >
            <Badge color="gray">{formatGradeLevels(program.gradeLevels)}</Badge>
          </EducationTooltip>
        )}
        {program.primaryType.startsWith("sfusd-") && !isElementaryProgramType(program.primaryType) && (
          <EducationTooltip
            label="What K-path means"
            description={SEARCH_PROFILE_EDUCATION.kPath}
          >
            <Badge color="blue">K-path</Badge>
          </EducationTooltip>
        )}
        {program.languages?.map((lang) => (
          <Badge key={lang} color="blue">
            {lang}
          </Badge>
        ))}
      </div>

      <QualityBanner
        compact
        className="mt-2"
        score={program.dataCompletenessScore ?? 0}
        lastVerifiedAt={program.lastVerifiedAt}
      />

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
        {program.ageRange && <span>{program.ageRange}</span>}
        <span>{program.costRange ?? "Cost not available"}</span>
        {program.hours && <span>{program.hours}</span>}
        {program.distanceKm != null && (
          <span>{program.distanceKm.toFixed(1)} km</span>
        )}
        {!program.ageRange && !program.costRange && !program.hours && (
          <span className="italic text-neutral-400">Limited info available</span>
        )}
      </div>

      {program.lastVerifiedAt && (
        <p className="mt-2 text-xs text-neutral-500">
          Verified{" "}
          {new Date(program.lastVerifiedAt).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
});
