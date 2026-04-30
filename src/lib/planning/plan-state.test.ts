import { describe, expect, it } from "vitest";
import {
  normalizePlanChildIds,
  normalizePlanRole,
  normalizePlanTasks,
  validatePlanChildIds,
} from "./plan-state";
import type { ChildProfile } from "@/types/domain";

const children: ChildProfile[] = [
  {
    id: "child-1",
    label: "Child 1",
    ageMonths: 48,
    expectedDueDate: null,
    pottyTrained: true,
    gradeTarget: "prek",
  },
  {
    id: "child-2",
    label: "Child 2",
    ageMonths: 66,
    expectedDueDate: null,
    pottyTrained: true,
    gradeTarget: "k",
  },
];

describe("plan-state helpers", () => {
  it("normalizes plan roles with active as the safe default", () => {
    expect(normalizePlanRole("backup")).toBe("backup");
    expect(normalizePlanRole("unexpected")).toBe("active");
  });

  it("normalizes plan tasks with missing values marked needed", () => {
    expect(
      normalizePlanTasks({
        tour: "done",
        application: "not_needed",
        follow_up: "invalid",
      })
    ).toEqual({
      tour: "done",
      application: "not_needed",
      follow_up: "needed",
    });
  });

  it("keeps only child ids that belong to the family", () => {
    expect(normalizePlanChildIds(["child-1", "missing", "child-1"], children)).toEqual([
      "child-1",
    ]);
  });

  it("validates submitted child ids against family children", () => {
    expect(validatePlanChildIds(["child-1", "child-2"], children)).toBe(true);
    expect(validatePlanChildIds(["child-1", "missing"], children)).toBe(false);
  });
});
