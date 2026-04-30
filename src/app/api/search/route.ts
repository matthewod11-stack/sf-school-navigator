import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  coerceChildProfiles,
  selectActiveChild,
} from "@/lib/family/child-profiles";
import { scoreProgram } from "@/lib/scoring";
import {
  estimateProgramCostForFamily,
  normalizeCostEstimateBand,
  type ProgramCostEstimate,
} from "@/lib/cost/estimate";
import { isMissingColumnError } from "@/lib/db/schema";
import type {
  ChildProfile,
  Family,
  GradeLevel,
  MatchTier,
  ProgramWithDetails,
  ScheduleType,
} from "@/types/domain";

type GeoPoint = { lng: number; lat: number };
type GeoArea = GeoJSON.Polygon | GeoJSON.MultiPolygon;

const searchContextSchema = z
  .object({
    familyId: z.string().uuid().nullable().optional(),
    activeChildId: z.string().nullable().optional(),
    attendanceAreaId: z.string().uuid().nullable().optional(),
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
        costEstimateBand: z
          .enum([
            "unknown",
            "sticker-only",
            "elfa-free-0-110-ami",
            "elfa-full-credit-111-150-ami",
            "elfa-half-credit-151-200-ami",
            "not-eligible-over-200-ami",
          ])
          .optional(),
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
        children: z.array(z.unknown()).optional(),
      })
      .nullable()
      .optional(),
  })
  .optional();

const searchRequestSchema = z.object({
  context: z.unknown().nullable().optional(),
});

type SearchContextInput = z.infer<typeof searchContextSchema>;
type FamilyDraftInput = NonNullable<NonNullable<SearchContextInput>["familyDraft"]>;

interface SearchProgram {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  primaryType: ProgramWithDetails["primaryType"];
  coordinates: GeoPoint;
  matchTier: MatchTier | null;
  matchScore: number | null;
  ageRange: string | null;
  gradeLevels: GradeLevel[];
  costRange: string | null;
  costEstimate: ProgramCostEstimate;
  hours: string | null;
  languages: string[];
  distanceKm: number | null;
  costLow: number | null;
  scheduleTypes: ScheduleType[];
  lastVerifiedAt: string | null;
  dataCompletenessScore: number;
}

interface AttendanceAreaOverlay {
  id: string;
  name: string;
  geometry: GeoArea;
}

function toPoint(geometry: unknown): GeoPoint | null {
  if (!geometry || typeof geometry !== "object") return null;
  const g = geometry as { type?: string; coordinates?: unknown };
  if (g.type !== "Point" || !Array.isArray(g.coordinates) || g.coordinates.length < 2) {
    return null;
  }
  const [lng, lat] = g.coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  return { lng, lat };
}

function toAreaGeometry(geometry: unknown): GeoArea | null {
  if (!geometry || typeof geometry !== "object") return null;
  const g = geometry as { type?: string; coordinates?: unknown };
  if (!Array.isArray(g.coordinates)) return null;
  if (g.type === "Polygon" || g.type === "MultiPolygon") {
    return g as GeoArea;
  }
  return null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function normalizeGradeLevels(value: unknown): GradeLevel[] {
  const allowed = new Set<GradeLevel>(["prek", "tk", "k", "1", "2", "3", "4", "5"]);
  if (!Array.isArray(value)) return [];
  return value.filter((level): level is GradeLevel => allowed.has(level as GradeLevel));
}

function formatAgeRange(minMonths: number | null, maxMonths: number | null): string | null {
  if (minMonths == null && maxMonths == null) return null;

  function formatMonths(value: number): string {
    if (value < 12) return `${value} mo`;
    if (value % 12 === 0) return `${value / 12} yr`;
    return `${(value / 12).toFixed(1)} yr`;
  }

  if (minMonths != null && maxMonths != null) {
    return `${formatMonths(minMonths)} - ${formatMonths(maxMonths)}`;
  }
  if (minMonths != null) return `${formatMonths(minMonths)}+`;
  return `Up to ${formatMonths(maxMonths!)}`;
}

function formatCostRange(low: number | null, high: number | null): string | null {
  if (low == null && high == null) return null;
  const safeLow = low ?? high ?? 0;
  const safeHigh = high ?? low ?? 0;

  if (safeLow === 0 && safeHigh === 0) return "Free";
  if (safeLow === safeHigh) return `$${safeLow.toLocaleString()}/mo`;
  return `$${safeLow.toLocaleString()}-$${safeHigh.toLocaleString()}/mo`;
}

function formatTime(raw: string | null): string | null {
  if (!raw) return null;
  const [hoursRaw, minutesRaw] = raw.split(":");
  const hoursNum = Number(hoursRaw);
  const minutesNum = Number(minutesRaw);
  if (!Number.isFinite(hoursNum) || !Number.isFinite(minutesNum)) return null;

  const suffix = hoursNum >= 12 ? "pm" : "am";
  const normalizedHour = hoursNum % 12 === 0 ? 12 : hoursNum % 12;
  return `${normalizedHour}:${String(minutesNum).padStart(2, "0")}${suffix}`;
}

function formatHours(openTime: string | null, closeTime: string | null): string | null {
  const start = formatTime(openTime);
  const end = formatTime(closeTime);
  if (!start || !end) return null;
  return `${start}-${end}`;
}

function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
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
  draft: FamilyDraftInput,
  activeChildId?: string | null
): Family {
  const fallbackChild: ChildProfile = {
    id: "local-child",
    label: "Child 1",
    ageMonths: draft.childAgeMonths,
    expectedDueDate: draft.childExpectedDueDate,
    pottyTrained: draft.pottyTrained,
    gradeTarget: draft.gradeTarget ?? "prek",
  };
  const children = selectActiveChild(
    coerceChildProfiles(draft.children, fallbackChild),
    activeChildId
  );
  const activeChild = children[0] ?? fallbackChild;

  return {
    id: "local-family",
    userId: "local-user",
    childAgeMonths: activeChild.ageMonths,
    childExpectedDueDate: activeChild.expectedDueDate,
    children,
    hasSpecialNeeds: draft.hasSpecialNeeds,
    hasMultiples: draft.hasMultiples || children.length > 1,
    numChildren: Math.max(draft.numChildren, children.length),
    pottyTrained: activeChild.pottyTrained,
    homeAttendanceAreaId: draft.homeAttendanceAreaId,
    homeCoordinatesFuzzed: draft.homeCoordinatesFuzzed,
    budgetMonthlyMax: draft.budgetMonthlyMax,
    subsidyInterested: draft.subsidyInterested,
    costEstimateBand: normalizeCostEstimateBand(draft.costEstimateBand),
    scheduleDaysNeeded: draft.scheduleDaysNeeded,
    scheduleHoursNeeded: draft.scheduleHoursNeeded,
    transportMode: "car",
    preferences: draft.preferences,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeFamilyFromRow(
  row: Record<string, unknown>,
  activeChildId?: string | null
): Family {
  const point = toPoint(row.home_coordinates_fuzzed);
  const prefs = (row.preferences ?? {}) as {
    philosophy?: string[];
    languages?: string[];
    mustHaves?: string[];
    niceToHaves?: string[];
  };
  const fallbackChild: ChildProfile = {
    id: "db-child",
    label: "Child 1",
    ageMonths: numberOrNull(row.child_age_months),
    expectedDueDate:
      typeof row.child_expected_due_date === "string"
        ? row.child_expected_due_date
        : null,
    pottyTrained:
      typeof row.potty_trained === "boolean" ? row.potty_trained : null,
    gradeTarget: "prek",
  };
  const children = selectActiveChild(
    coerceChildProfiles(row.children, fallbackChild),
    activeChildId
  );
  const activeChild = children[0] ?? fallbackChild;

  return {
    id: (row.id as string) ?? "db-family",
    userId: (row.user_id as string) ?? "db-user",
    childAgeMonths: activeChild.ageMonths,
    childExpectedDueDate: activeChild.expectedDueDate,
    children,
    hasSpecialNeeds:
      typeof row.has_special_needs === "boolean" ? row.has_special_needs : null,
    hasMultiples: Boolean(row.has_multiples),
    numChildren: Math.max(numberOrNull(row.num_children) ?? 1, children.length),
    pottyTrained: activeChild.pottyTrained,
    homeAttendanceAreaId:
      typeof row.home_attendance_area_id === "string"
        ? row.home_attendance_area_id
        : null,
    homeCoordinatesFuzzed: point,
    budgetMonthlyMax: numberOrNull(row.budget_monthly_max),
    subsidyInterested: Boolean(row.subsidy_interested),
    costEstimateBand: normalizeCostEstimateBand(row.cost_estimate_band),
    scheduleDaysNeeded: numberOrNull(row.schedule_days_needed),
    scheduleHoursNeeded: numberOrNull(row.schedule_hours_needed),
    transportMode: "car",
    preferences: {
      philosophy: Array.isArray(prefs.philosophy) ? prefs.philosophy : [],
      languages: Array.isArray(prefs.languages) ? prefs.languages : [],
      mustHaves: Array.isArray(prefs.mustHaves) ? prefs.mustHaves : [],
      niceToHaves: Array.isArray(prefs.niceToHaves) ? prefs.niceToHaves : [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const SEARCH_PROGRAM_SELECT = `
  id,
  name,
  slug,
  address,
  coordinates,
  primary_type,
  data_source,
  data_completeness_score,
  last_verified_at,
  age_min_months,
  age_max_months,
  grade_levels,
  potty_training_required,
  created_at,
  updated_at,
  program_tags(tag),
  program_languages(language, immersion_type),
  program_schedules(
    schedule_type,
    days_per_week,
    open_time,
    close_time,
    extended_care_available,
    summer_program,
    operates,
    monthly_cost_low,
    monthly_cost_high
  ),
  program_costs(
    school_year,
    tuition_monthly_low,
    tuition_monthly_high,
    accepts_subsidies,
    financial_aid_available,
    elfa_participating,
    elfa_source_url,
    elfa_verified_at
  ),
  program_sfusd_linkage(
    id,
    attendance_area_id,
    school_year,
    feeder_elementary_school,
    tiebreaker_eligible,
    rule_version_id
  )
`;

const SEARCH_PROGRAM_SELECT_WITHOUT_PHASE5_COST = SEARCH_PROGRAM_SELECT.replace(
  /,\n    elfa_participating,\n    elfa_source_url,\n    elfa_verified_at/,
  ""
);

const FAMILY_SELECT = `
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
  cost_estimate_band,
  schedule_days_needed,
  schedule_hours_needed,
  preferences
`;

const FAMILY_SELECT_WITHOUT_PHASE5_COST = FAMILY_SELECT.replace(
  /,\n  cost_estimate_band/,
  ""
);

async function loadSearchPrograms(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const response = await supabase
    .from("programs")
    .select(SEARCH_PROGRAM_SELECT)
    .not("coordinates", "is", null)
    .limit(2000);

  if (isMissingColumnError(response.error)) {
    return await supabase
      .from("programs")
      .select(SEARCH_PROGRAM_SELECT_WITHOUT_PHASE5_COST)
      .not("coordinates", "is", null)
      .limit(2000);
  }

  return response;
}

async function loadFamilyById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  familyId: string
) {
  const response = await supabase
    .from("families")
    .select(FAMILY_SELECT)
    .eq("id", familyId)
    .single();

  if (isMissingColumnError(response.error)) {
    return await supabase
      .from("families")
      .select(FAMILY_SELECT_WITHOUT_PHASE5_COST)
      .eq("id", familyId)
      .single();
  }

  return response;
}

async function resolveAttendanceAreaOverlay(
  supabase: Awaited<ReturnType<typeof createClient>>,
  areaId: string | null
): Promise<AttendanceAreaOverlay | null> {
  if (!areaId) return null;
  const { data, error } = await supabase
    .from("attendance_areas")
    .select("id, name, geometry")
    .eq("id", areaId)
    .single();

  if (error || !data) return null;
  const geometry = toAreaGeometry(data.geometry);
  if (!geometry) return null;

  return {
    id: data.id,
    name: data.name,
    geometry,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = searchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid search payload" }, { status: 400 });
    }

    const contextResult = searchContextSchema
      .nullable()
      .safeParse(parsed.data.context ?? null);
    const context = contextResult.success ? contextResult.data : null;
    const supabase = await createClient();

    const { data: rawPrograms, error: programError } =
      await loadSearchPrograms(supabase);

    if (programError || !rawPrograms) {
      return NextResponse.json(
        { error: "Unable to load programs" },
        { status: 500 }
      );
    }

    let family: Family | null = null;
    if (context?.familyDraft) {
      family = normalizeFamilyFromDraft(context.familyDraft, context.activeChildId);
    } else if (context?.familyId) {
      const { data: familyRow } = await loadFamilyById(supabase, context.familyId);
      if (familyRow) {
        family = normalizeFamilyFromRow(
          familyRow as Record<string, unknown>,
          context.activeChildId
        );
      }
    }

    const homeCoordinates: GeoPoint | null =
      context?.homeCoordinates ?? family?.homeCoordinatesFuzzed ?? null;

    const attendanceAreaId =
      context?.attendanceAreaId ?? family?.homeAttendanceAreaId ?? null;
    const attendanceArea = await resolveAttendanceAreaOverlay(
      supabase,
      attendanceAreaId
    );

    const programs: SearchProgram[] = [];
    for (const row of rawPrograms as Record<string, unknown>[]) {
      const point = toPoint(row.coordinates);
      if (!point) continue;

      const tagsRows = Array.isArray(row.program_tags)
        ? (row.program_tags as Array<{ tag?: string }>)
        : [];
      const languageRows = Array.isArray(row.program_languages)
        ? (row.program_languages as Array<{ language?: string; immersion_type?: string }>)
        : [];
      const scheduleRows = Array.isArray(row.program_schedules)
        ? (row.program_schedules as Array<Record<string, unknown>>)
        : [];
      const costRows = Array.isArray(row.program_costs)
        ? (row.program_costs as Array<Record<string, unknown>>)
        : [];
      const linkageRows = Array.isArray(row.program_sfusd_linkage)
        ? (row.program_sfusd_linkage as Array<Record<string, unknown>>)
        : [];

      const costLows = [
        ...scheduleRows
          .map((s) => numberOrNull(s.monthly_cost_low))
          .filter((n): n is number => n != null),
        ...costRows
          .map((c) => numberOrNull(c.tuition_monthly_low))
          .filter((n): n is number => n != null),
      ];
      const costHighs = [
        ...scheduleRows
          .map((s) => numberOrNull(s.monthly_cost_high))
          .filter((n): n is number => n != null),
        ...costRows
          .map((c) => numberOrNull(c.tuition_monthly_high))
          .filter((n): n is number => n != null),
      ];
      const costLow = costLows.length ? Math.min(...costLows) : null;
      const costHigh = costHighs.length ? Math.max(...costHighs) : costLow;

      const scheduleTypes = [
        ...new Set(
          scheduleRows
            .map((s) => s.schedule_type)
            .filter((t): t is ScheduleType => typeof t === "string")
        ),
      ];

      const normalizedProgram: ProgramWithDetails = {
        id: row.id as string,
        name: (row.name as string) ?? "",
        slug: (row.slug as string) ?? "",
        address: (row.address as string) ?? null,
        coordinates: point,
        phone: null,
        website: null,
        primaryType: (row.primary_type as ProgramWithDetails["primaryType"]) ?? "other",
        licenseNumber: null,
        licenseStatus: null,
        logoUrl: null,
        featuredImageUrl: null,
        ageMinMonths: numberOrNull(row.age_min_months),
        ageMaxMonths: numberOrNull(row.age_max_months),
        gradeLevels: normalizeGradeLevels(row.grade_levels),
        pottyTrainingRequired:
          typeof row.potty_training_required === "boolean"
            ? row.potty_training_required
            : null,
        dataCompletenessScore: numberOrNull(row.data_completeness_score) ?? 0,
        lastVerifiedAt:
          typeof row.last_verified_at === "string" ? row.last_verified_at : null,
        dataSource: (row.data_source as ProgramWithDetails["dataSource"]) ?? "manual",
        createdAt:
          typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
        updatedAt:
          typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
        tags: tagsRows
          .filter((t) => typeof t.tag === "string")
          .map((t, index) => ({
            id: `${row.id}-tag-${index}`,
            programId: row.id as string,
            tag: t.tag as string,
          })),
        schedules: scheduleRows.map((s, index) => ({
          id: `${row.id}-schedule-${index}`,
          programId: row.id as string,
          scheduleType: (s.schedule_type as ScheduleType) ?? "full-day",
          daysPerWeek: numberOrNull(s.days_per_week),
          openTime: (s.open_time as string) ?? null,
          closeTime: (s.close_time as string) ?? null,
          extendedCareAvailable: Boolean(s.extended_care_available),
          summerProgram: Boolean(s.summer_program),
          operates: (s.operates as "school-year" | "full-year") ?? "full-year",
          monthlyCostLow: numberOrNull(s.monthly_cost_low),
          monthlyCostHigh: numberOrNull(s.monthly_cost_high),
          registrationFee: null,
          deposit: null,
        })),
        languages: languageRows
          .filter((l) => typeof l.language === "string")
          .map((l, index) => ({
            id: `${row.id}-language-${index}`,
            programId: row.id as string,
            language: l.language as string,
            immersionType:
              (l.immersion_type as "full" | "dual" | "exposure") ?? "exposure",
          })),
        costs: costRows.map((c, index) => ({
          id: `${row.id}-cost-${index}`,
          programId: row.id as string,
          schoolYear:
            typeof c.school_year === "string" ? c.school_year : "unknown",
          tuitionMonthlyLow: numberOrNull(c.tuition_monthly_low),
          tuitionMonthlyHigh: numberOrNull(c.tuition_monthly_high),
          registrationFee: null,
          deposit: null,
          acceptsSubsidies: Boolean(c.accepts_subsidies),
          financialAidAvailable: Boolean(c.financial_aid_available),
          elfaParticipating:
            typeof c.elfa_participating === "boolean" ? c.elfa_participating : null,
          elfaSourceUrl:
            typeof c.elfa_source_url === "string" ? c.elfa_source_url : null,
          elfaVerifiedAt:
            typeof c.elfa_verified_at === "string" ? c.elfa_verified_at : null,
        })),
        deadlines: [],
        sfusdLinkage:
          linkageRows.length > 0
            ? {
                id: (linkageRows[0].id as string) ?? `${row.id}-sfusd-link`,
                programId: row.id as string,
                attendanceAreaId:
                  (linkageRows[0].attendance_area_id as string) ?? "",
                schoolYear: (linkageRows[0].school_year as string) ?? "unknown",
                feederElementarySchool:
                  (linkageRows[0].feeder_elementary_school as string) ?? null,
                tiebreakerEligible: Boolean(linkageRows[0].tiebreaker_eligible),
                ruleVersionId:
                  (linkageRows[0].rule_version_id as string) ?? null,
              }
            : null,
      };

      const match = family ? scoreProgram(normalizedProgram, family) : null;
      const costEstimate = estimateProgramCostForFamily(normalizedProgram, family);
      const bestSchedule =
        normalizedProgram.schedules
          .toSorted((a, b) => (b.daysPerWeek ?? 0) - (a.daysPerWeek ?? 0))[0] ??
        null;

      programs.push({
        id: normalizedProgram.id,
        name: normalizedProgram.name,
        slug: normalizedProgram.slug,
        address: normalizedProgram.address,
        primaryType: normalizedProgram.primaryType,
        coordinates: point,
        matchTier: match ? match.tier : null,
        matchScore: match ? match.score : null,
        ageRange: formatAgeRange(
          normalizedProgram.ageMinMonths,
          normalizedProgram.ageMaxMonths
        ),
        gradeLevels: normalizedProgram.gradeLevels,
        costRange: formatCostRange(costLow, costHigh),
        costEstimate,
        hours: bestSchedule
          ? formatHours(bestSchedule.openTime, bestSchedule.closeTime)
          : null,
        languages: normalizedProgram.languages.map((l) => l.language),
        distanceKm:
          homeCoordinates != null
            ? haversineDistanceKm(homeCoordinates, point)
            : null,
        costLow,
        scheduleTypes,
        lastVerifiedAt: normalizedProgram.lastVerifiedAt,
        dataCompletenessScore: normalizedProgram.dataCompletenessScore,
      });
    }

    return NextResponse.json({
      programs,
      attendanceArea,
      context: {
        homeCoordinates,
        familyId: context?.familyId ?? family?.id ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load search data" },
      { status: 500 }
    );
  }
}
