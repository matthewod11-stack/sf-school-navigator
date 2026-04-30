import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SavedProgramsList } from "@/components/dashboard/saved-programs-list";
import { DeadlineTimeline } from "@/components/dashboard/deadline-timeline";
import { ReminderSettings } from "@/components/dashboard/reminder-settings";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ChildProfileManager } from "@/components/dashboard/child-profile-manager";
import { CostPreferenceControl } from "@/components/dashboard/cost-preference-control";
import { ApplicationStrategyPanel } from "@/components/dashboard/application-strategy-panel";
import { getSavedProgramDeadlines } from "@/lib/db/queries/dashboard";
import { coerceChildProfiles } from "@/lib/family/child-profiles";
import { buildApplicationStrategyPlan } from "@/lib/planning/application-strategy";
import {
  estimateProgramCost,
  normalizeCostEstimateBand,
  type ProgramCostEstimate,
} from "@/lib/cost/estimate";
import type {
  ChildProfile,
  CostEstimateBand,
  Family,
  ProgramWithDetails,
  SavedProgramStatus,
} from "@/types/domain";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/search");
  }

  // Get family
  const { data: family } = await supabase
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
      cost_estimate_band,
      schedule_days_needed,
      schedule_hours_needed,
      transport_mode,
      preferences,
      created_at,
      updated_at
    `)
    .eq("user_id", user.id)
    .single();

  // Get saved programs
  let savedPrograms: Array<{
    id: string;
    programId: string;
    status: string;
    notes: string | null;
    createdAt: string;
    costEstimate: ProgramCostEstimate;
    program: {
      id: string;
      name: string;
      slug: string;
      address: string | null;
      primaryType: string;
    } | null;
  }> = [];

  let deadlines: Awaited<ReturnType<typeof getSavedProgramDeadlines>> = [];
  let childProfiles: ChildProfile[] = [];
  let costEstimateBand: CostEstimateBand = "unknown";
  let familyForStrategy: Family | null = null;
  const strategyPrograms: Array<{
    savedProgramId: string;
    status: SavedProgramStatus | string;
    createdAt: string;
    program: ProgramWithDetails;
    costEstimate: ProgramCostEstimate;
  }> = [];

  if (family) {
    costEstimateBand = normalizeCostEstimateBand(
      (family as Record<string, unknown>).cost_estimate_band
    );
    familyForStrategy = normalizeFamilyForStrategy(family as Record<string, unknown>);
    const fallbackChild: ChildProfile = {
      id: "child-1",
      label: "Child 1",
      ageMonths:
        typeof family.child_age_months === "number"
          ? family.child_age_months
          : null,
      expectedDueDate:
        typeof family.child_expected_due_date === "string"
          ? family.child_expected_due_date
          : null,
      pottyTrained:
        typeof family.potty_trained === "boolean"
          ? family.potty_trained
          : null,
      gradeTarget: "prek",
    };
    childProfiles = coerceChildProfiles(family.children, fallbackChild);

    const { data } = await supabase
      .from("saved_programs")
      .select(`
        id,
        program_id,
        status,
        notes,
        reminder_lead_days,
        created_at,
        programs:program_id(
          id,
          name,
          slug,
          address,
          primary_type,
          age_min_months,
          age_max_months,
          grade_levels,
          potty_training_required,
          data_completeness_score,
          last_verified_at,
          data_source,
          program_schedules(
            schedule_type,
            days_per_week,
            open_time,
            close_time,
            extended_care_available,
            summer_program,
            operates,
            monthly_cost_low,
            monthly_cost_high,
            registration_fee,
            deposit
          ),
          program_tags(
            tag
          ),
          program_languages(
            language,
            immersion_type
          ),
          program_costs(
            school_year,
            tuition_monthly_low,
            tuition_monthly_high,
            registration_fee,
            deposit,
            accepts_subsidies,
            financial_aid_available,
            elfa_participating,
            elfa_source_url,
            elfa_verified_at
          ),
          program_deadlines(
            school_year,
            deadline_type,
            date,
            description,
            generic_deadline_estimate,
            source_url,
            verified_at
          ),
          program_sfusd_linkage(
            id,
            attendance_area_id,
            school_year,
            feeder_elementary_school,
            tiebreaker_eligible,
            rule_version_id
          )
        )
      `)
      .eq("family_id", family.id)
      .order("created_at", { ascending: false });

    savedPrograms = (data ?? []).map((row) => {
      const program = row.programs as unknown as Record<string, unknown> | null;
      const normalizedProgram = program
        ? normalizeSavedProgramForEstimate(program)
        : null;
      const costEstimate = normalizedProgram
        ? estimateProgramCost(
            normalizedProgram,
            costEstimateBand,
            childProfiles[0] ?? null
          )
        : {
            band: costEstimateBand,
            stickerMonthlyLow: null,
            stickerMonthlyHigh: null,
            estimatedMonthlyLow: null,
            estimatedMonthlyHigh: null,
            label: "Cost unknown",
            confidence: "uncertain" as const,
            caveats: ["Program details are unavailable."],
            officialLinks: [],
          };
      if (normalizedProgram) {
        strategyPrograms.push({
          savedProgramId: row.id as string,
          status: row.status as string,
          createdAt: row.created_at as string,
          program: normalizedProgram,
          costEstimate,
        });
      }
      return {
        id: row.id as string,
        programId: row.program_id as string,
        status: row.status as string,
        notes: (row.notes as string) ?? null,
        createdAt: row.created_at as string,
        costEstimate,
        program: program
          ? {
              id: program.id as string,
              name: program.name as string,
              slug: program.slug as string,
              address: (program.address as string) ?? null,
              primaryType: program.primary_type as string,
            }
          : null,
      };
    });

    deadlines = await getSavedProgramDeadlines(family.id);
  }

  const applicationStrategy =
    familyForStrategy != null
      ? buildApplicationStrategyPlan(strategyPrograms, familyForStrategy, deadlines)
      : null;

  // Build unique programs for reminder settings
  const uniquePrograms = new Map<
    string,
    { savedProgramId: string; name: string; leadDays: number }
  >();
  if (family) {
    const rows = (
      await supabase
        .from("saved_programs")
        .select("id, reminder_lead_days, programs:program_id(name)")
        .eq("family_id", family.id)
    ).data;

    for (const row of rows ?? []) {
      const prog = row.programs as unknown as { name: string } | null;
      if (prog) {
        uniquePrograms.set(row.id as string, {
          savedProgramId: row.id as string,
          name: prog.name,
          leadDays: (row.reminder_lead_days as number) ?? 14,
        });
      }
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <ChildProfileManager
        initialChildren={childProfiles}
      />

      <CostPreferenceControl initialBand={costEstimateBand} />

      {applicationStrategy && (
        <div className="mt-8">
          <ApplicationStrategyPanel plan={applicationStrategy} />
        </div>
      )}

      {/* Deadline Timeline */}
      <div className="mt-8">
        <h2 className="font-serif text-lg font-semibold text-neutral-900">
          Upcoming Deadlines
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Deadlines from your saved programs, sorted by date.
        </p>
        <div className="mt-4">
          <DeadlineTimeline deadlines={deadlines} />
        </div>
      </div>

      {/* Reminder Settings */}
      {uniquePrograms.size > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-lg font-semibold text-neutral-900">
            Email Reminders
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Set how far in advance you want deadline reminders for each program.
          </p>
          <div className="mt-3 space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
            {Array.from(uniquePrograms.values()).map((p) => (
              <ReminderSettings
                key={p.savedProgramId}
                savedProgramId={p.savedProgramId}
                programName={p.name}
                initialLeadDays={p.leadDays}
              />
            ))}
          </div>
        </div>
      )}

      {/* Saved Programs List */}
      <div className="mt-8">
        <h2 className="font-serif text-lg font-semibold text-neutral-900">
          Saved Programs
        </h2>
        <div className="mt-4">
          <SavedProgramsList initialPrograms={savedPrograms} />
        </div>
      </div>
    </div>
  );
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function toPoint(geometry: unknown): { lng: number; lat: number } | null {
  if (!geometry || typeof geometry !== "object") return null;
  const point = geometry as { type?: string; coordinates?: unknown };
  if (
    point.type !== "Point" ||
    !Array.isArray(point.coordinates) ||
    point.coordinates.length < 2
  ) {
    return null;
  }
  const [lng, lat] = point.coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  return { lng, lat };
}

function normalizeTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeFamilyForStrategy(row: Record<string, unknown>): Family {
  const fallbackChild: ChildProfile = {
    id: "child-1",
    label: "Child 1",
    ageMonths: numberOrNull(row.child_age_months),
    expectedDueDate: stringOrNull(row.child_expected_due_date),
    pottyTrained: booleanOrNull(row.potty_trained),
    gradeTarget: "prek",
  };
  const children = coerceChildProfiles(row.children, fallbackChild);
  const activeChild = children[0] ?? fallbackChild;
  const preferences =
    row.preferences && typeof row.preferences === "object"
      ? (row.preferences as Record<string, unknown>)
      : {};

  return {
    id: (row.id as string) ?? "family",
    userId: (row.user_id as string) ?? "user",
    childAgeMonths: activeChild.ageMonths,
    childExpectedDueDate: activeChild.expectedDueDate,
    children,
    hasSpecialNeeds: booleanOrNull(row.has_special_needs),
    hasMultiples: Boolean(row.has_multiples),
    numChildren: Math.max(numberOrNull(row.num_children) ?? 1, children.length),
    pottyTrained: activeChild.pottyTrained,
    homeAttendanceAreaId: stringOrNull(row.home_attendance_area_id),
    homeCoordinatesFuzzed: toPoint(row.home_coordinates_fuzzed),
    budgetMonthlyMax: numberOrNull(row.budget_monthly_max),
    subsidyInterested: Boolean(row.subsidy_interested),
    costEstimateBand: normalizeCostEstimateBand(row.cost_estimate_band),
    scheduleDaysNeeded: numberOrNull(row.schedule_days_needed),
    scheduleHoursNeeded: numberOrNull(row.schedule_hours_needed),
    transportMode:
      (row.transport_mode as Family["transportMode"] | undefined) ?? "car",
    preferences: {
      philosophy: normalizeTextArray(preferences.philosophy),
      languages: normalizeTextArray(preferences.languages),
      mustHaves: normalizeTextArray(preferences.mustHaves),
      niceToHaves: normalizeTextArray(preferences.niceToHaves),
    },
    createdAt: stringOrNull(row.created_at) ?? "",
    updatedAt: stringOrNull(row.updated_at) ?? "",
  };
}

function normalizeSavedProgramForEstimate(
  row: Record<string, unknown>
): ProgramWithDetails {
  const schedules = Array.isArray(row.program_schedules)
    ? (row.program_schedules as Array<Record<string, unknown>>)
    : [];
  const costs = Array.isArray(row.program_costs)
    ? (row.program_costs as Array<Record<string, unknown>>)
    : [];
  const tags = Array.isArray(row.program_tags)
    ? (row.program_tags as Array<Record<string, unknown>>)
    : [];
  const languages = Array.isArray(row.program_languages)
    ? (row.program_languages as Array<Record<string, unknown>>)
    : [];
  const deadlines = Array.isArray(row.program_deadlines)
    ? (row.program_deadlines as Array<Record<string, unknown>>)
    : [];
  const sfusdLinkage = Array.isArray(row.program_sfusd_linkage)
    ? (row.program_sfusd_linkage as Array<Record<string, unknown>>)
    : [];
  const gradeLevels = Array.isArray(row.grade_levels)
    ? row.grade_levels.filter((level): level is ProgramWithDetails["gradeLevels"][number] =>
        ["prek", "tk", "k", "1", "2", "3", "4", "5"].includes(String(level))
      )
    : [];

  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    slug: (row.slug as string) ?? "",
    address: stringOrNull(row.address),
    coordinates: null,
    phone: null,
    website: null,
    primaryType: (row.primary_type as ProgramWithDetails["primaryType"]) ?? "other",
    licenseNumber: null,
    licenseStatus: null,
    logoUrl: null,
    featuredImageUrl: null,
    ageMinMonths: numberOrNull(row.age_min_months),
    ageMaxMonths: numberOrNull(row.age_max_months),
    gradeLevels,
    pottyTrainingRequired: booleanOrNull(row.potty_training_required),
    dataCompletenessScore: numberOrNull(row.data_completeness_score) ?? 0,
    lastVerifiedAt: stringOrNull(row.last_verified_at),
    dataSource: (row.data_source as ProgramWithDetails["dataSource"]) ?? "manual",
    createdAt: "",
    updatedAt: "",
    schedules: schedules.map((schedule, index) => ({
      id: `${row.id}-schedule-${index}`,
      programId: row.id as string,
      scheduleType:
        (schedule.schedule_type as ProgramWithDetails["schedules"][number]["scheduleType"]) ??
        "full-day",
      daysPerWeek: numberOrNull(schedule.days_per_week),
      openTime: stringOrNull(schedule.open_time),
      closeTime: stringOrNull(schedule.close_time),
      extendedCareAvailable: Boolean(schedule.extended_care_available),
      summerProgram: Boolean(schedule.summer_program),
      operates:
        (schedule.operates as ProgramWithDetails["schedules"][number]["operates"]) ??
        "full-year",
      monthlyCostLow: numberOrNull(schedule.monthly_cost_low),
      monthlyCostHigh: numberOrNull(schedule.monthly_cost_high),
      registrationFee: numberOrNull(schedule.registration_fee),
      deposit: numberOrNull(schedule.deposit),
    })),
    costs: costs.map((cost, index) => ({
      id: `${row.id}-cost-${index}`,
      programId: row.id as string,
      schoolYear: stringOrNull(cost.school_year) ?? "unknown",
      tuitionMonthlyLow: numberOrNull(cost.tuition_monthly_low),
      tuitionMonthlyHigh: numberOrNull(cost.tuition_monthly_high),
      registrationFee: numberOrNull(cost.registration_fee),
      deposit: numberOrNull(cost.deposit),
      acceptsSubsidies: Boolean(cost.accepts_subsidies),
      financialAidAvailable: Boolean(cost.financial_aid_available),
      elfaParticipating:
        typeof cost.elfa_participating === "boolean" ? cost.elfa_participating : null,
      elfaSourceUrl: stringOrNull(cost.elfa_source_url),
      elfaVerifiedAt: stringOrNull(cost.elfa_verified_at),
    })),
    tags: tags
      .filter((tag) => typeof tag.tag === "string")
      .map((tag, index) => ({
        id: `${row.id}-tag-${index}`,
        programId: row.id as string,
        tag: tag.tag as string,
      })),
    languages: languages
      .filter((language) => typeof language.language === "string")
      .map((language, index) => ({
        id: `${row.id}-language-${index}`,
        programId: row.id as string,
        language: language.language as string,
        immersionType:
          (language.immersion_type as ProgramWithDetails["languages"][number]["immersionType"]) ??
          "exposure",
      })),
    deadlines: deadlines.map((deadline, index) => ({
      id: `${row.id}-deadline-${index}`,
      programId: row.id as string,
      schoolYear: stringOrNull(deadline.school_year) ?? "unknown",
      deadlineType:
        (deadline.deadline_type as ProgramWithDetails["deadlines"][number]["deadlineType"]) ??
        "application-close",
      date: stringOrNull(deadline.date),
      description: stringOrNull(deadline.description),
      genericDeadlineEstimate: stringOrNull(deadline.generic_deadline_estimate),
      sourceUrl: stringOrNull(deadline.source_url),
      verifiedAt: stringOrNull(deadline.verified_at),
    })),
    sfusdLinkage:
      sfusdLinkage.length > 0
        ? {
            id: (sfusdLinkage[0].id as string) ?? `${row.id}-sfusd-link`,
            programId: row.id as string,
            attendanceAreaId:
              stringOrNull(sfusdLinkage[0].attendance_area_id) ?? "",
            schoolYear: stringOrNull(sfusdLinkage[0].school_year) ?? "unknown",
            feederElementarySchool: stringOrNull(
              sfusdLinkage[0].feeder_elementary_school
            ),
            tiebreakerEligible: Boolean(sfusdLinkage[0].tiebreaker_eligible),
            ruleVersionId: stringOrNull(sfusdLinkage[0].rule_version_id),
          }
        : null,
  };
}
