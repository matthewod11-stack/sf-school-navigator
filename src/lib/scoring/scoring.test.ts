import { describe, it, expect } from "vitest";
import { scoreProgram, scoreToTier } from "./index";
import type { ProgramWithDetails, Family } from "@/types/domain";

// ============================================================
// Test Fixtures
// ============================================================

function makeProgram(
  overrides: Partial<ProgramWithDetails> = {}
): ProgramWithDetails {
  return {
    id: "prog-1",
    name: "Test Program",
    slug: "test-program-mission",
    address: "123 Valencia St, San Francisco, CA",
    coordinates: { lng: -122.4221, lat: 37.7694 },
    phone: null,
    website: null,
    primaryType: "center",
    licenseNumber: "380000001",
    licenseStatus: "active",
    logoUrl: null,
    featuredImageUrl: null,
    ageMinMonths: 24,
    ageMaxMonths: 60,
    gradeLevels: ["prek", "tk"],
    pottyTrainingRequired: false,
    dataCompletenessScore: 85,
    lastVerifiedAt: "2026-01-15T00:00:00Z",
    dataSource: "ccl",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
    tags: [
      { id: "t1", programId: "prog-1", tag: "play-based" },
      { id: "t2", programId: "prog-1", tag: "outdoor" },
    ],
    schedules: [
      {
        id: "s1",
        programId: "prog-1",
        scheduleType: "full-day",
        daysPerWeek: 5,
        openTime: "07:30",
        closeTime: "18:00",
        extendedCareAvailable: true,
        summerProgram: true,
        operates: "full-year",
        monthlyCostLow: 1800,
        monthlyCostHigh: 2200,
        registrationFee: 200,
        deposit: 500,
      },
    ],
    languages: [
      { id: "l1", programId: "prog-1", language: "English", immersionType: "full" },
      { id: "l2", programId: "prog-1", language: "Spanish", immersionType: "dual" },
    ],
    costs: [
      {
        id: "c1",
        programId: "prog-1",
        schoolYear: "2026-27",
        tuitionMonthlyLow: 1800,
        tuitionMonthlyHigh: 2200,
        registrationFee: 200,
        deposit: 500,
        acceptsSubsidies: true,
        financialAidAvailable: true,
        elfaParticipating: null,
        elfaSourceUrl: null,
        elfaVerifiedAt: null,
      },
    ],
    deadlines: [],
    sfusdLinkage: null,
    ...overrides,
  };
}

function makeFamily(overrides: Partial<Family> = {}): Family {
  return {
    id: "fam-1",
    userId: "user-1",
    childAgeMonths: 36,
    childExpectedDueDate: null,
    children: [
      {
        id: "child-1",
        label: "Child 1",
        ageMonths: 36,
        expectedDueDate: null,
        pottyTrained: true,
        gradeTarget: "prek",
      },
    ],
    hasSpecialNeeds: false,
    hasMultiples: false,
    numChildren: 1,
    pottyTrained: true,
    homeAttendanceAreaId: null,
    homeCoordinatesFuzzed: { lng: -122.4194, lat: 37.7749 },
    budgetMonthlyMax: 2500,
    subsidyInterested: false,
    costEstimateBand: "unknown",
    scheduleDaysNeeded: 5,
    scheduleHoursNeeded: 8,
    transportMode: "walk",
    preferences: {
      philosophy: ["play-based"],
      languages: ["Spanish"],
      mustHaves: [],
      niceToHaves: ["outdoor"],
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ============================================================
// Tests
// ============================================================

describe("scoreToTier", () => {
  it("returns correct tiers for score ranges", () => {
    expect(scoreToTier(95, 85)).toBe("strong");
    expect(scoreToTier(80, 85)).toBe("strong");
    expect(scoreToTier(70, 85)).toBe("good");
    expect(scoreToTier(60, 85)).toBe("good");
    expect(scoreToTier(50, 85)).toBe("partial");
    expect(scoreToTier(40, 85)).toBe("partial");
    expect(scoreToTier(30, 85)).toBe("hidden");
  });

  it("returns hidden for low data completeness regardless of score", () => {
    expect(scoreToTier(95, 40)).toBe("hidden");
    expect(scoreToTier(80, 10)).toBe("hidden");
  });
});

describe("scoreProgram", () => {
  it("Case 1: Strong match — program matches all family preferences", () => {
    const program = makeProgram();
    const family = makeFamily();
    const result = scoreProgram(program, family);

    expect(result.filtered).toBe(false);
    expect(result.tier).toBe("strong");
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("Case 2: Good match — program matches most preferences but not all", () => {
    // Family wants play-based+montessori, Spanish+Mandarin, outdoor+co-op
    // Program has play-based + co-op + outdoor tags, Spanish+Mandarin languages
    // → philosophy 1/2, language 2/2, nice-to-haves 2/2, cost favorable
    const program = makeProgram({
      tags: [
        { id: "t1", programId: "prog-1", tag: "play-based" },
        { id: "t2", programId: "prog-1", tag: "outdoor" },
        { id: "t3", programId: "prog-1", tag: "co-op" },
      ],
      languages: [
        { id: "l1", programId: "prog-1", language: "Spanish", immersionType: "dual" },
        { id: "l2", programId: "prog-1", language: "Mandarin", immersionType: "exposure" },
      ],
    });
    const family = makeFamily({
      scheduleDaysNeeded: null, // don't penalize for schedule
      preferences: {
        philosophy: ["play-based", "montessori"],
        languages: ["Spanish", "Mandarin"],
        mustHaves: [],
        niceToHaves: ["outdoor", "co-op"],
      },
    });
    const result = scoreProgram(program, family);

    expect(result.filtered).toBe(false);
    expect(result.tier).toBe("good");
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThan(80);
  });

  it("Case 3: Partial match — weak alignment on preferences", () => {
    // Family wants play-based+montessori, Spanish+Mandarin, outdoor+co-op
    // Program has play-based + outdoor tags, Spanish only
    // → philosophy 1/2, language 1/2, nice-to-haves 1/2, cost present
    const program = makeProgram({
      tags: [
        { id: "t1", programId: "prog-1", tag: "play-based" },
        { id: "t2", programId: "prog-1", tag: "outdoor" },
      ],
      languages: [
        { id: "l1", programId: "prog-1", language: "Spanish", immersionType: "dual" },
      ],
    });
    const family = makeFamily({
      scheduleDaysNeeded: null,
      preferences: {
        philosophy: ["play-based", "montessori"],
        languages: ["Spanish", "Mandarin"],
        mustHaves: [],
        niceToHaves: ["outdoor", "co-op"],
      },
    });
    const result = scoreProgram(program, family);

    expect(result.filtered).toBe(false);
    expect(result.tier).toBe("partial");
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(60);
  });

  it("Case 4: Missing data — program with low completeness gets hidden tier", () => {
    const program = makeProgram({
      dataCompletenessScore: 30,
      tags: [],
      schedules: [],
      languages: [],
      costs: [],
    });
    const family = makeFamily();
    const result = scoreProgram(program, family);

    expect(result.filtered).toBe(false);
    expect(result.tier).toBe("hidden");
  });

  it("Case 5: Filtered out — program excluded by hard filter (over budget)", () => {
    const program = makeProgram({
      costs: [
        {
          id: "c1",
          programId: "prog-1",
          schoolYear: "2026-27",
          tuitionMonthlyLow: 3500,
          tuitionMonthlyHigh: 4000,
          registrationFee: 500,
          deposit: 1000,
          acceptsSubsidies: false,
          financialAidAvailable: false,
          elfaParticipating: null,
          elfaSourceUrl: null,
          elfaVerifiedAt: null,
        },
      ],
      schedules: [
        {
          id: "s1",
          programId: "prog-1",
          scheduleType: "full-day",
          daysPerWeek: 5,
          openTime: "08:00",
          closeTime: "17:00",
          extendedCareAvailable: false,
          summerProgram: false,
          operates: "school-year",
          monthlyCostLow: 3500,
          monthlyCostHigh: 4000,
          registrationFee: 500,
          deposit: 1000,
        },
      ],
    });
    const family = makeFamily({ budgetMonthlyMax: 2000 });
    const result = scoreProgram(program, family);

    expect(result.filtered).toBe(true);
    expect(result.tier).toBe("hidden");
    expect(result.score).toBe(0);
    expect(result.filterReason).toBe("Over budget");
  });

  it("Filtered out — child too young", () => {
    const program = makeProgram({ ageMinMonths: 36 });
    const family = makeFamily({
      childAgeMonths: 24,
      children: [
        {
          id: "child-1",
          label: "Child 1",
          ageMonths: 24,
          expectedDueDate: null,
          pottyTrained: true,
          gradeTarget: "prek",
        },
      ],
    });
    const result = scoreProgram(program, family);

    expect(result.filtered).toBe(true);
    expect(result.filterReason).toBe("Child too young");
  });

  it("Filtered out — potty training required", () => {
    const program = makeProgram({ pottyTrainingRequired: true });
    const family = makeFamily({
      pottyTrained: false,
      children: [
        {
          id: "child-1",
          label: "Child 1",
          ageMonths: 36,
          expectedDueDate: null,
          pottyTrained: false,
          gradeTarget: "prek",
        },
      ],
    });
    const result = scoreProgram(program, family);

    expect(result.filtered).toBe(true);
    expect(result.filterReason).toBe("Potty training required");
  });

  it("filters by grade target when program does not offer the grade", () => {
    const program = makeProgram({ gradeLevels: ["prek"] });
    const family = makeFamily({
      children: [
        {
          id: "child-1",
          label: "Child 1",
          ageMonths: 60,
          expectedDueDate: null,
          pottyTrained: true,
          gradeTarget: "k",
        },
      ],
    });
    const result = scoreProgram(program, family);

    expect(result.filtered).toBe(true);
    expect(result.filterReason).toBe("Grade not offered: k");
  });

  it("does not apply potty training hard filter to elementary programs", () => {
    const program = makeProgram({
      primaryType: "sfusd-elementary",
      gradeLevels: ["k", "1", "2", "3", "4", "5"],
      ageMinMonths: null,
      ageMaxMonths: null,
      pottyTrainingRequired: true,
    });
    const family = makeFamily({
      pottyTrained: false,
      children: [
        {
          id: "child-1",
          label: "Child 1",
          ageMonths: 72,
          expectedDueDate: null,
          pottyTrained: false,
          gradeTarget: "1",
        },
      ],
    });
    const result = scoreProgram(program, family);

    expect(result.filtered).toBe(false);
  });
});
