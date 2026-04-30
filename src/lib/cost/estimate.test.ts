import { describe, expect, it } from "vitest";
import { estimateProgramCost, normalizeCostEstimateBand } from "./estimate";
import type { ChildProfile, ProgramWithDetails } from "@/types/domain";

function makeProgram(
  overrides: Partial<ProgramWithDetails> = {}
): ProgramWithDetails {
  return {
    id: "program-1",
    name: "Test Program",
    slug: "test-program",
    address: "123 Main St",
    coordinates: null,
    phone: null,
    website: null,
    primaryType: "center",
    licenseNumber: "380000001",
    licenseStatus: "active",
    logoUrl: null,
    featuredImageUrl: null,
    ageMinMonths: 36,
    ageMaxMonths: 60,
    gradeLevels: ["prek"],
    pottyTrainingRequired: null,
    dataCompletenessScore: 80,
    lastVerifiedAt: "2026-04-30T00:00:00Z",
    dataSource: "ccl",
    createdAt: "2026-04-30T00:00:00Z",
    updatedAt: "2026-04-30T00:00:00Z",
    tags: [],
    schedules: [],
    languages: [],
    costs: [
      {
        id: "cost-1",
        programId: "program-1",
        schoolYear: "2026-27",
        tuitionMonthlyLow: 1800,
        tuitionMonthlyHigh: 2400,
        registrationFee: null,
        deposit: null,
        acceptsSubsidies: true,
        financialAidAvailable: true,
        elfaParticipating: true,
        elfaSourceUrl: "https://www.sf.gov/early-learning-for-all",
        elfaVerifiedAt: "2026-04-30T00:00:00Z",
      },
    ],
    deadlines: [],
    sfusdLinkage: null,
    ...overrides,
  };
}

const preschoolChild: ChildProfile = {
  id: "child-1",
  label: "Child 1",
  ageMonths: 48,
  expectedDueDate: null,
  pottyTrained: true,
  gradeTarget: "prek",
};

describe("estimateProgramCost", () => {
  it("models SFUSD TK/K/elementary programs as free", () => {
    const estimate = estimateProgramCost(
      makeProgram({
        primaryType: "sfusd-elementary",
        costs: [],
      }),
      "not-eligible-over-200-ami"
    );

    expect(estimate.label).toBe("Likely free");
    expect(estimate.estimatedMonthlyLow).toBe(0);
    expect(estimate.confidence).toBe("confirmed");
  });

  it("applies ELFA free tuition band to verified ELFA programs", () => {
    const estimate = estimateProgramCost(
      makeProgram(),
      "elfa-free-0-110-ami",
      preschoolChild
    );

    expect(estimate.label).toBe("Likely free");
    expect(estimate.estimatedMonthlyLow).toBe(0);
    expect(estimate.estimatedMonthlyHigh).toBe(0);
  });

  it("subtracts full ELFA preschool credit for the full-credit band", () => {
    const estimate = estimateProgramCost(
      makeProgram(),
      "elfa-full-credit-111-150-ami",
      preschoolChild
    );

    expect(estimate.estimatedMonthlyLow).toBe(0);
    expect(estimate.estimatedMonthlyHigh).toBe(285);
    expect(estimate.label).toBe("Estimated $0-$285/mo");
  });

  it("uses half credit and explains the July 1 2026 effective date", () => {
    const estimate = estimateProgramCost(
      makeProgram(),
      "elfa-half-credit-151-200-ami",
      preschoolChild
    );

    expect(estimate.estimatedMonthlyLow).toBe(742);
    expect(estimate.estimatedMonthlyHigh).toBe(1342);
    expect(estimate.caveats[0]).toContain("July 1, 2026");
  });

  it("shows sticker price when the family chooses sticker-only", () => {
    const estimate = estimateProgramCost(makeProgram(), "sticker-only", preschoolChild);

    expect(estimate.label).toBe("Sticker $1,800-$2,400/mo");
    expect(estimate.estimatedMonthlyLow).toBe(1800);
    expect(estimate.caveats[0]).toContain("published tuition only");
  });

  it("leaves unknown ELFA participation at sticker price with uncertain confidence", () => {
    const estimate = estimateProgramCost(
      makeProgram({
        costs: [
          {
            id: "cost-1",
            programId: "program-1",
            schoolYear: "2026-27",
            tuitionMonthlyLow: 1800,
            tuitionMonthlyHigh: 2400,
            registrationFee: null,
            deposit: null,
            acceptsSubsidies: true,
            financialAidAvailable: true,
            elfaParticipating: null,
            elfaSourceUrl: null,
            elfaVerifiedAt: null,
          },
        ],
      }),
      "elfa-full-credit-111-150-ami",
      preschoolChild
    );

    expect(estimate.label).toBe("Sticker $1,800-$2,400/mo");
    expect(estimate.confidence).toBe("uncertain");
  });

  it("returns cost unknown when tuition data is missing", () => {
    const estimate = estimateProgramCost(
      makeProgram({ costs: [], schedules: [] }),
      "unknown",
      preschoolChild
    );

    expect(estimate.label).toBe("Cost unknown");
    expect(estimate.estimatedMonthlyLow).toBeNull();
    expect(estimate.confidence).toBe("uncertain");
  });
});

describe("normalizeCostEstimateBand", () => {
  it("defaults unknown input to the privacy-preserving unknown band", () => {
    expect(normalizeCostEstimateBand("exact-income:120000")).toBe("unknown");
  });
});
