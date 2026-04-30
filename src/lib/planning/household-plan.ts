import { daysUntilDateOnly, formatDateOnly } from "@/lib/dates/date-only";
import { formatMonthlyRange, type ProgramCostEstimate } from "@/lib/cost/estimate";
import { PLAN_TASK_KEYS, hasIncompleteTasks } from "@/lib/planning/plan-state";
import type {
  ApplicationStrategyPlan,
  StrategyRecommendation,
} from "@/lib/planning/application-strategy";
import type { DashboardDeadline } from "@/lib/db/queries/dashboard";
import type {
  ChildProfile,
  PlanRole,
  PlanTasks,
  SavedProgramStatus,
} from "@/types/domain";

export interface HouseholdPlanSavedProgram {
  savedProgramId: string;
  programId: string;
  programName: string;
  programSlug: string;
  status: SavedProgramStatus | string;
  reminderLeadDays: number;
  planRole: PlanRole;
  planChildIds: string[];
  planTasks: PlanTasks;
  costEstimate: ProgramCostEstimate;
}

export interface HouseholdPlanProgram extends HouseholdPlanSavedProgram {
  strategy: StrategyRecommendation | null;
}

export interface HouseholdChildPlan {
  child: ChildProfile;
  programs: HouseholdPlanProgram[];
  active: HouseholdPlanProgram[];
  backups: HouseholdPlanProgram[];
  inactive: HouseholdPlanProgram[];
  nextActions: string[];
  costLabel: string;
  strategyCounts: {
    fallback: number;
    likely: number;
    reach: number;
  };
}

export interface HouseholdPlan {
  children: HouseholdChildPlan[];
  summary: {
    totalSaved: number;
    activeCount: number;
    backupCount: number;
    inactiveCount: number;
    upcomingDeadlineCount: number;
    nextDeadlineLabel: string;
    activeCostLabel: string;
    shareSummary: string;
  };
}

interface BuildHouseholdPlanOptions {
  now?: Date;
}

export function buildHouseholdPlan(
  children: ChildProfile[],
  savedPrograms: HouseholdPlanSavedProgram[],
  strategyPlan: ApplicationStrategyPlan | null,
  deadlines: DashboardDeadline[],
  options: BuildHouseholdPlanOptions = {}
): HouseholdPlan {
  const safeChildren = children.length > 0 ? children : [fallbackChild()];
  const strategyBySavedId = new Map(
    (strategyPlan?.recommendations ?? []).map((recommendation) => [
      recommendation.savedProgramId,
      recommendation,
    ])
  );
  const enriched = savedPrograms.map((program) => ({
    ...program,
    strategy: strategyBySavedId.get(program.savedProgramId) ?? null,
  }));
  const childPlans = safeChildren.map((child) =>
    buildChildPlan(child, enriched, safeChildren.length)
  );
  const activePrograms = enriched.filter((program) => program.planRole === "active");
  const upcomingDeadlines = getUpcomingDeadlines(deadlines, options.now ?? new Date());
  const nextDeadline = upcomingDeadlines[0] ?? null;

  return {
    children: childPlans,
    summary: {
      totalSaved: enriched.length,
      activeCount: activePrograms.length,
      backupCount: enriched.filter((program) => program.planRole === "backup").length,
      inactiveCount: enriched.filter((program) => program.planRole === "inactive").length,
      upcomingDeadlineCount: upcomingDeadlines.length,
      nextDeadlineLabel: nextDeadline
        ? `${nextDeadline.programName}: ${formatDate(nextDeadline.date!)}`
        : "No upcoming dated deadlines",
      activeCostLabel: summarizeCost(activePrograms),
      shareSummary: buildShareSummary(childPlans, activePrograms, upcomingDeadlines),
    },
  };
}

function buildChildPlan(
  child: ChildProfile,
  programs: HouseholdPlanProgram[],
  childCount: number
): HouseholdChildPlan {
  const scoped = programs.filter((program) =>
    appliesToChild(program, child, childCount)
  );
  const active = scoped.filter((program) => program.planRole === "active");
  const backups = scoped.filter((program) => program.planRole === "backup");
  const inactive = scoped.filter((program) => program.planRole === "inactive");

  return {
    child,
    programs: scoped,
    active,
    backups,
    inactive,
    nextActions: buildNextActions(child, scoped),
    costLabel: summarizeCost(active),
    strategyCounts: {
      fallback: scoped.filter((program) => program.strategy?.bucket === "fallback").length,
      likely: scoped.filter((program) => program.strategy?.bucket === "likely").length,
      reach: scoped.filter((program) => program.strategy?.bucket === "reach").length,
    },
  };
}

function appliesToChild(
  program: HouseholdPlanProgram,
  child: ChildProfile,
  childCount: number
): boolean {
  if (program.planChildIds.length === 0) return true;
  if (childCount === 1) return true;
  return program.planChildIds.includes(child.id);
}

function buildNextActions(
  child: ChildProfile,
  programs: HouseholdPlanProgram[]
): string[] {
  const actions: string[] = [];
  const candidates = programs.filter((program) => program.planRole !== "inactive");

  for (const program of candidates) {
    for (const key of PLAN_TASK_KEYS) {
      if (program.planTasks[key] === "needed") {
        actions.push(`${taskLabel(key)} for ${program.programName}`);
        break;
      }
    }
    if (actions.length >= 4) break;
  }

  for (const program of candidates) {
    const strategyAction = program.strategy?.nextActions[0];
    if (strategyAction) {
      actions.push(`${program.programName}: ${strategyAction}`);
    }
    if (actions.length >= 5) break;
  }

  if (actions.length === 0 && candidates.some((program) => hasIncompleteTasks(program.planTasks))) {
    actions.push(`Review remaining planning tasks for ${child.label}.`);
  }
  if (actions.length === 0) {
    actions.push(`No immediate planning tasks for ${child.label}.`);
  }

  return [...new Set(actions)].slice(0, 5);
}

function summarizeCost(programs: HouseholdPlanProgram[]): string {
  if (programs.length === 0) return "No active contenders";
  const lows = programs
    .map((program) => program.costEstimate.estimatedMonthlyLow)
    .filter((value): value is number => value != null);
  const highs = programs
    .map((program) => program.costEstimate.estimatedMonthlyHigh)
    .filter((value): value is number => value != null);

  if (lows.length === 0 && highs.length === 0) {
    return "Active contender costs unknown";
  }

  const low = lows.length > 0 ? Math.min(...lows) : null;
  const high = highs.length > 0 ? Math.max(...highs) : low;
  const suffix =
    lows.length + highs.length < programs.length * 2 ? " plus unknowns" : "";
  return `${formatMonthlyRange(low, high)} per month across active contenders${suffix}`;
}

function getUpcomingDeadlines(
  deadlines: DashboardDeadline[],
  now: Date
): DashboardDeadline[] {
  return deadlines
    .filter((deadline) => {
      if (!deadline.date) return false;
      const days = daysUntilDateOnly(deadline.date, now);
      return days != null && days >= 0;
    })
    .sort((a, b) => a.date!.localeCompare(b.date!));
}

function buildShareSummary(
  childPlans: HouseholdChildPlan[],
  activePrograms: HouseholdPlanProgram[],
  upcomingDeadlines: DashboardDeadline[]
): string {
  const childSummary =
    childPlans.length === 1
      ? `${childPlans[0].child.label} has ${childPlans[0].active.length} active contender${childPlans[0].active.length === 1 ? "" : "s"} and ${childPlans[0].backups.length} backup${childPlans[0].backups.length === 1 ? "" : "s"}.`
      : `${childPlans.length} child profiles are planned with ${activePrograms.length} active contender${activePrograms.length === 1 ? "" : "s"} total.`;
  const deadlineSummary =
    upcomingDeadlines.length > 0
      ? `Next dated deadline: ${upcomingDeadlines[0].programName} on ${formatDate(upcomingDeadlines[0].date!)}.`
      : "No upcoming dated deadline is currently available.";
  return `${childSummary} ${deadlineSummary} Review official program steps before making decisions.`;
}

function taskLabel(key: keyof PlanTasks): string {
  if (key === "tour") return "Schedule or complete a tour";
  if (key === "application") return "Prepare the application";
  return "Follow up with the program";
}

function formatDate(date: string): string {
  return formatDateOnly(date, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fallbackChild(): ChildProfile {
  return {
    id: "child-1",
    label: "Child 1",
    ageMonths: null,
    expectedDueDate: null,
    pottyTrained: null,
    gradeTarget: "prek",
  };
}
