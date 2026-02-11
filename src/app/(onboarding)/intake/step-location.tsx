"use client";

import { useState } from "react";
import { intakeStep2Schema } from "@/lib/validation/intake";
import type { IntakeStep2 } from "@/types/api";
import { Button } from "@/components/ui/button";

interface StepLocationProps {
  data: IntakeStep2;
  onUpdate: (values: Partial<IntakeStep2>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepLocation({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepLocationProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = intakeStep2Schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() ?? "homeAddress";
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
        <h2 className="text-xl font-semibold text-neutral-900">
          Where do you live?
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Your address is used to find nearby programs and determine your SFUSD
          attendance area. We never store your exact address.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="homeAddress"
          className="block text-sm font-medium text-neutral-700"
        >
          Home address
        </label>
        <input
          id="homeAddress"
          type="text"
          placeholder="123 Main St, San Francisco, CA"
          value={data.homeAddress}
          onChange={(e) => onUpdate({ homeAddress: e.target.value })}
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
        />
        {errors.homeAddress && (
          <p className="text-sm text-error-500">{errors.homeAddress}</p>
        )}
        <p className="text-xs text-neutral-400">
          Your address will be geocoded and then immediately discarded. Only
          approximate coordinates (~200m accuracy) are stored.
        </p>
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
