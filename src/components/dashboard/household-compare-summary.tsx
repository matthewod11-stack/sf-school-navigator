"use client";

import Link from "next/link";
import { useCompare } from "@/components/compare/compare-context";
import { Button } from "@/components/ui/button";

interface CompareCandidate {
  id: string;
  name: string;
  slug: string;
}

interface HouseholdCompareSummaryProps {
  candidates: CompareCandidate[];
}

export function HouseholdCompareSummary({ candidates }: HouseholdCompareSummaryProps) {
  const { programs, add, has } = useCompare();
  const available = candidates.filter((candidate) => !has(candidate.id)).slice(0, 4);

  function addActiveContenders() {
    const slots = Math.max(0, 4 - programs.length);
    for (const candidate of available.slice(0, slots)) {
      add(candidate);
    }
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-neutral-900">
            Compare Shortlist
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Local compare list for this browser. Nothing here is shared or persisted.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={addActiveContenders}
            disabled={available.length === 0 || programs.length >= 4}
          >
            Add active
          </Button>
          <Link href="/compare">
            <Button type="button" size="sm">
              Open compare
            </Button>
          </Link>
        </div>
      </div>

      <p className="mt-3 text-sm text-neutral-700">
        {programs.length === 0
          ? "No programs selected for compare yet."
          : `${programs.length} program${programs.length === 1 ? "" : "s"} currently selected.`}
      </p>
      {programs.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-600">
          {programs.map((program) => (
            <li key={program.id} className="rounded bg-neutral-100 px-2 py-1">
              {program.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
