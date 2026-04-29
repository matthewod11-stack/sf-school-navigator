import { describe, expect, it } from "vitest";
import {
  coerceChildProfiles,
  familyChildColumns,
  finalizeChildProfiles,
  selectActiveChild,
} from "./child-profiles";
import type { ChildProfile } from "@/types/domain";

const fallback: ChildProfile = {
  id: "fallback",
  label: "Child 1",
  ageMonths: 48,
  expectedDueDate: null,
  pottyTrained: true,
  gradeTarget: "tk",
};

describe("child profile helpers", () => {
  it("finalizes validated child profile input for persistence", () => {
    const [child] = finalizeChildProfiles([
      {
        id: " existing-id ",
        label: "  Maya  ",
        ageMonths: 72,
        expectedDueDate: null,
        pottyTrained: false,
        gradeTarget: "1",
      },
    ]);

    expect(child).toEqual({
      id: "existing-id",
      label: "Maya",
      ageMonths: 72,
      expectedDueDate: null,
      pottyTrained: false,
      gradeTarget: "1",
    });
  });

  it("coerces stored JSONB child profiles and falls back when missing", () => {
    expect(coerceChildProfiles(null, fallback)).toEqual([fallback]);

    expect(
      coerceChildProfiles(
        [
          {
            id: "child-1",
            label: "Sam",
            ageMonths: 60,
            expectedDueDate: "2026-08-01",
            pottyTrained: true,
            gradeTarget: "k",
          },
          { label: "", gradeTarget: "not-a-grade" },
        ],
        fallback
      )
    ).toEqual([
      {
        id: "child-1",
        label: "Sam",
        ageMonths: 60,
        expectedDueDate: "2026-08-01",
        pottyTrained: true,
        gradeTarget: "k",
      },
      {
        id: "child-2",
        label: "Child 2",
        ageMonths: null,
        expectedDueDate: null,
        pottyTrained: null,
        gradeTarget: "tk",
      },
    ]);
  });

  it("moves the selected active child to the scoring position", () => {
    const children: ChildProfile[] = [
      { ...fallback, id: "a", label: "A" },
      { ...fallback, id: "b", label: "B", gradeTarget: "k" },
    ];

    expect(selectActiveChild(children, "b").map((child) => child.id)).toEqual(["b", "a"]);
    expect(selectActiveChild(children, "missing").map((child) => child.id)).toEqual(["a", "b"]);
  });

  it("derives legacy family columns from the first child", () => {
    const columns = familyChildColumns([
      {
        id: "child-1",
        label: "Child 1",
        ageMonths: 84,
        expectedDueDate: null,
        pottyTrained: true,
        gradeTarget: "2",
      },
      {
        id: "child-2",
        label: "Child 2",
        ageMonths: 48,
        expectedDueDate: null,
        pottyTrained: null,
        gradeTarget: "tk",
      },
    ]);

    expect(columns).toMatchObject({
      child_age_months: 84,
      child_expected_due_date: null,
      potty_trained: true,
      num_children: 2,
      has_multiples: true,
    });
  });
});
