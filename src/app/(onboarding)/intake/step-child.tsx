"use client";

import { useState } from "react";
import { intakeStep1Schema } from "@/lib/validation/intake";
import type { IntakeStep1 } from "@/types/api";
import { Button } from "@/components/ui/button";

interface StepChildProps {
  data: IntakeStep1;
  onUpdate: (values: Partial<IntakeStep1>) => void;
  onNext: () => void;
}

export function StepChild({ data, onUpdate, onNext }: StepChildProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = intakeStep1Schema.safeParse(data);
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
          Tell us about your child
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          This helps us find age-appropriate programs.
        </p>
      </div>

      {errors._root && (
        <p className="text-sm text-error-500">{errors._root}</p>
      )}

      {/* Date of birth */}
      <fieldset className="space-y-3">
        <label htmlFor="childDob" className="block text-sm font-medium text-neutral-700">
          Child&apos;s date of birth
        </label>
        <input
          id="childDob"
          type="date"
          value={data.childDob ?? ""}
          onChange={(e) =>
            onUpdate({
              childDob: e.target.value || null,
              childExpectedDueDate: e.target.value ? null : data.childExpectedDueDate,
            })
          }
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
        />
        <p className="text-xs text-neutral-500">
          Or, if expecting:
        </p>
        <label htmlFor="childExpectedDueDate" className="block text-sm font-medium text-neutral-700">
          Expected due date
        </label>
        <input
          id="childExpectedDueDate"
          type="date"
          value={data.childExpectedDueDate ?? ""}
          onChange={(e) =>
            onUpdate({
              childExpectedDueDate: e.target.value || null,
              childDob: e.target.value ? null : data.childDob,
            })
          }
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
        />
      </fieldset>

      {/* Potty trained */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-700">
          Is your child potty trained?
        </legend>
        <div className="flex gap-4">
          {([
            [true, "Yes"],
            [false, "No"],
            [null, "Not sure yet"],
          ] as const).map(([value, label]) => (
            <label key={String(value)} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="pottyTrained"
                checked={data.pottyTrained === value}
                onChange={() => onUpdate({ pottyTrained: value })}
                className="text-neutral-900 focus:ring-neutral-700"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Special needs */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-700">
          Does your child have special needs or an IEP?
        </legend>
        <div className="flex gap-4">
          {([
            [true, "Yes"],
            [false, "No"],
            [null, "Prefer not to say"],
          ] as const).map(([value, label]) => (
            <label key={String(value)} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="hasSpecialNeeds"
                checked={data.hasSpecialNeeds === value}
                onChange={() => onUpdate({ hasSpecialNeeds: value })}
                className="text-neutral-900 focus:ring-neutral-700"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Number of children */}
      <div className="space-y-2">
        <label htmlFor="numChildren" className="block text-sm font-medium text-neutral-700">
          Number of children enrolling
        </label>
        <select
          id="numChildren"
          value={data.numChildren}
          onChange={(e) => {
            const num = parseInt(e.target.value, 10);
            onUpdate({ numChildren: num, hasMultiples: num > 1 });
          }}
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
