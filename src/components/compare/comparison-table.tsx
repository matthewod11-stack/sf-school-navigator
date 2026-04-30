"use client";

import Link from "next/link";
import type { ProgramWithDetails } from "@/types/domain";
import type { CompareMetrics } from "./types";
import { formatGradeLevels, PROGRAM_TYPE_LABELS } from "@/lib/program-types";

function formatAgeRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "--";
  function fmt(v: number) {
    if (v < 12) return `${v} mo`;
    if (v % 12 === 0) return `${v / 12} yr`;
    return `${(v / 12).toFixed(1)} yr`;
  }
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

function formatCost(program: ProgramWithDetails): string {
  const costs = [
    ...program.costs.map((c) => c.tuitionMonthlyLow).filter((n): n is number => n != null),
    ...program.schedules.map((s) => s.monthlyCostLow).filter((n): n is number => n != null),
  ];
  const highs = [
    ...program.costs.map((c) => c.tuitionMonthlyHigh).filter((n): n is number => n != null),
    ...program.schedules.map((s) => s.monthlyCostHigh).filter((n): n is number => n != null),
  ];
  if (costs.length === 0 && highs.length === 0) return "--";
  const low = costs.length > 0 ? Math.min(...costs) : null;
  const high = highs.length > 0 ? Math.max(...highs) : low;
  if (low != null && high != null && low !== high) return `$${low.toLocaleString()}-$${high.toLocaleString()}/mo`;
  if (low != null) return `$${low.toLocaleString()}/mo`;
  if (high != null) return `$${high.toLocaleString()}/mo`;
  return "--";
}

function formatSchedule(program: ProgramWithDetails): string {
  if (program.schedules.length === 0) return "--";
  return program.schedules
    .map((s) => s.scheduleType.replace(/-/g, " "))
    .join(", ");
}

function formatLanguages(program: ProgramWithDetails): string {
  if (program.languages.length === 0) return "--";
  return program.languages.map((l) => l.language).join(", ");
}

function formatTags(program: ProgramWithDetails): string {
  if (program.tags.length === 0) return "--";
  return program.tags.map((t) => t.tag).join(", ");
}

function isSfusd(program: ProgramWithDetails): boolean {
  return program.primaryType.startsWith("sfusd-");
}

function formatKpath(program: ProgramWithDetails, compareData: Record<string, CompareMetrics>): string {
  if (!isSfusd(program)) return "N/A";
  const parts: string[] = [];
  if (program.sfusdLinkage?.tiebreakerEligible) {
    parts.push("Tiebreaker eligible");
  }
  if (program.sfusdLinkage?.feederElementarySchool) {
    parts.push(`Feeder: ${program.sfusdLinkage.feederElementarySchool}`);
  }
  const area = compareData[program.id]?.attendanceAreaName;
  if (area && parts.length === 0) {
    parts.push(area);
  }
  return parts.length > 0 ? parts.join("; ") : "SFUSD";
}

interface Row {
  label: string;
  values: string[];
}

function formatMatchTier(tier: CompareMetrics["matchTier"]): string {
  if (!tier || tier === "hidden") return "--";
  return `${tier[0].toUpperCase()}${tier.slice(1)} Match`;
}

function formatDistance(distanceKm: number | null): string {
  if (distanceKm == null) return "--";
  return `${distanceKm.toFixed(1)} km`;
}

function buildRows(
  programs: ProgramWithDetails[],
  compareData: Record<string, CompareMetrics>
): Row[] {
  return [
    {
      label: "Type",
      values: programs.map((p) => PROGRAM_TYPE_LABELS[p.primaryType]),
    },
    {
      label: "Grades",
      values: programs.map((p) => formatGradeLevels(p.gradeLevels) || "--"),
    },
    {
      label: "Address",
      values: programs.map((p) => p.address ?? "--"),
    },
    {
      label: "Match Tier",
      values: programs.map((p) => formatMatchTier(compareData[p.id]?.matchTier ?? null)),
    },
    {
      label: "Distance",
      values: programs.map((p) => formatDistance(compareData[p.id]?.distanceKm ?? null)),
    },
    {
      label: "Ages",
      values: programs.map((p) => formatAgeRange(p.ageMinMonths, p.ageMaxMonths)),
    },
    {
      label: "Estimated Family Cost",
      values: programs.map((p) => compareData[p.id]?.costEstimate.label ?? formatCost(p)),
    },
    {
      label: "Sticker Cost",
      values: programs.map(formatCost),
    },
    {
      label: "Schedule",
      values: programs.map(formatSchedule),
    },
    {
      label: "Languages",
      values: programs.map(formatLanguages),
    },
    {
      label: "Attendance Area",
      values: programs.map((p) => compareData[p.id]?.attendanceAreaName ?? "--"),
    },
    {
      label: "K-Path",
      values: programs.map((p) => formatKpath(p, compareData)),
    },
    {
      label: "Deadlines",
      values: programs.map((p) => compareData[p.id]?.deadlineSummary ?? "--"),
    },
    {
      label: "Philosophy",
      values: programs.map(formatTags),
    },
    {
      label: "Potty Training",
      values: programs.map((p) =>
        p.pottyTrainingRequired == null ? "--" : p.pottyTrainingRequired ? "Required" : "Not required"
      ),
    },
    {
      label: "Subsidies",
      values: programs.map((p) => {
        const accepts = p.costs.some((c) => c.acceptsSubsidies);
        return accepts ? "Yes" : "--";
      }),
    },
    {
      label: "Financial Aid",
      values: programs.map((p) => {
        const available = p.costs.some((c) => c.financialAidAvailable);
        return available ? "Yes" : "--";
      }),
    },
    {
      label: "Extended Care",
      values: programs.map((p) => {
        const has = p.schedules.some((s) => s.extendedCareAvailable);
        return has ? "Yes" : "--";
      }),
    },
    {
      label: "Summer Program",
      values: programs.map((p) => {
        const has = p.schedules.some((s) => s.summerProgram);
        return has ? "Yes" : "--";
      }),
    },
  ];
}

function hasDiff(values: string[]): boolean {
  if (values.length <= 1) return false;
  return values.some((v) => v !== values[0]);
}

interface ComparisonTableProps {
  programs: ProgramWithDetails[];
  compareData: Record<string, CompareMetrics>;
  onRemove: (programId: string) => void;
}

export function ComparisonTable({ programs, compareData, onRemove }: ComparisonTableProps) {
  const rows = buildRows(programs, compareData);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <caption className="sr-only">Side-by-side comparison of selected programs</caption>
        <thead>
          <tr>
            <th className="w-32 p-3 text-left text-xs font-medium uppercase text-neutral-500" />
            {programs.map((p) => (
              <th key={p.id} className="p-3 text-left">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/programs/${p.slug}`}
                    className="font-serif text-sm font-semibold text-neutral-900 hover:text-brand-700 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <button
                    onClick={() => onRemove(p.id)}
                    className="shrink-0 text-xs text-neutral-400 hover:text-neutral-600"
                    aria-label={`Remove ${p.name}`}
                  >
                    x
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isDiff = hasDiff(row.values);
            return (
              <tr
                key={row.label}
                className="border-t border-rule"
              >
                <td className="p-3 text-xs font-medium uppercase text-neutral-500 align-top">
                  {row.label}
                </td>
                {row.values.map((value, i) => (
                  <td
                    key={programs[i].id}
                    className={`p-3 align-top ${
                      isDiff && value !== "--"
                        ? "bg-amber-50"
                        : ""
                    } ${value === "--" ? "text-neutral-400 italic" : "text-neutral-700"}`}
                  >
                    {isDiff && value !== "--" && <span className="sr-only">Values differ. </span>}
                    {value}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
