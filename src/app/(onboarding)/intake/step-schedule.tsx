"use client";

import { useState } from "react";
import { intakeStep3Schema } from "@/lib/validation/intake";
import type { IntakeStep3 } from "@/types/api";
import { Button } from "@/components/ui/button";
import { EducationCallout } from "@/components/education/education-callout";
import { INTAKE_EDUCATION } from "@/lib/content/education";
import {
  COST_ESTIMATE_BAND_HELP,
  COST_ESTIMATE_BAND_LABELS,
} from "@/lib/cost/estimate";
import type { CostEstimateBand } from "@/types/domain";

interface StepScheduleProps {
  data: IntakeStep3;
  onUpdate: (values: Partial<IntakeStep3>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepSchedule({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepScheduleProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const showSubsidyQuestion =
    data.budgetMonthlyMax === null || data.budgetMonthlyMax <= 3000;
  const costBandOptions: CostEstimateBand[] = [
    "unknown",
    "sticker-only",
    "elfa-free-0-110-ami",
    "elfa-full-credit-111-150-ami",
    "elfa-half-credit-151-200-ami",
    "not-eligible-over-200-ami",
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = intakeStep3Schema.safeParse(data);
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
          Schedule &amp; Budget
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Help us find programs that fit your schedule and budget. All fields are
          optional.
        </p>
      </div>

      <EducationCallout content={INTAKE_EDUCATION.schedule} />

      {/* Budget */}
      <div className="space-y-2">
        <label
          htmlFor="budget"
          className="block text-sm font-medium text-neutral-700"
        >
          Monthly budget (max)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
            $
          </span>
          <input
            id="budget"
            type="number"
            min={0}
            step={100}
            placeholder="e.g. 2000"
            value={data.budgetMonthlyMax ?? ""}
            onChange={(e) =>
              {
                const nextBudget = e.target.value
                  ? Number(e.target.value)
                  : null;
                onUpdate({
                  budgetMonthlyMax: nextBudget,
                  subsidyInterested:
                    nextBudget !== null && nextBudget > 3000
                      ? false
                      : data.subsidyInterested,
                });
              }
            }
            className="block w-full rounded-md border border-neutral-300 py-2 pl-7 pr-3 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
          />
        </div>
        {errors.budgetMonthlyMax && (
          <p className="text-sm text-error-500">{errors.budgetMonthlyMax}</p>
        )}
      </div>

      {/* Subsidy interest */}
      {showSubsidyQuestion ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.subsidyInterested}
            onChange={(e) => onUpdate({ subsidyInterested: e.target.checked })}
            className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-700"
          />
          <span className="text-neutral-700">
            I&apos;m interested in subsidy programs (e.g. SF Baby C, state subsidies)
          </span>
        </label>
      ) : (
        <p className="text-sm text-neutral-500">
          Subsidy question skipped for budgets above $3,000/month.
        </p>
      )}

      {/* Cost estimate band */}
      <div className="space-y-2">
        <label
          htmlFor="costEstimateBand"
          className="block text-sm font-medium text-neutral-700"
        >
          Cost estimate preference
        </label>
        <select
          id="costEstimateBand"
          value={data.costEstimateBand}
          onChange={(e) =>
            onUpdate({ costEstimateBand: e.target.value as CostEstimateBand })
          }
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
        >
          {costBandOptions.map((band) => (
            <option key={band} value={band}>
              {COST_ESTIMATE_BAND_LABELS[band]}
            </option>
          ))}
        </select>
        <p className="text-xs leading-relaxed text-neutral-500">
          {COST_ESTIMATE_BAND_HELP[data.costEstimateBand]}
        </p>
      </div>

      {/* Days per week */}
      <div className="space-y-2">
        <label
          htmlFor="days"
          className="block text-sm font-medium text-neutral-700"
        >
          Days per week needed
        </label>
        <select
          id="days"
          value={data.scheduleDaysNeeded ?? ""}
          onChange={(e) =>
            onUpdate({
              scheduleDaysNeeded: e.target.value
                ? Number(e.target.value)
                : null,
            })
          }
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
        >
          <option value="">No preference</option>
          {[2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} days
            </option>
          ))}
        </select>
      </div>

      {/* Hours per day */}
      <div className="space-y-2">
        <label
          htmlFor="hours"
          className="block text-sm font-medium text-neutral-700"
        >
          Hours per day needed
        </label>
        <select
          id="hours"
          value={data.scheduleHoursNeeded ?? ""}
          onChange={(e) =>
            onUpdate({
              scheduleHoursNeeded: e.target.value
                ? Number(e.target.value)
                : null,
            })
          }
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
        >
          <option value="">No preference</option>
          <option value={4}>Half day (~4 hours)</option>
          <option value={6}>School day (~6 hours)</option>
          <option value={8}>Full day (~8 hours)</option>
          <option value={10}>Extended day (~10 hours)</option>
        </select>
      </div>

      {/* Desired start date */}
      <div className="space-y-2">
        <label
          htmlFor="startDate"
          className="block text-sm font-medium text-neutral-700"
        >
          Desired start date
        </label>
        <input
          id="startDate"
          type="date"
          value={data.startDate ?? ""}
          onChange={(e) =>
            onUpdate({ startDate: e.target.value || null })
          }
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
