"use client";

import { useState } from "react";
import {
  COST_ESTIMATE_BAND_HELP,
  COST_ESTIMATE_BAND_LABELS,
} from "@/lib/cost/estimate";
import type { CostEstimateBand } from "@/types/domain";

const COST_BANDS: CostEstimateBand[] = [
  "unknown",
  "sticker-only",
  "elfa-free-0-110-ami",
  "elfa-full-credit-111-150-ami",
  "elfa-half-credit-151-200-ami",
  "not-eligible-over-200-ami",
];

interface CostPreferenceControlProps {
  initialBand: CostEstimateBand;
}

export function CostPreferenceControl({ initialBand }: CostPreferenceControlProps) {
  const [band, setBand] = useState(initialBand);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleChange(nextBand: CostEstimateBand) {
    setBand(nextBand);
    setStatus("saving");
    try {
      const response = await fetch("/api/family/cost-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ costEstimateBand: nextBand }),
      });
      if (!response.ok) throw new Error("Failed to save");
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="mt-8 rounded-md border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-neutral-900">
            Cost Planning
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Store only a broad band for estimates. Exact income is never saved.
          </p>
        </div>
        <label className="min-w-[260px] text-sm">
          <span className="sr-only">Cost estimate preference</span>
          <select
            value={band}
            onChange={(event) => handleChange(event.target.value as CostEstimateBand)}
            disabled={status === "saving"}
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
          >
            {COST_BANDS.map((option) => (
              <option key={option} value={option}>
                {COST_ESTIMATE_BAND_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        {COST_ESTIMATE_BAND_HELP[band]}
      </p>
      <p aria-live="polite" className="mt-2 text-xs text-neutral-500">
        {status === "saving"
          ? "Saving..."
          : status === "saved"
            ? "Saved."
            : status === "error"
              ? "Could not save. Try again."
              : ""}
      </p>
    </section>
  );
}
