"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProgramWithDetails } from "@/types/domain";

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
  onRemove: (programId: string) => void;
}

export function MobileCompareCards({ programs, onRemove }: MobileCompareCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = programs[currentIndex];
  if (!current) return null;

  const ageRange = formatAgeRange(current.ageMinMonths, current.ageMaxMonths);
  const cost = formatCost(current);

  return (
    <div>
      {/* Navigation dots */}
      <div className="mb-4 flex items-center justify-center gap-2">
        {programs.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setCurrentIndex(i)}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              i === currentIndex ? "bg-brand-600" : "bg-neutral-300"
            }`}
            aria-label={`View ${p.name}`}
          />
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
