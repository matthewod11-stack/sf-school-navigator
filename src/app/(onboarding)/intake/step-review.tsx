"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IntakeData } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EducationCallout } from "@/components/education/education-callout";
import { INTAKE_EDUCATION } from "@/lib/content/education";
import { GRADE_LEVEL_LABELS } from "@/lib/program-types";

interface StepReviewProps {
  data: IntakeData;
  onBack: () => void;
  onEdit: (step: number) => void;
}

const INTAKE_STORAGE_KEY = "sf-school-nav-intake";
const SEARCH_CONTEXT_STORAGE_KEY = "sf-school-nav-search-context";

function Section({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-sm font-semibold text-neutral-900">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-xs font-medium text-brand-700 hover:text-brand-800"
        >
          Edit
        </button>
      </div>
      <div className="mt-3 space-y-1 text-sm text-neutral-600">{children}</div>
    </div>
  );
}

function formatDate(d: string | null): string {
  if (!d) return "Not specified";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(n: number | null): string {
  if (n === null) return "No limit";
  return `$${n.toLocaleString()}/mo`;
}

export function StepReview({ data, onBack, onEdit }: StepReviewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit() {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/intake/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Failed to complete intake");
      }

      const payload = (await response.json()) as {
        familyId: string | null;
        activeChildId: string | null;
        geocode: {
          attendanceAreaId: string | null;
          attendanceAreaName: string | null;
          fuzzedCoordinates: { lng: number; lat: number };
        };
        familyDraft: unknown;
      };

      // Persist only sanitized context for search. Do not keep raw address.
      const sanitizedIntake: IntakeData = {
        ...data,
        step2: { homeAddress: "" },
      };
      localStorage.setItem(
        INTAKE_STORAGE_KEY,
        JSON.stringify({
          currentStep: 5,
          data: sanitizedIntake,
        })
      );

      localStorage.setItem(
        SEARCH_CONTEXT_STORAGE_KEY,
        JSON.stringify({
          familyId: payload.familyId,
          activeChildId: payload.activeChildId,
          attendanceAreaId: payload.geocode.attendanceAreaId,
          attendanceAreaName: payload.geocode.attendanceAreaName,
          homeCoordinates: payload.geocode.fuzzedCoordinates,
          familyDraft: payload.familyDraft,
        })
      );

      const params = new URLSearchParams();
      if (payload.familyId) params.set("familyId", payload.familyId);
      router.push(params.size ? `/search?${params.toString()}` : "/search");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete intake right now";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-neutral-900">
          Review your information
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Make sure everything looks right before we find your matches.
        </p>
      </div>

      <EducationCallout content={INTAKE_EDUCATION.review} />

      <div className="space-y-4">
        {/* Step 1 — Child */}
        <Section title="Child Information" step={1} onEdit={onEdit}>
          <p>
            {data.step1.childDob
              ? `Date of birth: ${formatDate(data.step1.childDob)}`
              : `Expected due date: ${formatDate(data.step1.childExpectedDueDate)}`}
          </p>
          <p>Target grade: {GRADE_LEVEL_LABELS[data.step1.gradeTarget]}</p>
          <p>
            Potty trained:{" "}
            {data.step1.pottyTrained === null
              ? "Not sure"
              : data.step1.pottyTrained
                ? "Yes"
                : "No"}
          </p>
          <p>Enrolling {data.step1.numChildren} child{data.step1.numChildren > 1 ? "ren" : ""}</p>
        </Section>

        {/* Step 2 — Location */}
        <Section title="Location" step={2} onEdit={onEdit}>
          <p>{data.step2.homeAddress || "No address provided"}</p>
        </Section>

        {/* Step 3 — Schedule & Budget */}
        <Section title="Schedule & Budget" step={3} onEdit={onEdit}>
          <p>Budget: {formatCurrency(data.step3.budgetMonthlyMax)}</p>
          {data.step3.subsidyInterested && <p>Interested in subsidies</p>}
          <p>
            Schedule:{" "}
            {data.step3.scheduleDaysNeeded
              ? `${data.step3.scheduleDaysNeeded} days/week`
              : "Flexible"}{" "}
            {data.step3.scheduleHoursNeeded
              ? `/ ${data.step3.scheduleHoursNeeded}h/day`
              : ""}
          </p>
          {data.step3.startDate && (
            <p>Start date: {formatDate(data.step3.startDate)}</p>
          )}
        </Section>

        {/* Step 4 — Preferences */}
        <Section title="Preferences" step={4} onEdit={onEdit}>
          {data.step4.philosophy.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.step4.philosophy.map((p) => (
                <Badge key={p} color="blue">{p}</Badge>
              ))}
            </div>
          )}
          {data.step4.languages.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {data.step4.languages.map((l) => (
                <Badge key={l} color="green">{l}</Badge>
              ))}
            </div>
          )}
          {data.step4.mustHaves.length > 0 && (
            <div className="mt-2">
              <span className="text-xs font-medium text-neutral-500">Must-haves: </span>
              {data.step4.mustHaves.join(", ")}
            </div>
          )}
          {data.step4.philosophy.length === 0 &&
            data.step4.languages.length === 0 &&
            data.step4.mustHaves.length === 0 && (
              <p className="text-neutral-400">No preferences selected</p>
            )}
        </Section>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Preparing Results..." : "Find My Matches"}
        </Button>
      </div>

      {submitError && (
        <p className="text-sm text-error-500" role="alert">
          {submitError}
        </p>
      )}
    </div>
  );
}
