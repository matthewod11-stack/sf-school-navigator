"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProgramWithDetails } from "@/types/domain";
import type { CompareMetrics } from "./types";

const TYPE_LABELS: Record<string, string> = {
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

function formatAgeRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  function fmt(v: number) {
    if (v < 12) return `${v} mo`;
    if (v % 12 === 0) return `${v / 12} yr`;
    return `${(v / 12).toFixed(1)} yr`;
  }
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

function formatCost(program: ProgramWithDetails): string | null {
  const costs = [
    ...program.costs.map((c) => c.tuitionMonthlyLow).filter((n): n is number => n != null),
    ...program.schedules.map((s) => s.monthlyCostLow).filter((n): n is number => n != null),
  ];
  if (costs.length === 0) return null;
  const low = Math.min(...costs);
  return `From $${low.toLocaleString()}/mo`;
}

interface MobileCompareCardsProps {
  programs: ProgramWithDetails[];
  compareData: Record<string, CompareMetrics>;
  onRemove: (programId: string) => void;
}

function formatMatchTier(tier: CompareMetrics["matchTier"]): string | null {
  if (!tier || tier === "hidden") return null;
  return `${tier[0].toUpperCase()}${tier.slice(1)} Match`;
}

function formatDistance(distanceKm: number | null): string | null {
  if (distanceKm == null) return null;
  return `${distanceKm.toFixed(1)} km`;
}

function isSfusd(primaryType: string): boolean {
  return primaryType.startsWith("sfusd-");
}

function formatKpath(program: ProgramWithDetails, metrics: CompareMetrics | undefined): string | null {
  if (!isSfusd(program.primaryType)) return null;
  const parts: string[] = [];
  if (program.sfusdLinkage?.tiebreakerEligible) {
    parts.push("Tiebreaker eligible");
  }
  if (program.sfusdLinkage?.feederElementarySchool) {
    parts.push(`Feeder: ${program.sfusdLinkage.feederElementarySchool}`);
  }
  if (metrics?.attendanceAreaName && parts.length === 0) {
    parts.push(metrics.attendanceAreaName);
  }
  return parts.length > 0 ? parts.join("; ") : "SFUSD";
}

export function MobileCompareCards({ programs, compareData, onRemove }: MobileCompareCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = programs[currentIndex];
  if (!current) return null;

  const ageRange = formatAgeRange(current.ageMinMonths, current.ageMaxMonths);
  const cost = formatCost(current);
  const metrics = compareData[current.id];
  const matchTier = formatMatchTier(metrics?.matchTier ?? null);
  const distance = formatDistance(metrics?.distanceKm ?? null);
  const kpath = formatKpath(current, metrics);

  return (
    <div>
      {/* Navigation dots */}
      <div className="mb-4 flex items-center justify-center gap-2">
        {programs.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setCurrentIndex(i)}
            className={`h-[44px] w-[44px] flex items-center justify-center rounded-full transition-colors`}
            aria-label={`View ${p.name}`}
          >
            <span className={`block h-2.5 w-2.5 rounded-full ${
              i === currentIndex ? "bg-brand-600" : "bg-neutral-300"
            }`} />
          </button>
        ))}
      </div>

      {/* Swipe buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          Prev
        </Button>
        <span className="flex-1 text-center text-xs text-neutral-500">
          {currentIndex + 1} of {programs.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentIndex((i) => Math.min(programs.length - 1, i + 1))}
          disabled={currentIndex === programs.length - 1}
        >
          Next
        </Button>
      </div>

      <Card className="mt-3">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/programs/${current.slug}`}
              className="text-lg font-semibold text-neutral-900 hover:text-brand-600 hover:underline"
            >
              {current.name}
            </Link>
            <button
              onClick={() => {
                onRemove(current.id);
                setCurrentIndex((i) => Math.min(i, programs.length - 2));
              }}
              className="text-xs text-neutral-400 hover:text-neutral-600"
              aria-label={`Remove ${current.name} from comparison`}
            >
              Remove
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Badge color="gray">
                {TYPE_LABELS[current.primaryType] ?? current.primaryType}
              </Badge>
              {current.languages.map((l) => (
                <Badge key={l.language} color="blue" className="ml-1">
                  {l.language}
                </Badge>
              ))}
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Address</dt>
                <dd className="text-right text-neutral-700">
                  {current.address ?? <span className="italic text-neutral-400">--</span>}
                </dd>
              </div>
              {matchTier && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Match Tier</dt>
                  <dd className="text-neutral-700">{matchTier}</dd>
                </div>
              )}
              {distance && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Distance</dt>
                  <dd className="text-neutral-700">{distance}</dd>
                </div>
              )}
              {ageRange && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Ages</dt>
                  <dd className="text-neutral-700">{ageRange}</dd>
                </div>
              )}
              {cost && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Cost</dt>
                  <dd className="text-neutral-700">{cost}</dd>
                </div>
              )}
              {current.schedules.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Schedule</dt>
                  <dd className="text-right text-neutral-700">
                    {current.schedules.map((s) => s.scheduleType.replace(/-/g, " ")).join(", ")}
                  </dd>
                </div>
              )}
              {current.tags.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Philosophy</dt>
                  <dd className="text-right text-neutral-700">
                    {current.tags.map((t) => t.tag).join(", ")}
                  </dd>
                </div>
              )}
              {metrics?.attendanceAreaName && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Attendance Area</dt>
                  <dd className="text-right text-neutral-700">{metrics.attendanceAreaName}</dd>
                </div>
              )}
              {kpath && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">K-Path</dt>
                  <dd className="text-right text-neutral-700">{kpath}</dd>
                </div>
              )}
              {metrics?.deadlineSummary && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Deadlines</dt>
                  <dd className="text-right text-neutral-700">{metrics.deadlineSummary}</dd>
                </div>
              )}
              {current.pottyTrainingRequired != null && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Potty Training</dt>
                  <dd className="text-neutral-700">
                    {current.pottyTrainingRequired ? "Required" : "Not required"}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
