import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { FamilyPreferences } from "@/types/domain";

const coordinateSchema = z.object({
  lng: z.number(),
  lat: z.number(),
});

const migrateIntakeSchema = z.object({
  attendanceAreaId: z.string().uuid().nullable().optional(),
  homeCoordinates: coordinateSchema.nullable().optional(),
  familyDraft: z
    .object({
      childAgeMonths: z.number().int().nullable(),
      childExpectedDueDate: z.string().nullable(),
      gradeTarget: z.enum(["prek", "tk", "k", "1", "2", "3", "4", "5"]).optional(),
      pottyTrained: z.boolean().nullable(),
      hasSpecialNeeds: z.boolean().nullable(),
      hasMultiples: z.boolean(),
      numChildren: z.number().int(),
      budgetMonthlyMax: z.number().nullable(),
      subsidyInterested: z.boolean(),
      scheduleDaysNeeded: z.number().int().nullable(),
      scheduleHoursNeeded: z.number().nullable(),
      homeAttendanceAreaId: z.string().uuid().nullable(),
      homeCoordinatesFuzzed: coordinateSchema.nullable(),
      preferences: z.object({
        philosophy: z.array(z.string()),
        languages: z.array(z.string()),
        mustHaves: z.array(z.string()),
        niceToHaves: z.array(z.string()),
      }),
      children: z.array(z.unknown()).optional(),
    })
    .nullable()
    .optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = migrateIntakeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid migration payload" },
        { status: 400 }
      );
    }

    const draft = parsed.data.familyDraft;
    if (!draft) {
      return NextResponse.json({ familyId: null, migrated: false });
    }

    const homeAreaId = draft.homeAttendanceAreaId ?? parsed.data.attendanceAreaId ?? null;
    const homeCoordinates = draft.homeCoordinatesFuzzed ?? parsed.data.homeCoordinates ?? null;
    const preferences: FamilyPreferences = draft.preferences;
    const childProfile = {
      id: crypto.randomUUID(),
      label: "Child 1",
      ageMonths: draft.childAgeMonths,
      expectedDueDate: draft.childExpectedDueDate,
      pottyTrained: draft.pottyTrained,
      gradeTarget: draft.gradeTarget ?? "prek",
    };

    const { data, error } = await supabase
      .from("families")
      .upsert(
        {
          user_id: user.id,
          child_age_months: draft.childAgeMonths,
          child_expected_due_date: draft.childExpectedDueDate,
          children: draft.children?.length ? draft.children : [childProfile],
          has_special_needs: draft.hasSpecialNeeds,
          has_multiples: draft.hasMultiples,
          num_children: draft.numChildren,
          potty_trained: draft.pottyTrained,
          home_attendance_area_id: homeAreaId,
          home_coordinates_fuzzed: homeCoordinates
            ? `SRID=4326;POINT(${homeCoordinates.lng} ${homeCoordinates.lat})`
            : null,
          budget_monthly_max: draft.budgetMonthlyMax,
          subsidy_interested: draft.subsidyInterested,
          schedule_days_needed: draft.scheduleDaysNeeded,
          schedule_hours_needed: draft.scheduleHoursNeeded,
          preferences,
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to migrate intake data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ familyId: data.id, migrated: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to migrate intake data" },
      { status: 500 }
    );
  }
}
