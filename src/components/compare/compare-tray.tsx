"use client";

import Link from "next/link";
import { useCompare } from "./compare-context";
import { Button } from "@/components/ui/button";

export function CompareTray() {
  const { programs, remove, clear } = useCompare();

  if (programs.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-neutral-900 bg-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <span className="shrink-0 text-sm font-medium text-neutral-700">
          Compare ({programs.length}/4):
        </span>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {programs.map((p) => (
            <span
              key={p.id}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-parchment px-3 py-1 text-xs text-neutral-700"
            >
              <span className="max-w-[120px] truncate">{p.name}</span>
              <button
                onClick={() => remove(p.id)}
                className="ml-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-400 hover:text-neutral-600"
                aria-label={`Remove ${p.name} from comparison`}
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={clear} aria-label="Clear all programs">
            Clear
          </Button>
          {programs.length >= 2 && (
            <Link href="/compare">
              <Button size="sm" aria-label={`Compare ${programs.length} programs`}>Compare</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
