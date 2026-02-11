"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProgramType, MatchTier } from "@/types/domain";

const TYPE_LABELS: Record<ProgramType, string> = {
  center: "Center",
  "family-home": "Family Home",
  "sfusd-prek": "SFUSD Pre-K",
  "sfusd-tk": "SFUSD TK",
  "head-start": "Head Start",
  montessori: "Montessori",
  waldorf: "Waldorf",
  religious: "Religious",
  "co-op": "Co-op",
  other: "Other",
};

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
  costRange?: string | null;
  hours?: string | null;
  languages?: string[];
  distanceKm?: number | null;
  lastVerifiedAt?: string | null;
}

interface ProgramCardProps {
  program: ProgramCardData;
  selected: boolean;
  onClick: () => void;
}

export function ProgramCard({ program, selected, onClick }: ProgramCardProps) {
  return (
    <div
      onClick={onClick}
      className={`block w-full rounded-lg border p-4 text-left transition-colors cursor-pointer ${
        selected
          ? "border-brand-500 bg-brand-50 shadow-sm"
          : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-neutral-900">
            <Link
              href={`/programs/${program.slug}`}
              className="hover:text-brand-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {program.name}
            </Link>
          </h3>
          {program.address && (
            <p className="mt-0.5 truncate text-xs text-neutral-500">
              {program.address}
            </p>
          )}
        </div>
        {program.matchTier && program.matchTier !== "hidden" && (
          <Badge color={TIER_COLORS[program.matchTier]} className="shrink-0">
            {program.matchTier}
          </Badge>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge color="gray">{TYPE_LABELS[program.primaryType]}</Badge>
        {program.languages?.map((lang) => (
          <Badge key={lang} color="blue">
            {lang}
          </Badge>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
        {program.ageRange && <span>{program.ageRange}</span>}
        {program.costRange && <span>{program.costRange}</span>}
        {program.hours && <span>{program.hours}</span>}
        {program.distanceKm != null && (
          <span>{program.distanceKm.toFixed(1)} km</span>
        )}
      </div>

      {program.lastVerifiedAt && (
        <p className="mt-2 text-xs text-neutral-400">
          Verified{" "}
          {new Date(program.lastVerifiedAt).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
