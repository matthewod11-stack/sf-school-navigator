// Match scoring algorithm for SF School Navigator
//
// Approach:
// 1. Hard filters (must-haves): if unmet, program is excluded entirely
// 2. Weighted boosts (nice-to-haves): 0-10 per attribute, configurable
// 3. Missing data: neutral (no boost or penalty)
// 4. Display tiers: Strong (80%+), Good (60-79%), Partial (40-59%), hidden below 40%
// 5. Programs with data_completeness_score < 50 always show as hidden tier

import type {
  ProgramWithDetails,
  Family,
  MatchResult,
  MatchTier,
} from "@/types/domain";
import { isElementaryProgramType } from "@/lib/program-types";

// ============================================================
// Configuration
// ============================================================

const BOOST_WEIGHTS = {
  philosophy: 10,
  language: 9,
  schedule: 8,
  distance: 7,
  attendanceArea: 7,
  cost: 6,
  kPathConnection: 6,
  niceToHaves: 5,
} as const;

// ============================================================
// Hard Filters
// ============================================================

interface FilterResult {
  filtered: boolean;
  reason: string | null;
}

function applyHardFilters(
  program: ProgramWithDetails,
  family: Family
): FilterResult {
  // Budget ceiling
  if (family.budgetMonthlyMax !== null) {
    const cheapestCost = getCheapestMonthlyCost(program);
    if (cheapestCost !== null && cheapestCost > family.budgetMonthlyMax) {
      return { filtered: true, reason: "Over budget" };
    }
  }

  // Age eligibility
  const activeChild = family.children[0] ?? null;
  const childAgeMonths = activeChild?.ageMonths ?? family.childAgeMonths;
  const gradeTarget = activeChild?.gradeTarget ?? null;
  const isElementary = isElementaryProgramType(program.primaryType);

  if (
    gradeTarget &&
    program.gradeLevels.length > 0 &&
    !program.gradeLevels.includes(gradeTarget)
  ) {
    return { filtered: true, reason: `Grade not offered: ${gradeTarget}` };
  }

  if (childAgeMonths !== null) {
    if (isElementary && childAgeMonths < 60) {
      return { filtered: true, reason: "Child too young for elementary" };
    }
    if (isElementary && childAgeMonths > 132) {
      return { filtered: true, reason: "Child too old for elementary" };
    }
    if (
      !isElementary &&
      program.ageMinMonths !== null &&
      childAgeMonths < program.ageMinMonths
    ) {
      return { filtered: true, reason: "Child too young" };
    }
    if (
      !isElementary &&
      program.ageMaxMonths !== null &&
      childAgeMonths > program.ageMaxMonths
    ) {
      return { filtered: true, reason: "Child too old" };
    }
  }

  // Potty training requirement
  if (
    !isElementary &&
    program.pottyTrainingRequired === true &&
    (activeChild?.pottyTrained ?? family.pottyTrained) === false
  ) {
    return { filtered: true, reason: "Potty training required" };
  }

  // Required language (must-have)
  if (family.preferences.mustHaves.length > 0) {
    const programLanguages = program.languages.map((l) => l.language.toLowerCase());
    const requiredLanguages = family.preferences.mustHaves
      .filter((mh) => mh.startsWith("language:"))
      .map((mh) => mh.replace("language:", "").toLowerCase());

    for (const lang of requiredLanguages) {
      if (programLanguages.length > 0 && !programLanguages.includes(lang)) {
        return { filtered: true, reason: `Required language not offered: ${lang}` };
      }
    }
  }

  return { filtered: false, reason: null };
}

// ============================================================
// Boost Scoring
// ============================================================

function computeBoostScore(
  program: ProgramWithDetails,
  family: Family
): number {
  let score = 0;
  let applicableWeight = 0;

  // Philosophy match
  if (family.preferences.philosophy.length > 0) {
    applicableWeight += BOOST_WEIGHTS.philosophy;
    const programTags = program.tags.map((t) => t.tag.toLowerCase());
    const matchCount = family.preferences.philosophy.filter((p) =>
      programTags.includes(p.toLowerCase())
    ).length;
    if (programTags.length > 0 && family.preferences.philosophy.length > 0) {
      score +=
        (matchCount / family.preferences.philosophy.length) *
        BOOST_WEIGHTS.philosophy;
    }
  }

  // Language preference (nice-to-have, not hard filter)
  if (family.preferences.languages.length > 0) {
    applicableWeight += BOOST_WEIGHTS.language;
    const programLanguages = program.languages.map((l) =>
      l.language.toLowerCase()
    );
    if (programLanguages.length > 0) {
      const matchCount = family.preferences.languages.filter((l) =>
        programLanguages.includes(l.toLowerCase())
      ).length;
      score +=
        (matchCount / family.preferences.languages.length) *
        BOOST_WEIGHTS.language;
    }
    // Missing data → neutral (no boost, no penalty, don't count weight)
    else {
      applicableWeight -= BOOST_WEIGHTS.language;
    }
  }

  // Schedule match
  if (family.scheduleDaysNeeded !== null) {
    applicableWeight += BOOST_WEIGHTS.schedule;
    const matchingSchedule = program.schedules.find(
      (s) =>
        s.daysPerWeek !== null && s.daysPerWeek >= family.scheduleDaysNeeded!
    );
    if (program.schedules.length > 0) {
      score += matchingSchedule ? BOOST_WEIGHTS.schedule : 0;
    } else {
      applicableWeight -= BOOST_WEIGHTS.schedule;
    }
  }

  // Cost preference (lower is better, within budget)
  if (family.budgetMonthlyMax !== null) {
    applicableWeight += BOOST_WEIGHTS.cost;
    const cheapest = getCheapestMonthlyCost(program);
    if (cheapest !== null && family.budgetMonthlyMax > 0) {
      const ratio = 1 - cheapest / family.budgetMonthlyMax;
      score += Math.max(0, ratio) * BOOST_WEIGHTS.cost;
    } else if (cheapest === null) {
      applicableWeight -= BOOST_WEIGHTS.cost;
    }
  }

  if (
    family.homeAttendanceAreaId &&
    program.sfusdLinkage?.attendanceAreaId === family.homeAttendanceAreaId
  ) {
    applicableWeight += BOOST_WEIGHTS.attendanceArea;
    score += BOOST_WEIGHTS.attendanceArea;
  }

  if (
    program.sfusdLinkage?.feederElementarySchool ||
    program.tags.some((tag) => tag.tag.toLowerCase() === "k-path")
  ) {
    applicableWeight += BOOST_WEIGHTS.kPathConnection;
    score += BOOST_WEIGHTS.kPathConnection;
  }

  // Nice-to-haves (non-language)
  const nonLanguageNiceToHaves = family.preferences.niceToHaves.filter(
    (nh) => !nh.startsWith("language:")
  );
  if (nonLanguageNiceToHaves.length > 0) {
    applicableWeight += BOOST_WEIGHTS.niceToHaves;
    const programTags = program.tags.map((t) => t.tag.toLowerCase());
    const matchCount = nonLanguageNiceToHaves.filter((nh) =>
      programTags.includes(nh.toLowerCase())
    ).length;
    if (programTags.length > 0) {
      score +=
        (matchCount / nonLanguageNiceToHaves.length) *
        BOOST_WEIGHTS.niceToHaves;
    } else {
      applicableWeight -= BOOST_WEIGHTS.niceToHaves;
    }
  }

  // Normalize to 0-100
  if (applicableWeight <= 0) return 50; // No preferences → neutral score
  return Math.round((score / applicableWeight) * 100);
}

// ============================================================
// Tier Assignment
// ============================================================

export function scoreToTier(
  score: number,
  dataCompleteness: number
): MatchTier {
  if (dataCompleteness < 50) return "hidden";
  if (score >= 80) return "strong";
  if (score >= 60) return "good";
  if (score >= 40) return "partial";
  return "hidden";
}

// ============================================================
// Main Entry Point
// ============================================================

export function scoreProgram(
  program: ProgramWithDetails,
  family: Family
): MatchResult {
  // Step 1: Hard filters
  const filterResult = applyHardFilters(program, family);
  if (filterResult.filtered) {
    return {
      programId: program.id,
      tier: "hidden",
      score: 0,
      filtered: true,
      filterReason: filterResult.reason,
    };
  }

  // Step 2: Boost scoring
  const score = computeBoostScore(program, family);

  // Step 3: Tier assignment
  const tier = scoreToTier(score, program.dataCompletenessScore);

  return {
    programId: program.id,
    tier,
    score,
    filtered: false,
    filterReason: null,
  };
}

export function scorePrograms(
  programs: ProgramWithDetails[],
  family: Family
): MatchResult[] {
  return programs.map((p) => scoreProgram(p, family));
}

// ============================================================
// Helpers
// ============================================================

function getCheapestMonthlyCost(program: ProgramWithDetails): number | null {
  const costs = [
    ...program.costs
      .map((c) => c.tuitionMonthlyLow)
      .filter((c): c is number => c !== null),
    ...program.schedules
      .map((s) => s.monthlyCostLow)
      .filter((c): c is number => c !== null),
  ];
  if (costs.length === 0) return null;
  return Math.min(...costs);
}
