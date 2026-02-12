"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CompareButton } from "@/components/compare/compare-button";
import { AuthModal } from "@/components/auth/auth-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { SaveButton } from "./save-button";

const CORRECTABLE_FIELDS = [
  { value: "name", label: "Program Name" },
  { value: "address", label: "Address" },
  { value: "phone", label: "Phone Number" },
  { value: "website", label: "Website" },
  { value: "hours", label: "Hours / Schedule" },
  { value: "cost", label: "Cost / Tuition" },
  { value: "ages", label: "Ages Served" },
  { value: "languages", label: "Languages" },
  { value: "license", label: "License Info" },
  { value: "potty_training", label: "Potty Training Policy" },
  { value: "deadlines", label: "Application Deadlines" },
  { value: "other", label: "Other" },
] as const;

interface ProfileActionsProps {
  programId: string;
  programSlug: string;
  programName: string;
}

export function ProfileActions({ programId, programSlug, programName }: ProfileActionsProps) {
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmitCorrection(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setShowAuth(true);
      return;
    }
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
      <div className="flex flex-wrap gap-2">
        <SaveButton programId={programId} />
        <CompareButton
          program={{ id: programId, slug: programSlug, name: programName }}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setReportOpen(!reportOpen)}
          aria-expanded={reportOpen}
        >
          {reportOpen ? "Cancel" : "Report an issue"}
        </Button>
      </div>

      {reportOpen && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="font-serif text-sm font-semibold text-neutral-900">
            Suggest a correction for {programName}
          </h3>

          {!user ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-neutral-600">
                Sign in to submit a correction so we can track and review your update.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowAuth(true)}
              >
                Sign in to report
              </Button>
            </div>
          ) : submitted ? (
            <p className="mt-2 text-sm text-green-700" role="status">
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
                <select
                  id="correction-field"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
                >
                  <option value="">Select a field...</option>
                  {CORRECTABLE_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
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
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
                />
              </div>
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                aria-label={!user ? "Submit correction — sign in required" : undefined}
              >
                {submitting ? "Submitting..." : "Submit correction"}
              </Button>
            </form>
          )}
        </div>
      )}
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        defaultMode="login"
      />
    </div>
  );
}
