import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { geocodeAndDiscard } from "@/lib/geo/geocode";
import {
  intakeStep1Schema,
  intakeStep2Schema,
  intakeStep3Schema,
  intakeStep4Schema,
} from "@/lib/validation/intake";
import type { FamilyPreferences } from "@/types/domain";

const intakeCompletionSchema = z.object({
  step1: intakeStep1Schema,
  step2: intakeStep2Schema,
  step3: intakeStep3Schema,
  step4: intakeStep4Schema,
});

function computeChildAgeMonths(childDob: string | null): number | null {
  if (!childDob) return null;

  const dob = new Date(`${childDob}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let months =
    (now.getUTCFullYear() - dob.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - dob.getUTCMonth());

  if (now.getUTCDate() < dob.getUTCDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = intakeCompletionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid intake payload",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const intake = parsed.data;
    const geocode = await geocodeAndDiscard(intake.step2.homeAddress);

    const childAgeMonths = computeChildAgeMonths(intake.step1.childDob);
    const preferences: FamilyPreferences = {
      philosophy: intake.step4.philosophy,
      languages: intake.step4.languages,
      mustHaves: intake.step4.mustHaves,
      niceToHaves: intake.step4.niceToHaves,
    };

    const familyDraft = {
      childAgeMonths,
      childExpectedDueDate: intake.step1.childExpectedDueDate,
      pottyTrained: intake.step1.pottyTrained,
      hasSpecialNeeds: intake.step1.hasSpecialNeeds,
      hasMultiples: intake.step1.hasMultiples,
      numChildren: intake.step1.numChildren,
      budgetMonthlyMax: intake.step3.budgetMonthlyMax,
      subsidyInterested: intake.step3.subsidyInterested,
      scheduleDaysNeeded: intake.step3.scheduleDaysNeeded,
      scheduleHoursNeeded: intake.step3.scheduleHoursNeeded,
      homeAttendanceAreaId: geocode.attendanceAreaId,
      homeCoordinatesFuzzed: geocode.fuzzedCoordinates,
      preferences,
    };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let familyId: string | null = null;
    if (user) {
      const { data: upsertedFamily, error } = await supabase
        .from("families")
        .upsert(
          {
            user_id: user.id,
            child_age_months: childAgeMonths,
            child_expected_due_date: intake.step1.childExpectedDueDate,
            has_special_needs: intake.step1.hasSpecialNeeds,
            has_multiples: intake.step1.hasMultiples,
            num_children: intake.step1.numChildren,
            potty_trained: intake.step1.pottyTrained,
            home_attendance_area_id: geocode.attendanceAreaId,
            home_coordinates_fuzzed: `SRID=4326;POINT(${geocode.fuzzedCoordinates.lng} ${geocode.fuzzedCoordinates.lat})`,
            budget_monthly_max: intake.step3.budgetMonthlyMax,
            subsidy_interested: intake.step3.subsidyInterested,
            schedule_days_needed: intake.step3.scheduleDaysNeeded,
            schedule_hours_needed: intake.step3.scheduleHoursNeeded,
            preferences,
          },
          { onConflict: "user_id" }
        )
        .select("id")
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to persist family profile" },
          { status: 500 }
        );
      }

      familyId = upsertedFamily?.id ?? null;
    }

    return NextResponse.json({
      familyId,
      geocode,
      familyDraft,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to complete intake at this time" },
      { status: 500 }
    );
  }
}
