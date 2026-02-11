import { createPublicClient } from "@/lib/supabase/public";
import type { SeoPageConfig } from "./pages";

export interface SeoProgram {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  primaryType: string;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  monthlyCostLow: number | null;
  monthlyCostHigh: number | null;
  languages: string[];
}

export async function getProgramsForSeoPage(
  config: SeoPageConfig
): Promise<SeoProgram[]> {
  const supabase = createPublicClient();

  if (config.type === "neighborhood") {
    // Filter by address containing neighborhood name
    const { data } = await supabase
      .from("programs")
      .select(`
        id, name, slug, address, primary_type,
        age_min_months, age_max_months,
        program_schedules(monthly_cost_low, monthly_cost_high),
        program_languages(language)
      `)
      .ilike("address", `%${config.filterValue}%`)
      .order("name");

    return (data ?? []).map(normalizeRow);
  }

  if (config.type === "language") {
    // Filter by language
    const { data: langRows } = await supabase
      .from("program_languages")
      .select("program_id")
      .eq("language", config.filterValue);

    const programIds = (langRows ?? []).map((r) => r.program_id as string);
    if (programIds.length === 0) return [];

    const { data } = await supabase
      .from("programs")
      .select(`
        id, name, slug, address, primary_type,
        age_min_months, age_max_months,
        program_schedules(monthly_cost_low, monthly_cost_high),
        program_languages(language)
      `)
      .in("id", programIds)
      .order("name");

    return (data ?? []).map(normalizeRow);
  }

  if (config.type === "affordable") {
    // Programs with monthly cost under $2000
    const { data: scheduleRows } = await supabase
      .from("program_schedules")
      .select("program_id")
      .lt("monthly_cost_low", 2000)
      .gt("monthly_cost_low", 0);

    const programIds = [
      ...new Set((scheduleRows ?? []).map((r) => r.program_id as string)),
    ];
    if (programIds.length === 0) return [];

    const { data } = await supabase
      .from("programs")
      .select(`
        id, name, slug, address, primary_type,
        age_min_months, age_max_months,
        program_schedules(monthly_cost_low, monthly_cost_high),
        program_languages(language)
      `)
      .in("id", programIds)
      .order("name");

    return (data ?? []).map(normalizeRow);
  }

  if (config.type === "sfusd") {
    // SFUSD pre-k and TK programs
    const { data } = await supabase
      .from("programs")
      .select(`
        id, name, slug, address, primary_type,
        age_min_months, age_max_months,
        program_schedules(monthly_cost_low, monthly_cost_high),
        program_languages(language)
      `)
      .in("primary_type", ["sfusd-prek", "sfusd-tk"])
      .order("name");

    return (data ?? []).map(normalizeRow);
  }

  return [];
}

export async function getLanguagesWithMinPrograms(
  minCount: number
): Promise<string[]> {
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("program_languages")
    .select("language");

  if (!data) return [];

  // Count occurrences
  const counts = new Map<string, number>();
  for (const row of data) {
    const lang = row.language as string;
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= minCount)
    .map(([lang]) => lang)
    .filter((lang) => lang.toLowerCase() !== "english") // Skip English-only pages
    .sort();
}

export async function getAllProgramSlugs(): Promise<string[]> {
  const supabase = createPublicClient();

  const { data } = await supabase.from("programs").select("slug");
  return (data ?? []).map((r) => r.slug as string);
}

function normalizeRow(row: Record<string, unknown>): SeoProgram {
  const schedules = (row.program_schedules ?? []) as Array<
    Record<string, unknown>
  >;
  const languages = (row.program_languages ?? []) as Array<
    Record<string, unknown>
  >;

  // Pick lowest cost from schedules
  let costLow: number | null = null;
  let costHigh: number | null = null;
  for (const s of schedules) {
    const low = typeof s.monthly_cost_low === "number" ? s.monthly_cost_low : null;
    const high = typeof s.monthly_cost_high === "number" ? s.monthly_cost_high : null;
    if (low !== null && (costLow === null || low < costLow)) costLow = low;
    if (high !== null && (costHigh === null || high > costHigh)) costHigh = high;
  }

  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    address: (row.address as string) ?? null,
    primaryType: row.primary_type as string,
    ageMinMonths: typeof row.age_min_months === "number" ? row.age_min_months : null,
    ageMaxMonths: typeof row.age_max_months === "number" ? row.age_max_months : null,
    monthlyCostLow: costLow,
    monthlyCostHigh: costHigh,
    languages: languages.map((l) => l.language as string),
  };
}
