import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ApplicationStrategyPanel } from "./application-strategy-panel";
import type { ApplicationStrategyPlan } from "@/lib/planning/application-strategy";

const plan: ApplicationStrategyPlan = {
  recommendations: [
    {
      savedProgramId: "saved-1",
      programId: "program-1",
      programName: "Bright Start",
      programSlug: "bright-start",
      primaryType: "center",
      bucket: "likely",
      priority: 1,
      matchTier: "strong",
      matchScore: 92,
      status: "researching",
      costLabel: "Estimated $500-$700/mo",
      deadlineLabel: "Feb 1, 2026",
      reasons: ["Good planning fit based on match, cost, and data signals."],
      nextActions: ["Prioritize tour, application steps, and document gathering."],
      warnings: [],
    },
    {
      savedProgramId: "saved-2",
      programId: "program-2",
      programName: "SFUSD TK",
      programSlug: "sfusd-tk",
      primaryType: "sfusd-tk",
      bucket: "fallback",
      priority: 2,
      matchTier: "good",
      matchScore: 76,
      status: "researching",
      costLabel: "Likely free",
      deadlineLabel: "Feb 5, 2026",
      reasons: ["Public SFUSD option can anchor the plan if it fits your grade target."],
      nextActions: ["Keep this option current while comparing higher-preference programs."],
      warnings: [],
    },
  ],
  buckets: {
    reach: [],
    likely: [],
    fallback: [],
  },
  gaps: [
    {
      type: "deadline-collision",
      title: "Deadline collision",
      detail: "2 saved programs have close deadlines within seven days of Feb 1, 2026.",
      action: "Prepare shared documents early and confirm each official deadline.",
    },
  ],
  checklist: ["Confirm current tuition, aid availability, and fees with each program."],
  caveats: ["These are planning roles, not admissions odds or placement guarantees."],
  summary: {
    totalSaved: 2,
    reachCount: 0,
    likelyCount: 1,
    fallbackCount: 1,
  },
};
plan.buckets.likely = [plan.recommendations[0]];
plan.buckets.fallback = [plan.recommendations[1]];

describe("ApplicationStrategyPanel", () => {
  it("renders grouped strategy recommendations, gaps, and caveats", () => {
    const html = renderToStaticMarkup(<ApplicationStrategyPanel plan={plan} />);

    expect(html).toContain("Application Strategy");
    expect(html).toContain("Bright Start");
    expect(html).toContain("SFUSD TK");
    expect(html).toContain("Deadline collision");
    expect(html).toContain("not admissions odds");
    expect(html).toContain("Prioritize tour");
  });

  it("renders an empty state until at least two programs are saved", () => {
    const html = renderToStaticMarkup(
      <ApplicationStrategyPanel
        plan={{
          ...plan,
          recommendations: [plan.recommendations[0]],
          buckets: {
            reach: [],
            likely: [plan.recommendations[0]],
            fallback: [],
          },
          gaps: [],
          summary: {
            totalSaved: 1,
            reachCount: 0,
            likelyCount: 1,
            fallbackCount: 0,
          },
        }}
      />
    );

    expect(html).toContain("Save at least two programs");
    expect(html).toContain("not placement guarantees");
  });
});
