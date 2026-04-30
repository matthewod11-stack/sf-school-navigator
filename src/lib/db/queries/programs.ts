import { createClient } from "@/lib/supabase/server";
import type {
  ProgramWithDetails,
  FieldProvenance,
  ScheduleType,
  ImmersionType,
  SchedulePeriod,
  DataSource,
  GradeLevel,
  ProgramType,
} from "@/types/domain";

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function gradeLevelsOrEmpty(value: unknown): GradeLevel[] {
  const allowed = new Set<GradeLevel>(["prek", "tk", "k", "1", "2", "3", "4", "5"]);
  if (!Array.isArray(value)) return [];
  return value.filter((level): level is GradeLevel => allowed.has(level as GradeLevel));
}

interface RawProgram {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  coordinates: unknown;
  phone: string | null;
  website: string | null;
  primary_type: string;
  license_number: string | null;
  license_status: string | null;
  logo_url: string | null;
  featured_image_url: string | null;
  age_min_months: unknown;
  age_max_months: unknown;
  grade_levels: unknown;
  potty_training_required: unknown;
  data_completeness_score: unknown;
  last_verified_at: unknown;
  data_source: string;
  created_at: string;
  updated_at: string;
  program_tags: Array<{ tag: string }>;
  program_schedules: Array<Record<string, unknown>>;
  program_languages: Array<{ language: string; immersion_type: string }>;
  program_costs: Array<Record<string, unknown>>;
  program_deadlines: Array<Record<string, unknown>>;
  program_sfusd_linkage: Array<Record<string, unknown>>;
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

function normalizeProgram(row: RawProgram): ProgramWithDetails {
  const point = toPoint(row.coordinates);

  return {
    id: row.id,
    name: row.name ?? "",
    slug: row.slug ?? "",
    address: row.address,
    coordinates: point,
    phone: row.phone,
    website: row.website,
    primaryType: (row.primary_type as ProgramType) ?? "other",
    licenseNumber: row.license_number,
    licenseStatus: row.license_status,
    logoUrl: row.logo_url,
    featuredImageUrl: row.featured_image_url,
    ageMinMonths: numberOrNull(row.age_min_months),
    ageMaxMonths: numberOrNull(row.age_max_months),
    gradeLevels: gradeLevelsOrEmpty(row.grade_levels),
    pottyTrainingRequired: booleanOrNull(row.potty_training_required),
    dataCompletenessScore: numberOrNull(row.data_completeness_score) ?? 0,
    lastVerifiedAt: stringOrNull(row.last_verified_at),
    dataSource: (row.data_source as DataSource) ?? "manual",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: (row.program_tags ?? []).map((t, i) => ({
      id: `${row.id}-tag-${i}`,
      programId: row.id,
      tag: t.tag,
    })),
    schedules: (row.program_schedules ?? []).map((s, i) => ({
      id: `${row.id}-schedule-${i}`,
      programId: row.id,
      scheduleType: (s.schedule_type as ScheduleType) ?? "full-day",
      daysPerWeek: numberOrNull(s.days_per_week),
      openTime: stringOrNull(s.open_time),
      closeTime: stringOrNull(s.close_time),
      extendedCareAvailable: Boolean(s.extended_care_available),
      summerProgram: Boolean(s.summer_program),
      operates: (s.operates as SchedulePeriod) ?? "full-year",
      monthlyCostLow: numberOrNull(s.monthly_cost_low),
      monthlyCostHigh: numberOrNull(s.monthly_cost_high),
      registrationFee: numberOrNull(s.registration_fee),
      deposit: numberOrNull(s.deposit),
    })),
    languages: (row.program_languages ?? []).map((l, i) => ({
      id: `${row.id}-language-${i}`,
      programId: row.id,
      language: l.language,
      immersionType: (l.immersion_type as ImmersionType) ?? "exposure",
    })),
    costs: (row.program_costs ?? []).map((c, i) => ({
      id: `${row.id}-cost-${i}`,
      programId: row.id,
      schoolYear: stringOrNull(c.school_year) ?? "unknown",
      tuitionMonthlyLow: numberOrNull(c.tuition_monthly_low),
      tuitionMonthlyHigh: numberOrNull(c.tuition_monthly_high),
      registrationFee: numberOrNull(c.registration_fee),
      deposit: numberOrNull(c.deposit),
      acceptsSubsidies: Boolean(c.accepts_subsidies),
      financialAidAvailable: Boolean(c.financial_aid_available),
      elfaParticipating:
        typeof c.elfa_participating === "boolean" ? c.elfa_participating : null,
      elfaSourceUrl: stringOrNull(c.elfa_source_url),
      elfaVerifiedAt: stringOrNull(c.elfa_verified_at),
    })),
    deadlines: (row.program_deadlines ?? []).map((d, i) => ({
      id: `${row.id}-deadline-${i}`,
      programId: row.id,
      schoolYear: stringOrNull(d.school_year) ?? "unknown",
      deadlineType: (d.deadline_type as "application-open" | "application-close" | "notification" | "waitlist") ?? "application-close",
      date: stringOrNull(d.date),
      description: stringOrNull(d.description),
      genericDeadlineEstimate: stringOrNull(d.generic_deadline_estimate),
      sourceUrl: stringOrNull(d.source_url),
      verifiedAt: stringOrNull(d.verified_at),
    })),
    sfusdLinkage:
      (row.program_sfusd_linkage ?? []).length > 0
        ? {
            id: stringOrNull((row.program_sfusd_linkage[0] as Record<string, unknown>).id) ?? `${row.id}-sfusd-link`,
            programId: row.id,
            attendanceAreaId: stringOrNull((row.program_sfusd_linkage[0] as Record<string, unknown>).attendance_area_id) ?? "",
            schoolYear: stringOrNull((row.program_sfusd_linkage[0] as Record<string, unknown>).school_year) ?? "unknown",
            feederElementarySchool: stringOrNull((row.program_sfusd_linkage[0] as Record<string, unknown>).feeder_elementary_school),
            tiebreakerEligible: Boolean((row.program_sfusd_linkage[0] as Record<string, unknown>).tiebreaker_eligible),
            ruleVersionId: stringOrNull((row.program_sfusd_linkage[0] as Record<string, unknown>).rule_version_id),
          }
        : null,
  };
}

const PROGRAM_SELECT = `
  id,
  name,
  slug,
  address,
  coordinates,
  phone,
  website,
  primary_type,
  license_number,
  license_status,
  logo_url,
  featured_image_url,
  age_min_months,
  age_max_months,
  grade_levels,
  potty_training_required,
  data_completeness_score,
  last_verified_at,
  data_source,
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
    monthly_cost_high,
    registration_fee,
    deposit
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
`;

export async function getProgramBySlug(
  slug: string
): Promise<ProgramWithDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select(PROGRAM_SELECT)
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return normalizeProgram(data as unknown as RawProgram);
}

export async function getProgramProvenance(
  programId: string
): Promise<FieldProvenance[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("field_provenance")
    .select("id, program_id, field_name, value_text, source, raw_snippet, extracted_at, verified_at, verified_by")
    .eq("program_id", programId)
    .order("verified_at", { ascending: false, nullsFirst: false })
    .order("extracted_at", { ascending: false });

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    programId: row.program_id as string,
    fieldName: row.field_name as string,
    valueText: stringOrNull(row.value_text),
    source: (row.source as DataSource) ?? "manual",
    rawSnippet: stringOrNull(row.raw_snippet),
    extractedAt: (row.extracted_at as string) ?? new Date().toISOString(),
    verifiedAt: stringOrNull(row.verified_at),
    verifiedBy: stringOrNull(row.verified_by),
  }));
}

export async function getProgramsByIds(
  ids: string[]
): Promise<ProgramWithDetails[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select(PROGRAM_SELECT)
    .in("id", ids);

  if (error || !data) return [];
  return (data as unknown as RawProgram[]).map(normalizeProgram);
}

export async function getAttendanceAreaName(
  areaId: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_areas")
    .select("name")
    .eq("id", areaId)
    .single();

  if (error || !data) return null;
  return (data as { name: string }).name;
}

export interface SfusdRuleRow {
  id: string;
  ruleType: string;
  ruleText: string;
  explanationPlain: string | null;
  confidence: string;
  schoolYear: string;
}

export async function getSfusdRulesForYear(
  schoolYear: string
): Promise<SfusdRuleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sfusd_rules")
    .select("id, rule_type, rule_text, explanation_plain, confidence, school_year")
    .eq("school_year", schoolYear)
    .order("rule_type");

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    ruleType: row.rule_type as string,
    ruleText: row.rule_text as string,
    explanationPlain: stringOrNull(row.explanation_plain),
    confidence: (row.confidence as string) ?? "uncertain",
    schoolYear: row.school_year as string,
  }));
}
