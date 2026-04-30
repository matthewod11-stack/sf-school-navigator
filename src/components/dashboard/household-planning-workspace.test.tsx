import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CompareProvider } from "@/components/compare/compare-context";
import { HouseholdPlanningWorkspace } from "./household-planning-workspace";
import { SavedProgramsList, type SavedProgramItem } from "./saved-programs-list";
import type { HouseholdPlan } from "@/lib/planning/household-plan";
import type { ChildProfile } from "@/types/domain";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
}));

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

const savedProgram: SavedProgramItem = {
  id: "saved-1",
  programId: "program-1",
  status: "researching",
  notes: null,
  createdAt: "2026-01-01T00:00:00Z",
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
  program: {
    id: "program-1",
    name: "Bright Start",
    slug: "bright-start",
    address: "1 Main St",
    primaryType: "center",
  },
};

const householdPlan: HouseholdPlan = {
  children: [
    {
      child: children[0],
      programs: [
        {
          savedProgramId: "saved-1",
          programId: "program-1",
          programName: "Bright Start",
          programSlug: "bright-start",
          status: "researching",
          reminderLeadDays: 14,
          planRole: "active",
          planChildIds: [],
          planTasks: savedProgram.planTasks,
          costEstimate: savedProgram.costEstimate,
          strategy: null,
        },
      ],
      active: [
        {
          savedProgramId: "saved-1",
          programId: "program-1",
          programName: "Bright Start",
          programSlug: "bright-start",
          status: "researching",
          reminderLeadDays: 14,
          planRole: "active",
          planChildIds: [],
          planTasks: savedProgram.planTasks,
          costEstimate: savedProgram.costEstimate,
          strategy: null,
        },
      ],
      backups: [],
      inactive: [],
      nextActions: ["Schedule or complete a tour for Bright Start"],
      costLabel: "$800-$1,000/mo per month across active contenders",
      strategyCounts: { fallback: 0, likely: 0, reach: 0 },
    },
  ],
  summary: {
    totalSaved: 1,
    activeCount: 1,
    backupCount: 0,
    inactiveCount: 0,
    upcomingDeadlineCount: 0,
    nextDeadlineLabel: "No upcoming dated deadlines",
    activeCostLabel: "$800-$1,000/mo per month across active contenders",
    shareSummary:
      "Maya has 1 active contender and 0 backups. No upcoming dated deadline is currently available.",
  },
};

describe("HouseholdPlanningWorkspace", () => {
  it("renders household summary, child plan, compare surface, and no-share-link copy", () => {
    const html = renderToStaticMarkup(
      <CompareProvider>
        <HouseholdPlanningWorkspace
          childrenProfiles={children}
          costEstimateBand="unknown"
          householdPlan={householdPlan}
          applicationStrategy={null}
          deadlines={[]}
          reminderPrograms={[]}
          savedPrograms={[savedProgram]}
        />
      </CompareProvider>
    );

    expect(html).toContain("Household Plan");
    expect(html).toContain("Maya has 1 active contender");
    expect(html).toContain("Compare Shortlist");
    expect(html).toContain("No share link");
    expect(html).toContain("Schedule or complete a tour");
  });
});

describe("SavedProgramsList planning controls", () => {
  it("renders planning role, child assignment, and task controls", () => {
    const html = renderToStaticMarkup(
      <SavedProgramsList initialPrograms={[savedProgram]} childrenProfiles={children} />
    );

    expect(html).toContain("Planning role");
    expect(html).toContain("All children");
    expect(html).toContain("Tour");
    expect(html).toContain("Application");
    expect(html).toContain("Follow-up");
  });
});
