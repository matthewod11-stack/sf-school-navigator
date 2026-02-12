"use client";

import { useState } from "react";
import { intakeStep4Schema } from "@/lib/validation/intake";
import type { IntakeStep4 } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  PROGRAM_PHILOSOPHIES,
  PROGRAM_LANGUAGES,
} from "@/lib/config/cities/sf";

const MUST_HAVE_OPTIONS = [
  "Outdoor space",
  "Meals included",
  "Nap/rest time",
  "Potty training support",
  "Infant care (under 2)",
  "Extended hours (before/after care)",
  "Summer program",
  "Sliding scale / financial aid",
];

interface StepPreferencesProps {
  data: IntakeStep4;
  onUpdate: (values: Partial<IntakeStep4>) => void;
  onNext: () => void;
  onBack: () => void;
}

function ToggleChips({
  options,
  selected,
  onChange,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() =>
              onChange(
                active
                  ? selected.filter((s) => s !== opt)
                  : [...selected, opt]
              )
            }
            aria-pressed={active}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              active
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function StepPreferences({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepPreferencesProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = intakeStep4Schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() ?? "_root";
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-neutral-900">
          Your preferences
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Select any that apply. These help us rank your matches.
        </p>
      </div>

      {/* Philosophy */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-neutral-700">
          Program philosophy
        </legend>
        <ToggleChips
          options={PROGRAM_PHILOSOPHIES}
          selected={data.philosophy}
          onChange={(philosophy) => onUpdate({ philosophy })}
        />
        {errors.philosophy && (
          <p className="text-sm text-error-500">{errors.philosophy}</p>
        )}
      </fieldset>

      {/* Languages */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-neutral-700">
          Preferred languages
        </legend>
        <ToggleChips
          options={PROGRAM_LANGUAGES}
          selected={data.languages}
          onChange={(languages) => onUpdate({ languages })}
        />
      </fieldset>

      {/* Must-haves */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-neutral-700">
          Must-haves
        </legend>
        <ToggleChips
          options={MUST_HAVE_OPTIONS}
          selected={data.mustHaves}
          onChange={(mustHaves) => onUpdate({ mustHaves })}
        />
      </fieldset>

      {/* Nice-to-haves */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-neutral-700">
          Nice-to-haves
        </legend>
        <ToggleChips
          options={MUST_HAVE_OPTIONS}
          selected={data.niceToHaves}
          onChange={(niceToHaves) => onUpdate({ niceToHaves })}
        />
        <p className="text-xs text-neutral-400">
          Nice-to-haves boost a program&apos;s match score but don&apos;t filter
          it out.
        </p>
      </fieldset>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onNext}>
            Skip for now
          </Button>
          <Button type="submit">Review</Button>
        </div>
      </div>
    </form>
  );
}
