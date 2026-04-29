import { NextResponse } from "next/server";
import { z } from "zod";
import { getProgramsByIds } from "@/lib/db/queries/programs";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/date-only";
import { scoreProgram } from "@/lib/scoring";
import type { ChildProfile, Family, GradeLevel, MatchTier } from "@/types/domain";

const requestSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(4),
  context: z
    .object({
      familyId: z.string().uuid().nullable().optional(),
      homeCoordinates: z
        .object({
          lng: z.number(),
          lat: z.number(),
        })
        .nullable()
        .optional(),
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
          homeCoordinatesFuzzed: z
            .object({
              lng: z.number(),
              lat: z.number(),
            })
            .nullable(),
          preferences: z.object({
            philosophy: z.array(z.string()),
            languages: z.array(z.string()),
            mustHaves: z.array(z.string()),
            niceToHaves: z.array(z.string()),
          }),
        })
        .nullable()
        .optional(),
    })
    .optional(),
});

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function normalizeGradeTarget(value: unknown): GradeLevel {
  return ["prek", "tk", "k", "1", "2", "3", "4", "5"].includes(String(value))
    ? (value as GradeLevel)
    : "prek";
}

function normalizeChildren(value: unknown, fallback: ChildProfile): ChildProfile[] {
  if (!Array.isArray(value)) return [fallback];
  const children = value
    .map((child, index): ChildProfile | null => {
      if (!child || typeof child !== "object") return null;
      const raw = child as Record<string, unknown>;
      return {
        id: typeof raw.id === "string" ? raw.id : `child-${index + 1}`,
        label: typeof raw.label === "string" && raw.label.trim() ? raw.label : `Child ${index + 1}`,
        ageMonths: numberOrNull(raw.ageMonths),
        expectedDueDate: typeof raw.expectedDueDate === "string" ? raw.expectedDueDate : null,
        pottyTrained: typeof raw.pottyTrained === "boolean" ? raw.pottyTrained : null,
        gradeTarget: normalizeGradeTarget(raw.gradeTarget),
      };
    })
    .filter((child): child is ChildProfile => child !== null);
  return children.length > 0 ? children : [fallback];
}

function toPoint(geometry: unknown): { lng: number; lat: number } | null {
  if (!geometry || typeof geometry !== "object") return null;
  const g = geometry as { type?: string; coordinates?: unknown };
  if (g.type !== "Point" || !Array.isArray(g.coordinates) || g.coordinates.length < 2) {
    return null;
  }
  const [lng, lat] = g.coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  return { lng, lat };
}

function haversineDistanceKm(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function normalizeFamilyFromDraft(
  draft: NonNullable<NonNullable<z.infer<typeof requestSchema>["context"]>["familyDraft"]>
): Family {
  const fallbackChild: ChildProfile = {
    id: "local-child",
    label: "Child 1",
    ageMonths: draft.childAgeMonths,
    expectedDueDate: draft.childExpectedDueDate,
    pottyTrained: draft.pottyTrained,
    gradeTarget: draft.gradeTarget ?? "prek",
  };

  return {
    id: "local-family",
    userId: "local-user",
    childAgeMonths: draft.childAgeMonths,
    childExpectedDueDate: draft.childExpectedDueDate,
    children: [fallbackChild],
    hasSpecialNeeds: draft.hasSpecialNeeds,
    hasMultiples: draft.hasMultiples,
    numChildren: draft.numChildren,
    pottyTrained: draft.pottyTrained,
    homeAttendanceAreaId: draft.homeAttendanceAreaId,
    homeCoordinatesFuzzed: draft.homeCoordinatesFuzzed,
    budgetMonthlyMax: draft.budgetMonthlyMax,
    subsidyInterested: draft.subsidyInterested,
    scheduleDaysNeeded: draft.scheduleDaysNeeded,
    scheduleHoursNeeded: draft.scheduleHoursNeeded,
    transportMode: "car",
    preferences: draft.preferences,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeFamilyFromRow(row: Record<string, unknown>): Family {
  const fallbackChild: ChildProfile = {
    id: "db-child",
    label: "Child 1",
    ageMonths: numberOrNull(row.child_age_months),
    expectedDueDate:
      typeof row.child_expected_due_date === "string" ? row.child_expected_due_date : null,
    pottyTrained: typeof row.potty_trained === "boolean" ? row.potty_trained : null,
    gradeTarget: "prek",
  };

  return {
    id: (row.id as string) ?? "db-family",
    userId: (row.user_id as string) ?? "db-user",
    childAgeMonths: numberOrNull(row.child_age_months),
    childExpectedDueDate:
      typeof row.child_expected_due_date === "string" ? row.child_expected_due_date : null,
    children: normalizeChildren(row.children, fallbackChild),
    hasSpecialNeeds:
      typeof row.has_special_needs === "boolean" ? row.has_special_needs : null,
    hasMultiples: Boolean(row.has_multiples),
    numChildren: numberOrNull(row.num_children) ?? 1,
    pottyTrained: typeof row.potty_trained === "boolean" ? row.potty_trained : null,
    homeAttendanceAreaId:
      typeof row.home_attendance_area_id === "string" ? row.home_attendance_area_id : null,
    homeCoordinatesFuzzed: toPoint(row.home_coordinates_fuzzed),
    budgetMonthlyMax: numberOrNull(row.budget_monthly_max),
    subsidyInterested: Boolean(row.subsidy_interested),
    scheduleDaysNeeded: numberOrNull(row.schedule_days_needed),
    scheduleHoursNeeded: numberOrNull(row.schedule_hours_needed),
    transportMode: "car",
    preferences: {
      philosophy: Array.isArray((row.preferences as { philosophy?: unknown })?.philosophy)
        ? ((row.preferences as { philosophy: string[] }).philosophy ?? [])
        : [],
      languages: Array.isArray((row.preferences as { languages?: unknown })?.languages)
        ? ((row.preferences as { languages: string[] }).languages ?? [])
        : [],
      mustHaves: Array.isArray((row.preferences as { mustHaves?: unknown })?.mustHaves)
        ? ((row.preferences as { mustHaves: string[] }).mustHaves ?? [])
        : [],
      niceToHaves: Array.isArray((row.preferences as { niceToHaves?: unknown })?.niceToHaves)
        ? ((row.preferences as { niceToHaves: string[] }).niceToHaves ?? [])
        : [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function formatDate(date: string): string {
  return formatDateOnly(date, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDeadlineSummary(deadlines: Array<{ deadlineType: string; date: string | null; genericDeadlineEstimate: string | null }>): string | null {
  if (deadlines.length === 0) return null;
  const dated = deadlines
    .filter((d) => d.date)
    .toSorted((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
  if (dated.length > 0) {
    const first = dated[0];
    return `${first.deadlineType.replace(/-/g, " ")}: ${formatDate(first.date!)}`;
  }
  const estimated = deadlines.find((d) => d.genericDeadlineEstimate);
  if (!estimated) return null;
  return estimated.genericDeadlineEstimate;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request: provide 1-4 program UUIDs" },
        { status: 400 }
      );
    }

    const programs = await getProgramsByIds(parsed.data.ids);
    const supabase = await createClient();

    let family: Family | null = null;
    if (parsed.data.context?.familyDraft) {
      family = normalizeFamilyFromDraft(parsed.data.context.familyDraft);
    } else if (parsed.data.context?.familyId) {
      const { data: familyRow } = await supabase
        .from("families")
        .select(`
          id,
          user_id,
          child_age_months,
          child_expected_due_date,
          has_special_needs,
          has_multiples,
          num_children,
          potty_trained,
          home_attendance_area_id,
          home_coordinates_fuzzed,
          children,
          budget_monthly_max,
          subsidy_interested,
          schedule_days_needed,
          schedule_hours_needed,
          preferences
        `)
        .eq("id", parsed.data.context.familyId)
        .single();

      if (familyRow) {
        family = normalizeFamilyFromRow(familyRow as Record<string, unknown>);
      }
    }

    const homeCoordinates =
      parsed.data.context?.homeCoordinates ?? family?.homeCoordinatesFuzzed ?? null;

    const areaIds = [
      ...new Set(
        programs
          .map((p) => p.sfusdLinkage?.attendanceAreaId)
          .filter((id): id is string => Boolean(id))
      ),
    ];
    const areaNameById = new Map<string, string>();
    if (areaIds.length > 0) {
      const { data: areas } = await supabase
        .from("attendance_areas")
        .select("id, name")
        .in("id", areaIds);
      for (const area of areas ?? []) {
        areaNameById.set(area.id as string, area.name as string);
      }
    }

    const compareData = Object.fromEntries(
      programs.map((program) => {
        const match = family ? scoreProgram(program, family) : null;
        const distanceKm =
          homeCoordinates && program.coordinates
            ? haversineDistanceKm(homeCoordinates, program.coordinates)
            : null;
        const attendanceAreaName =
          program.sfusdLinkage?.attendanceAreaId
            ? areaNameById.get(program.sfusdLinkage.attendanceAreaId) ?? null
            : null;

        return [
          program.id,
          {
            matchTier: (match?.tier as MatchTier | null) ?? null,
            matchScore: match?.score ?? null,
            distanceKm,
            attendanceAreaName,
            deadlineSummary: getDeadlineSummary(program.deadlines),
          },
        ];
      })
    );

    return NextResponse.json({ programs, compareData });
  } catch {
    return NextResponse.json(
      { error: "Failed to load programs for comparison" },
      { status: 500 }
    );
  }
}
