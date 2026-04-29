import { z } from "zod";
import type { ChildProfile, GradeLevel } from "@/types/domain";

const GRADE_LEVEL_VALUES = ["prek", "tk", "k", "1", "2", "3", "4", "5"] as const;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const gradeLevelSchema = z.enum(GRADE_LEVEL_VALUES);

export const childProfileInputSchema = z.object({
  id: z.string().trim().min(1).max(80).optional(),
  label: z.string().trim().min(1).max(40),
  ageMonths: z.number().int().min(0).max(216).nullable(),
  expectedDueDate: z
    .string()
    .regex(DATE_ONLY_PATTERN, "Use YYYY-MM-DD format")
    .nullable(),
  pottyTrained: z.boolean().nullable(),
  gradeTarget: gradeLevelSchema,
});

export const childProfilesUpdateSchema = z.object({
  children: z.array(childProfileInputSchema).min(1).max(10),
});

export type ChildProfileInput = z.infer<typeof childProfileInputSchema>;

function newChildId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `child-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function gradeLevelOrDefault(value: unknown, fallback: GradeLevel): GradeLevel {
  return GRADE_LEVEL_VALUES.includes(value as GradeLevel)
    ? (value as GradeLevel)
    : fallback;
}

export function finalizeChildProfiles(children: ChildProfileInput[]): ChildProfile[] {
  return children.map((child, index) => ({
    id: child.id?.trim() || newChildId(),
    label: child.label.trim() || `Child ${index + 1}`,
    ageMonths: child.ageMonths,
    expectedDueDate: child.expectedDueDate,
    pottyTrained: child.pottyTrained,
    gradeTarget: child.gradeTarget,
  }));
}

export function coerceChildProfiles(
  value: unknown,
  fallback: ChildProfile
): ChildProfile[] {
  if (!Array.isArray(value)) return [fallback];

  const children = value
    .map((child, index): ChildProfile | null => {
      if (!child || typeof child !== "object") return null;
      const raw = child as Record<string, unknown>;
      const label =
        typeof raw.label === "string" && raw.label.trim()
          ? raw.label.trim().slice(0, 40)
          : `Child ${index + 1}`;

      return {
        id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `child-${index + 1}`,
        label,
        ageMonths: numberOrNull(raw.ageMonths),
        expectedDueDate:
          typeof raw.expectedDueDate === "string" && DATE_ONLY_PATTERN.test(raw.expectedDueDate)
            ? raw.expectedDueDate
            : null,
        pottyTrained: booleanOrNull(raw.pottyTrained),
        gradeTarget: gradeLevelOrDefault(raw.gradeTarget, fallback.gradeTarget),
      };
    })
    .filter((child): child is ChildProfile => child !== null);

  return children.length > 0 ? children : [fallback];
}

export function selectActiveChild(
  children: ChildProfile[],
  activeChildId?: string | null
): ChildProfile[] {
  if (!activeChildId) return children;
  const active = children.find((child) => child.id === activeChildId);
  if (!active) return children;
  return [active, ...children.filter((child) => child.id !== activeChildId)];
}

export function familyChildColumns(children: ChildProfile[]) {
  const first = children[0] ?? null;
  return {
    child_age_months: first?.ageMonths ?? null,
    child_expected_due_date: first?.expectedDueDate ?? null,
    potty_trained: first?.pottyTrained ?? null,
    children,
    num_children: children.length,
    has_multiples: children.length > 1,
  };
}
