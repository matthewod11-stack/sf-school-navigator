"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CompareButton } from "@/components/compare/compare-button";

interface ProfileActionsProps {
  programId: string;
  programSlug: string;
  programName: string;
}

export function ProfileActions({ programId, programSlug, programName }: ProfileActionsProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmitCorrection(e: React.FormEvent) {
    e.preventDefault();
    if (!fieldName.trim() || !suggestedValue.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/programs/${programId}/corrections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          fieldName: fieldName.trim(),
          suggestedValue: suggestedValue.trim(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to submit correction");
      }

      setSubmitted(true);
      setFieldName("");
      setSuggestedValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit correction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <CompareButton
          program={{ id: programId, slug: programSlug, name: programName }}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setReportOpen(!reportOpen)}
        >
          {reportOpen ? "Cancel" : "Report an issue"}
        </Button>
      </div>

      {reportOpen && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-neutral-900">
            Suggest a correction for {programName}
          </h3>
          {submitted ? (
            <p className="mt-2 text-sm text-green-700">
              Thank you! Your correction has been submitted for review.
            </p>
          ) : (
            <form onSubmit={handleSubmitCorrection} className="mt-3 space-y-3">
              <div>
                <label
                  htmlFor="correction-field"
                  className="block text-xs font-medium text-neutral-600"
                >
                  What field is incorrect?
                </label>
                <input
                  id="correction-field"
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g., Phone number, Hours, Cost"
                  maxLength={100}
                  required
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="correction-value"
                  className="block text-xs font-medium text-neutral-600"
                >
                  What should it be?
                </label>
                <textarea
                  id="correction-value"
                  value={suggestedValue}
                  onChange={(e) => setSuggestedValue(e.target.value)}
                  placeholder="Enter the correct information"
                  maxLength={2000}
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit correction"}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
