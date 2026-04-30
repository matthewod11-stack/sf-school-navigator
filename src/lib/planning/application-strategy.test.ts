import { describe, expect, it } from "vitest";
import { buildApplicationStrategyPlan } from "./application-strategy";
import type { ProgramCostEstimate } from "@/lib/cost/estimate";
import type { DashboardDeadline } from "@/lib/db/queries/dashboard";
import type { Family, ProgramType, ProgramWithDetails } from "@/types/domain";

const NOW = new Date(2026, 0, 1);

function makeFamily(overrides: Partial<Family> = {}): Family {
  return {
    id: "family-1",
    userId: "user-1",
    childAgeMonths: 48,
    childExpectedDueDate: null,
    children: [
      {
        id: "child-1",
        label: "Child 1",
        ageMonths: 48,
        expectedDueDate: null,
        pottyTrained: true,
        gradeTarget: "prek",
      },
    ],
    hasSpecialNeeds: null,
    hasMultiples: false,
    numChildren: 1,
    pottyTrained: true,
    homeAttendanceAreaId: "area-1",
    homeCoordinatesFuzzed: null,
    budgetMonthlyMax: 1200,
    subsidyInterested: true,
    costEstimateBand: "elfa-full-credit-111-150-ami",
    scheduleDaysNeeded: 5,
    scheduleHoursNeeded: null,
    transportMode: "car",
    preferences: {
      philosophy: ["play-based"],
      languages: [],
      mustHaves: [],
      niceToHaves: ["outdoor"],
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeProgram(
  id: string,
  overrides: Partial<ProgramWithDetails> = {}
): ProgramWithDetails {
  const primaryType = overrides.primaryType ?? "center";
  const gradeLevels = overrides.gradeLevels ?? ["prek"];

  return {
    id,
    name: `Program ${id}`,
    slug: `program-${id}`,
    address: null,
    coordinates: null,
    phone: null,
    website: null,
    primaryType,
    licenseNumber: null,
    licenseStatus: null,
    logoUrl: null,
    featuredImageUrl: null,
    ageMinMonths: primaryType === "center" ? 24 : null,
    ageMaxMonths: primaryType === "center" ? 60 : null,
    gradeLevels,
    pottyTrainingRequired: null,
    dataCompletenessScore: 90,
    lastVerifiedAt: "2025-12-01T00:00:00Z",
    dataSource: "manual",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    tags: [
      { id: `${id}-tag-1`, programId: id, tag: "play-based" },
      { id: `${id}-tag-2`, programId: id, tag: "outdoor" },
    ],
    schedules: [
      {
        id: `${id}-schedule-1`,
        programId: id,
        scheduleType: "full-day",
        daysPerWeek: 5,
        openTime: null,
        closeTime: null,
        extendedCareAvailable: true,
        summerProgram: false,
        operates: "school-year",
        monthlyCostLow: 1000,
        monthlyCostHigh: 1200,
        registrationFee: null,
        deposit: null,
      },
    ],
    languages: [],
    costs: [
      {
        id: `${id}-cost-1`,
        programId: id,
        schoolYear: "2025-2026",
        tuitionMonthlyLow: 1000,
        tuitionMonthlyHigh: 1200,
        registrationFee: null,
        deposit: null,
        acceptsSubsidies: true,
        financialAidAvailable: true,
        elfaParticipating: true,
        elfaSourceUrl: null,
        elfaVerifiedAt: null,
      },
    ],
    deadlines: [],
    sfusdLinkage: null,
    ...overrides,
  };
}

function makeEstimate(
  overrides: Partial<ProgramCostEstimate> = {}
): ProgramCostEstimate {
  return {
    band: "elfa-full-credit-111-150-ami",
    stickerMonthlyLow: 1000,
    stickerMonthlyHigh: 1200,
    estimatedMonthlyLow: 0,
    estimatedMonthlyHigh: 0,
    label: "Likely free",
    confidence: "likely",
    caveats: [],
    officialLinks: [],
    ...overrides,
  };
}

function makeSaved(
  id: string,
  options: {
    primaryType?: ProgramType;
    program?: Partial<ProgramWithDetails>;
    estimate?: Partial<ProgramCostEstimate>;
  } = {}
) {
  const program = makeProgram(id, {
    primaryType: options.primaryType,
    ...options.program,
  });

  return {
    savedProgramId: `saved-${id}`,
    status: "researching",
    createdAt: "2026-01-01T00:00:00Z",
    program,
    costEstimate: makeEstimate(options.estimate),
  };
}

function makeDeadline(
  savedProgramId: string,
  programId: string,
  date: string | null
): DashboardDeadline {
  return {
    savedProgramId,
    programId,
    programName: `Program ${programId}`,
    programSlug: `program-${programId}`,
    deadlineType: "application-close",
    date,
    description: null,
    reminderLeadDays: 14,
    savedStatus: "researching",
  };
}

describe("buildApplicationStrategyPlan", () => {
  it("uses public and free programs as fallback planning roles", () => {
    const saved = makeSaved("sfusd", {
      primaryType: "sfusd-tk",
      program: { gradeLevels: ["tk"], ageMinMonths: null, ageMaxMonths: null },
      estimate: { estimatedMonthlyLow: 0, estimatedMonthlyHigh: 0 },
    });
    const family = makeFamily({
      children: [{ ...makeFamily().children[0], gradeTarget: "tk" }],
    });

    const plan = buildApplicationStrategyPlan(
      [saved],
      family,
      [makeDeadline(saved.savedProgramId, saved.program.id, "2026-02-01")],
      { now: NOW }
    );

    expect(plan.recommendations[0].bucket).toBe("fallback");
    expect(plan.recommendations[0].reasons.join(" ")).toContain("Public SFUSD");
  });

  it("uses fallback for strong fit programs that are within budget", () => {
    const saved = makeSaved("strong", {
      estimate: {
        estimatedMonthlyLow: 900,
        estimatedMonthlyHigh: 1100,
        label: "Estimated $900-$1,100/mo",
      },
    });

    const plan = buildApplicationStrategyPlan(
      [saved],
      makeFamily(),
      [makeDeadline(saved.savedProgramId, saved.program.id, "2026-03-01")],
      { now: NOW }
    );

    expect(plan.recommendations[0].bucket).toBe("fallback");
    expect(plan.recommendations[0].reasons.join(" ")).toContain("within the saved budget");
  });

  it("uses reach for expensive or uncertain programs", () => {
    const saved = makeSaved("expensive", {
      estimate: {
        estimatedMonthlyLow: 2200,
        estimatedMonthlyHigh: 2500,
        label: "Estimated $2,200-$2,500/mo",
        confidence: "likely",
      },
    });

    const plan = buildApplicationStrategyPlan(
      [saved],
      makeFamily({ budgetMonthlyMax: 1200 }),
      [makeDeadline(saved.savedProgramId, saved.program.id, "2026-03-01")],
      { now: NOW }
    );

    expect(plan.recommendations[0].bucket).toBe("reach");
    expect(plan.recommendations[0].warnings.join(" ")).toContain("Cost may exceed");
  });

  it("flags missing cost as low-confidence planning input", () => {
    const saved = makeSaved("unknown-cost", {
      estimate: {
        estimatedMonthlyLow: null,
        estimatedMonthlyHigh: null,
        label: "Cost unknown",
        confidence: "uncertain",
      },
    });

    const plan = buildApplicationStrategyPlan(
      [saved],
      makeFamily(),
      [makeDeadline(saved.savedProgramId, saved.program.id, "2026-03-01")],
      { now: NOW }
    );

    expect(plan.recommendations[0].bucket).toBe("reach");
    expect(plan.recommendations[0].nextActions.join(" ")).toContain("Confirm current tuition");
  });

  it("detects no affordable fallback across a mixed saved set", () => {
    const saved = [
      makeSaved("one", {
        estimate: { estimatedMonthlyLow: 1800, estimatedMonthlyHigh: 2000 },
      }),
      makeSaved("two", {
        estimate: { estimatedMonthlyLow: 1900, estimatedMonthlyHigh: 2100 },
      }),
    ];

    const plan = buildApplicationStrategyPlan(
      saved,
      makeFamily({ budgetMonthlyMax: 1200 }),
      saved.map((item) => makeDeadline(item.savedProgramId, item.program.id, "2026-03-01")),
      { now: NOW }
    );

    expect(plan.gaps.map((gap) => gap.type)).toContain("no-affordable-fallback");
  });

  it("detects deadline collisions within seven days", () => {
    const saved = [makeSaved("one"), makeSaved("two")];

    const plan = buildApplicationStrategyPlan(
      saved,
      makeFamily(),
      [
        makeDeadline(saved[0].savedProgramId, saved[0].program.id, "2026-02-01"),
        makeDeadline(saved[1].savedProgramId, saved[1].program.id, "2026-02-07"),
      ],
      { now: NOW }
    );

    expect(plan.gaps.map((gap) => gap.type)).toContain("deadline-collision");
  });

  it("detects heavy reliance on low-confidence listings", () => {
    const saved = [
      makeSaved("one", {
        program: { dataCompletenessScore: 40 },
        estimate: { confidence: "uncertain", estimatedMonthlyHigh: null },
      }),
      makeSaved("two", {
        estimate: { confidence: "uncertain", estimatedMonthlyHigh: null },
      }),
    ];

    const plan = buildApplicationStrategyPlan(
      saved,
      makeFamily(),
      saved.map((item) => makeDeadline(item.savedProgramId, item.program.id, "2026-03-01")),
      { now: NOW }
    );

    expect(plan.gaps.map((gap) => gap.type)).toContain("low-confidence-heavy");
  });

  it("detects missing public TK/K options when the child target is elementary", () => {
    const saved = [makeSaved("private")];
    const family = makeFamily({
      children: [{ ...makeFamily().children[0], gradeTarget: "k" }],
    });

    const plan = buildApplicationStrategyPlan(
      saved,
      family,
      [makeDeadline(saved[0].savedProgramId, saved[0].program.id, "2026-03-01")],
      { now: NOW }
    );

    expect(plan.gaps.map((gap) => gap.type)).toContain("missing-public-option");
  });

  it("keeps strategy copy framed as planning support, not guarantees", () => {
    const saved = makeSaved("copy");
    const plan = buildApplicationStrategyPlan(
      [saved],
      makeFamily(),
      [makeDeadline(saved.savedProgramId, saved.program.id, "2026-03-01")],
      { now: NOW }
    );

    const copy = [
      ...plan.caveats,
      ...plan.recommendations.flatMap((item) => [
        ...item.reasons,
        ...item.nextActions,
        ...item.warnings,
      ]),
    ].join(" ");

    expect(copy).toContain("planning");
    expect(copy).toContain("not admissions odds");
    expect(copy.toLowerCase()).not.toContain("prediction");
  });
});
