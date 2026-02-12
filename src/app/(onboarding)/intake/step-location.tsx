"use client";

import { useMemo, useState } from "react";
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
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    fuzzedCoordinates: { lng: number; lat: number };
    attendanceAreaName: string | null;
  } | null>(null);

  const mapPreviewUrl = useMemo(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !preview) return null;

    const { lng, lat } = preview.fuzzedCoordinates;
    return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+2563eb(${lng},${lat})/${lng},${lat},13,0/640x240?access_token=${token}`;
  }, [preview]);

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

  async function handlePreviewArea() {
    if (isPreviewing) return;
    setPreviewError(null);
    setIsPreviewing(true);

    try {
      const response = await fetch("/api/intake/geocode-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ homeAddress: data.homeAddress }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to preview this location");
      }

      const payload = (await response.json()) as {
        fuzzedCoordinates: { lng: number; lat: number };
        attendanceAreaName: string | null;
      };

      setPreview({
        fuzzedCoordinates: payload.fuzzedCoordinates,
        attendanceAreaName: payload.attendanceAreaName,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to preview this location";
      setPreviewError(message);
    } finally {
      setIsPreviewing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-neutral-900">
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
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 focus:outline-none"
        />
        {errors.homeAddress && (
          <p className="text-sm text-error-500">{errors.homeAddress}</p>
        )}
        <p className="text-xs text-neutral-400">
          Your address will be geocoded and then immediately discarded. Only
          approximate coordinates (~200m accuracy) are stored.
        </p>
        <div className="pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePreviewArea}
            disabled={isPreviewing || data.homeAddress.trim().length < 5}
          >
            {isPreviewing ? "Checking area..." : "Preview attendance area"}
          </Button>
        </div>

        {previewError && (
          <p className="text-sm text-error-500" role="alert">
            {previewError}
          </p>
        )}

        {preview && (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {mapPreviewUrl ? (
              <img
                src={mapPreviewUrl}
                alt="Approximate home location map preview"
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="h-40 w-full bg-neutral-100" />
            )}
            <div className="p-3">
              <p className="text-sm font-medium text-neutral-800">
                Attendance area: {preview.attendanceAreaName ?? "Not found"}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Based on an approximate point near your address.
              </p>
            </div>
          </div>
        )}
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
