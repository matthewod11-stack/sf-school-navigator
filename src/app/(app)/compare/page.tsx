"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCompare } from "@/components/compare/compare-context";
import { ComparisonTable } from "@/components/compare/comparison-table";
import { MobileCompareCards } from "@/components/compare/mobile-compare-cards";
import type { CompareMetrics } from "@/components/compare/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ProgramWithDetails } from "@/types/domain";

const SEARCH_CONTEXT_STORAGE_KEY = "sf-school-nav-search-context";

interface SearchContext {
  familyId?: string | null;
  homeCoordinates?: { lng: number; lat: number } | null;
  familyDraft?: unknown;
}

export default function ComparePage() {
  const { programs: compareList, remove, clear } = useCompare();
  const [programs, setPrograms] = useState<ProgramWithDetails[]>([]);
  const [compareData, setCompareData] = useState<Record<string, CompareMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (compareList.length === 0) {
      setPrograms([]);
      setCompareData({});
      setLoading(false);
      return;
    }

    let canceled = false;
    setLoading(true);
    setError(null);

    async function loadPrograms() {
      try {
        let context: SearchContext | null = null;
        try {
          const raw = localStorage.getItem(SEARCH_CONTEXT_STORAGE_KEY);
          if (raw) {
            context = JSON.parse(raw) as SearchContext;
          }
        } catch {
          // Ignore malformed context.
        }

        const response = await fetch("/api/programs/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: compareList.map((p) => p.id),
            context,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to load programs");
        }

        const payload = (await response.json()) as {
          programs: ProgramWithDetails[];
          compareData: Record<string, CompareMetrics>;
        };
        if (!canceled) {
          setPrograms(payload.programs);
          setCompareData(payload.compareData ?? {});
        }
      } catch {
        if (!canceled) {
          setError("Unable to load programs for comparison");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    void loadPrograms();
    return () => { canceled = true; };
  }, [compareList]);

  function handleRemove(programId: string) {
    remove(programId);
  }

  if (!loading && compareList.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">Compare Programs</h1>
        <p className="mt-3 text-neutral-500">
          You haven&apos;t selected any programs to compare yet.
        </p>
        <p className="mt-1 text-sm text-neutral-400">
          Add programs from the search results (up to 4), then come back here.
        </p>
        <Link href="/search" className="mt-6 inline-block">
          <Button>Browse Programs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-neutral-900">Compare Programs</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {programs.length} program{programs.length !== 1 ? "s" : ""} selected
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/search">
            <Button variant="secondary" size="sm">
              Add more
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear all
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-8 w-full rounded" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      ) : programs.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="mt-6 hidden md:block">
            <ComparisonTable
              programs={programs}
              compareData={compareData}
              onRemove={handleRemove}
            />
          </div>

          {/* Mobile swipe cards */}
          <div className="mt-6 md:hidden">
            <MobileCompareCards
              programs={programs}
              compareData={compareData}
              onRemove={handleRemove}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
