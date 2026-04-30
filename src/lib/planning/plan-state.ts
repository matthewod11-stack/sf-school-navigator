import type {
  ChildProfile,
  PlanRole,
  PlanTaskKey,
  PlanTasks,
  PlanTaskStatus,
} from "@/types/domain";

export const PLAN_ROLES: PlanRole[] = ["active", "backup", "inactive"];
export const PLAN_TASK_KEYS: PlanTaskKey[] = ["tour", "application", "follow_up"];
export const PLAN_TASK_STATUSES: PlanTaskStatus[] = [
  "needed",
  "done",
  "not_needed",
];

export const DEFAULT_PLAN_TASKS: PlanTasks = {
  tour: "needed",
  application: "needed",
  follow_up: "needed",
};

export function normalizePlanRole(value: unknown): PlanRole {
  return PLAN_ROLES.includes(value as PlanRole) ? (value as PlanRole) : "active";
}

export function normalizePlanTasks(value: unknown): PlanTasks {
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return PLAN_TASK_KEYS.reduce((tasks, key) => {
    const raw = input[key];
    tasks[key] = PLAN_TASK_STATUSES.includes(raw as PlanTaskStatus)
      ? (raw as PlanTaskStatus)
      : DEFAULT_PLAN_TASKS[key];
    return tasks;
  }, { ...DEFAULT_PLAN_TASKS });
}

export function normalizePlanChildIds(
  value: unknown,
  children: ChildProfile[]
): string[] {
  if (!Array.isArray(value)) return [];
  const childIds = new Set(children.map((child) => child.id));
  return [
    ...new Set(
      value.filter(
        (childId): childId is string =>
          typeof childId === "string" &&
          (children.length === 0 || childIds.has(childId))
      )
    ),
  ];
}

export function validatePlanChildIds(
  childIds: string[],
  children: ChildProfile[]
): boolean {
  const validChildIds = new Set(children.map((child) => child.id));
  return childIds.every((childId) => validChildIds.has(childId));
}

export function hasIncompleteTasks(tasks: PlanTasks): boolean {
  return PLAN_TASK_KEYS.some((key) => tasks[key] === "needed");
}
