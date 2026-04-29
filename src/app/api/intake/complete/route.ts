import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { geocodeAndDiscard } from "@/lib/geo/geocode";
import {
  coerceChildProfiles,
  familyChildColumns,
  selectActiveChild,
} from "@/lib/family/child-profiles";
import {
  intakeStep1Schema,
  intakeStep2Schema,
  intakeStep3Schema,
  intakeStep4Schema,
} from "@/lib/validation/intake";
import type { ChildProfile, FamilyPreferences } from "@/types/domain";

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

function makeChildProfile(
  intake: z.infer<typeof intakeCompletionSchema>,
  childAgeMonths: number | null
): ChildProfile {
  return {
    id: crypto.randomUUID(),
    label: intake.step1.childLabel?.trim() || "Child 1",
    ageMonths: childAgeMonths,
    expectedDueDate: intake.step1.childExpectedDueDate,
    pottyTrained: intake.step1.pottyTrained,
    gradeTarget: intake.step1.gradeTarget,
  };
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
    const childProfile = makeChildProfile(intake, childAgeMonths);
    const preferences: FamilyPreferences = {
      philosophy: intake.step4.philosophy,
      languages: intake.step4.languages,
      mustHaves: intake.step4.mustHaves,
      niceToHaves: intake.step4.niceToHaves,
    };

    const familyDraft = {
      childAgeMonths,
      childExpectedDueDate: intake.step1.childExpectedDueDate,
      gradeTarget: intake.step1.gradeTarget,
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
      children: [childProfile],
    };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let familyId: string | null = null;
    if (user) {
      const { data: existingFamily } = await supabase
        .from("families")
        .select("id, child_age_months, child_expected_due_date, potty_trained, children")
        .eq("user_id", user.id)
        .maybeSingle();

      const fallbackChild: ChildProfile = {
        id: "child-1",
        label: "Child 1",
        ageMonths:
          typeof existingFamily?.child_age_months === "number"
            ? existingFamily.child_age_months
            : null,
        expectedDueDate:
          typeof existingFamily?.child_expected_due_date === "string"
            ? existingFamily.child_expected_due_date
            : null,
        pottyTrained:
          typeof existingFamily?.potty_trained === "boolean"
            ? existingFamily.potty_trained
            : null,
        gradeTarget: "prek",
      };
      const existingChildren = existingFamily
        ? coerceChildProfiles(existingFamily.children, fallbackChild)
        : [];
      const children =
        existingChildren.length > 0
          ? selectActiveChild(
              [childProfile, ...existingChildren.slice(1)],
              childProfile.id
            )
          : [childProfile];
      const childColumns = familyChildColumns(children);

      const { data: upsertedFamily, error } = await supabase
        .from("families")
        .upsert(
          {
            user_id: user.id,
            ...childColumns,
            has_special_needs: intake.step1.hasSpecialNeeds,
            has_multiples: intake.step1.hasMultiples || children.length > 1,
            num_children: Math.max(intake.step1.numChildren, children.length),
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
      activeChildId: childProfile.id,
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
