import { describe, expect, it } from "vitest";
import { buildHouseholdPlan, type HouseholdPlanSavedProgram } from "./household-plan";
import type { ApplicationStrategyPlan } from "./application-strategy";
import type { DashboardDeadline } from "@/lib/db/queries/dashboard";
import type { ChildProfile } from "@/types/domain";

const children: ChildProfile[] = [
  {
    id: "child-1",
    label: "Maya",
    ageMonths: 48,
    expectedDueDate: null,
    pottyTrained: true,
    gradeTarget: "prek",
  },
  {
    id: "child-2",
    label: "Leo",
    ageMonths: 66,
    expectedDueDate: null,
    pottyTrained: true,
    gradeTarget: "k",
  },
];

function saved(
  id: string,
  overrides: Partial<HouseholdPlanSavedProgram> = {}
): HouseholdPlanSavedProgram {
  return {
    savedProgramId: `saved-${id}`,
    programId: `program-${id}`,
    programName: `Program ${id}`,
    programSlug: `program-${id}`,
    status: "researching",
    reminderLeadDays: 14,
    planRole: "active",
    planChildIds: [],
    planTasks: {
      tour: "needed",
      application: "needed",
      follow_up: "needed",
    },
    costEstimate: {
      band: "unknown",
      stickerMonthlyLow: 1000,
      stickerMonthlyHigh: 1200,
      estimatedMonthlyLow: 800,
      estimatedMonthlyHigh: 1000,
      label: "Estimated $800-$1,000/mo",
      confidence: "likely",
      caveats: [],
      officialLinks: [],
    },
    ...overrides,
  };
}

function strategy(savedProgramId: string, bucket: "fallback" | "likely" | "reach") {
  return {
    savedProgramId,
    programId: savedProgramId.replace("saved", "program"),
    programName: savedProgramId,
    programSlug: savedProgramId,
    primaryType: "center" as const,
    bucket,
    priority: 1,
    matchTier: "good" as const,
    matchScore: 75,
    status: "researching",
    costLabel: "Estimated $800-$1,000/mo",
    deadlineLabel: "Feb 1, 2026",
    reasons: [],
    nextActions: ["Prioritize tour, application steps, and document gathering."],
    warnings: [],
  };
}

function strategyPlan(recommendations: ApplicationStrategyPlan["recommendations"]): ApplicationStrategyPlan {
  return {
    recommendations,
    buckets: {
      fallback: recommendations.filter((item) => item.bucket === "fallback"),
      likely: recommendations.filter((item) => item.bucket === "likely"),
      reach: recommendations.filter((item) => item.bucket === "reach"),
    },
    gaps: [],
    checklist: [],
    caveats: [],
    summary: {
      totalSaved: recommendations.length,
      fallbackCount: recommendations.filter((item) => item.bucket === "fallback").length,
      likelyCount: recommendations.filter((item) => item.bucket === "likely").length,
      reachCount: recommendations.filter((item) => item.bucket === "reach").length,
    },
  };
}

function deadline(savedProgramId: string, programId: string, date: string): DashboardDeadline {
  return {
    savedProgramId,
    programId,
    programName: programId,
    programSlug: programId,
    deadlineType: "application-close",
    date,
    description: null,
    reminderLeadDays: 14,
    savedStatus: "researching",
  };
}

describe("buildHouseholdPlan", () => {
  it("keeps single-child defaults simple", () => {
    const plan = buildHouseholdPlan([children[0]], [saved("one")], null, []);

    expect(plan.children).toHaveLength(1);
    expect(plan.children[0].active).toHaveLength(1);
    expect(plan.summary.shareSummary).toContain("Maya has 1 active contender");
  });

  it("scopes programs to selected children and treats empty child ids as all children", () => {
    const plan = buildHouseholdPlan(
      children,
      [
        saved("all"),
        saved("maya", { planChildIds: ["child-1"] }),
        saved("leo", { planChildIds: ["child-2"] }),
      ],
      null,
      []
    );

    expect(plan.children[0].programs.map((item) => item.programName)).toEqual([
      "Program all",
      "Program maya",
    ]);
    expect(plan.children[1].programs.map((item) => item.programName)).toEqual([
      "Program all",
      "Program leo",
    ]);
  });

  it("counts active, backup, and inactive roles", () => {
    const plan = buildHouseholdPlan(
      children,
      [
        saved("active"),
        saved("backup", { planRole: "backup" }),
        saved("inactive", { planRole: "inactive" }),
      ],
      null,
      []
    );

    expect(plan.summary.activeCount).toBe(1);
    expect(plan.summary.backupCount).toBe(1);
    expect(plan.summary.inactiveCount).toBe(1);
  });

  it("orders next actions from incomplete tasks before strategy actions", () => {
    const item = saved("one", {
      planTasks: { tour: "done", application: "needed", follow_up: "needed" },
    });
    const plan = buildHouseholdPlan(
      [children[0]],
      [item],
      strategyPlan([strategy(item.savedProgramId, "likely")]),
      []
    );

    expect(plan.children[0].nextActions[0]).toContain("Prepare the application");
    expect(plan.children[0].nextActions.join(" ")).toContain("Prioritize tour");
  });

  it("summarizes active contender cost span with unknown costs", () => {
    const plan = buildHouseholdPlan(
      [children[0]],
      [
        saved("known", {
          costEstimate: {
            ...saved("known").costEstimate,
            estimatedMonthlyLow: 600,
            estimatedMonthlyHigh: 900,
          },
        }),
        saved("unknown", {
          costEstimate: {
            ...saved("unknown").costEstimate,
            estimatedMonthlyLow: null,
            estimatedMonthlyHigh: null,
          },
        }),
      ],
      null,
      []
    );

    expect(plan.summary.activeCostLabel).toContain("$600-$900/mo");
    expect(plan.summary.activeCostLabel).toContain("unknowns");
  });

  it("keeps F015 strategy buckets alongside persisted plan roles", () => {
    const active = saved("active", { planRole: "active" });
    const backup = saved("backup", { planRole: "backup" });
    const plan = buildHouseholdPlan(
      [children[0]],
      [active, backup],
      strategyPlan([
        strategy(active.savedProgramId, "reach"),
        strategy(backup.savedProgramId, "fallback"),
      ]),
      []
    );

    expect(plan.children[0].active).toHaveLength(1);
    expect(plan.children[0].backups).toHaveLength(1);
    expect(plan.children[0].strategyCounts).toEqual({
      fallback: 1,
      likely: 0,
      reach: 1,
    });
  });

  it("summarizes upcoming deadlines for household review", () => {
    const item = saved("deadline");
    const plan = buildHouseholdPlan(
      [children[0]],
      [item],
      null,
      [deadline(item.savedProgramId, item.programId, "2026-02-01")],
      { now: new Date(2026, 0, 1) }
    );

    expect(plan.summary.upcomingDeadlineCount).toBe(1);
    expect(plan.summary.nextDeadlineLabel).toContain("Feb 1, 2026");
    expect(plan.summary.shareSummary).toContain("Next dated deadline");
  });
});
