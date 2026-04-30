import { daysUntilDateOnly, formatDateOnly } from "@/lib/dates/date-only";
import { scoreProgram } from "@/lib/scoring";
import type { ProgramCostEstimate } from "@/lib/cost/estimate";
import type { DashboardDeadline } from "@/lib/db/queries/dashboard";
import type {
  Family,
  MatchResult,
  ProgramType,
  ProgramWithDetails,
  SavedProgramStatus,
} from "@/types/domain";

export type StrategyBucket = "reach" | "likely" | "fallback";

export type PlanningGapType =
  | "no-affordable-fallback"
  | "deadline-collision"
  | "low-confidence-heavy"
  | "missing-public-option";

export interface SavedProgramStrategyInput {
  savedProgramId: string;
  status: SavedProgramStatus | string;
  createdAt: string;
  program: ProgramWithDetails;
  costEstimate: ProgramCostEstimate;
}

export interface StrategyRecommendation {
  savedProgramId: string;
  programId: string;
  programName: string;
  programSlug: string;
  primaryType: ProgramType;
  bucket: StrategyBucket;
  priority: number;
  matchTier: MatchResult["tier"];
  matchScore: number;
  status: SavedProgramStatus | string;
  costLabel: string;
  deadlineLabel: string;
  reasons: string[];
  nextActions: string[];
  warnings: string[];
}

export interface PlanningGap {
  type: PlanningGapType;
  title: string;
  detail: string;
  action: string;
}

export interface ApplicationStrategyPlan {
  recommendations: StrategyRecommendation[];
  buckets: Record<StrategyBucket, StrategyRecommendation[]>;
  gaps: PlanningGap[];
  checklist: string[];
  caveats: string[];
  summary: {
    totalSaved: number;
    reachCount: number;
    likelyCount: number;
    fallbackCount: number;
  };
}

interface BuildOptions {
  now?: Date;
}

interface DeadlineSummary {
  label: string;
  warning: string | null;
  daysUntilClose: number | null;
  hasUnknownCloseDate: boolean;
}

const BUCKET_ORDER: Record<StrategyBucket, number> = {
  fallback: 0,
  likely: 1,
  reach: 2,
};

const STRATEGY_CAVEATS = [
  "These are planning roles, not admissions odds or placement guarantees.",
  "Confirm eligibility, costs, deadlines, and application steps with each program or official source.",
];

const CHECKLIST = [
  "Confirm current tuition, aid availability, and fees with each program.",
  "Check the official application deadline and required documents.",
  "Schedule tours or information sessions for priority programs.",
  "Keep at least one lower-cost or public option in the plan where possible.",
];

export function buildApplicationStrategyPlan(
  savedPrograms: SavedProgramStrategyInput[],
  family: Family,
  deadlines: DashboardDeadline[],
  options: BuildOptions = {}
): ApplicationStrategyPlan {
  const now = options.now ?? new Date();
  const recommendations = savedPrograms
    .map((item) => buildRecommendation(item, family, deadlines, now))
    .sort(compareRecommendations)
    .map((recommendation, index) => ({
      ...recommendation,
      priority: index + 1,
    }));

  const buckets: Record<StrategyBucket, StrategyRecommendation[]> = {
    reach: recommendations.filter((item) => item.bucket === "reach"),
    likely: recommendations.filter((item) => item.bucket === "likely"),
    fallback: recommendations.filter((item) => item.bucket === "fallback"),
  };

  return {
    recommendations,
    buckets,
    gaps: detectPlanningGaps(savedPrograms, recommendations, family, deadlines, now),
    checklist: CHECKLIST,
    caveats: STRATEGY_CAVEATS,
    summary: {
      totalSaved: savedPrograms.length,
      reachCount: buckets.reach.length,
      likelyCount: buckets.likely.length,
      fallbackCount: buckets.fallback.length,
    },
  };
}

function buildRecommendation(
  item: SavedProgramStrategyInput,
  family: Family,
  deadlines: DashboardDeadline[],
  now: Date
): StrategyRecommendation {
  const match = scoreProgram(item.program, family);
  const deadlineSummary = summarizeDeadline(item, deadlines, now);
  const warnings = collectWarnings(item, family, match, deadlineSummary);
  const bucket = chooseBucket(item, family, match, deadlineSummary, warnings);

  return {
    savedProgramId: item.savedProgramId,
    programId: item.program.id,
    programName: item.program.name,
    programSlug: item.program.slug,
    primaryType: item.program.primaryType,
    bucket,
    priority: 0,
    matchTier: match.tier,
    matchScore: match.score,
    status: item.status,
    costLabel: item.costEstimate.label,
    deadlineLabel: deadlineSummary.label,
    reasons: collectReasons(item, family, match, deadlineSummary, bucket),
    nextActions: collectNextActions(item, bucket, deadlineSummary),
    warnings,
  };
}

function chooseBucket(
  item: SavedProgramStrategyInput,
  family: Family,
  match: MatchResult,
  deadlineSummary: DeadlineSummary,
  warnings: string[]
): StrategyBucket {
  const lowDataConfidence = item.program.dataCompletenessScore < 50;
  const deadlineRisk =
    deadlineSummary.daysUntilClose != null && deadlineSummary.daysUntilClose <= 14;
  const costRisk = isCostRisk(item, family);
  const fallbackCandidate =
    isPublicProgram(item.program) ||
    isFreeEstimate(item.costEstimate) ||
    (isAffordableEstimate(item.costEstimate, family) &&
      item.costEstimate.confidence !== "uncertain" &&
      match.score >= 60);

  if (match.filtered || lowDataConfidence || deadlineRisk) return "reach";
  if (fallbackCandidate && warnings.length <= 1) return "fallback";
  if ((match.tier === "strong" || match.tier === "good") && !costRisk) {
    return "likely";
  }
  if (match.tier === "partial" && isAffordableEstimate(item.costEstimate, family)) {
    return "likely";
  }
  return "reach";
}

function collectReasons(
  item: SavedProgramStrategyInput,
  family: Family,
  match: MatchResult,
  deadlineSummary: DeadlineSummary,
  bucket: StrategyBucket
): string[] {
  const reasons: string[] = [];

  if (bucket === "fallback") {
    reasons.push("Lower-risk planning role based on current saved-program signals.");
  } else if (bucket === "likely") {
    reasons.push("Good planning fit based on match, cost, and data signals.");
  } else {
    reasons.push("Useful to consider, but it carries at least one planning risk.");
  }

  if (match.filtered && match.filterReason) {
    reasons.push(`Match filter to review: ${match.filterReason}.`);
  } else if (match.tier === "strong" || match.tier === "good") {
    reasons.push(`Match score is ${match.tier} for the current family profile.`);
  } else if (match.tier === "partial") {
    reasons.push("Match score is partial, so compare fit details before prioritizing.");
  }

  if (isPublicProgram(item.program)) {
    reasons.push("Public SFUSD option can anchor the plan if it fits your grade target.");
  } else if (isFreeEstimate(item.costEstimate)) {
    reasons.push("Current cost estimate is likely free.");
  } else if (isAffordableEstimate(item.costEstimate, family)) {
    reasons.push("Estimated family-paid cost appears within the saved budget.");
  } else if (item.costEstimate.estimatedMonthlyHigh == null) {
    reasons.push("Cost is unknown, so this needs direct confirmation.");
  } else if (family.budgetMonthlyMax != null) {
    reasons.push("Estimated family-paid cost may exceed the saved budget.");
  }

  if (deadlineSummary.warning) {
    reasons.push(deadlineSummary.warning);
  } else if (deadlineSummary.daysUntilClose != null) {
    reasons.push(`Application close date is ${deadlineSummary.label}.`);
  }

  if (item.program.dataCompletenessScore < 50) {
    reasons.push("Listing data is incomplete, so verify before relying on it.");
  }

  return reasons.slice(0, 4);
}

function collectWarnings(
  item: SavedProgramStrategyInput,
  family: Family,
  match: MatchResult,
  deadlineSummary: DeadlineSummary
): string[] {
  const warnings: string[] = [];

  if (match.filtered && match.filterReason) {
    warnings.push(`Family profile conflict: ${match.filterReason}.`);
  }
  if (isCostRisk(item, family)) {
    warnings.push("Cost may exceed the saved budget or is too uncertain to rely on.");
  }
  if (item.costEstimate.confidence === "uncertain") {
    warnings.push("Cost confidence is uncertain.");
  }
  if (deadlineSummary.warning) {
    warnings.push(deadlineSummary.warning);
  }
  if (item.program.dataCompletenessScore < 50) {
    warnings.push("Listing has low data completeness.");
  }

  return [...new Set(warnings)];
}

function collectNextActions(
  item: SavedProgramStrategyInput,
  bucket: StrategyBucket,
  deadlineSummary: DeadlineSummary
): string[] {
  const actions: string[] = [];

  if (bucket === "fallback") {
    actions.push("Keep this option current while comparing higher-preference programs.");
  } else if (bucket === "likely") {
    actions.push("Prioritize tour, application steps, and document gathering.");
  } else {
    actions.push("Decide whether the cost, timing, or fit risk is worth the effort.");
  }

  if (deadlineSummary.hasUnknownCloseDate) {
    actions.push("Contact the program or check the official site for application dates.");
  } else {
    actions.push("Confirm the official deadline before submitting materials.");
  }

  if (
    item.costEstimate.confidence === "uncertain" ||
    item.costEstimate.estimatedMonthlyHigh == null
  ) {
    actions.push("Confirm current tuition, subsidy participation, and fees.");
  }

  return actions.slice(0, 3);
}

function detectPlanningGaps(
  savedPrograms: SavedProgramStrategyInput[],
  recommendations: StrategyRecommendation[],
  family: Family,
  deadlines: DashboardDeadline[],
  now: Date
): PlanningGap[] {
  const gaps: PlanningGap[] = [];
  const hasAffordableFallback = recommendations.some((recommendation) => {
    const item = savedPrograms.find((saved) => saved.program.id === recommendation.programId);
    if (!item) return false;
    return (
      recommendation.bucket === "fallback" &&
      (isPublicProgram(item.program) ||
        isFreeEstimate(item.costEstimate) ||
        isAffordableEstimate(item.costEstimate, family))
    );
  });

  if (savedPrograms.length >= 2 && !hasAffordableFallback) {
    gaps.push({
      type: "no-affordable-fallback",
      title: "No affordable fallback yet",
      detail: "Saved programs do not include a clear lower-cost or public anchor option.",
      action: "Add at least one public, free, or budget-aligned program to compare.",
    });
  }

  const collision = findDeadlineCollision(deadlines, now);
  if (collision) {
    gaps.push({
      type: "deadline-collision",
      title: "Deadline collision",
      detail: collision,
      action: "Prepare shared documents early and confirm each official deadline.",
    });
  }

  const lowConfidenceCount = savedPrograms.filter(
    (item) =>
      item.program.dataCompletenessScore < 50 ||
      item.costEstimate.confidence === "uncertain" ||
      item.costEstimate.estimatedMonthlyHigh == null
  ).length;
  if (savedPrograms.length >= 2 && lowConfidenceCount / savedPrograms.length >= 0.5) {
    gaps.push({
      type: "low-confidence-heavy",
      title: "Too many uncertain listings",
      detail: "At least half of the saved programs have low data or uncertain cost signals.",
      action: "Verify costs, deadlines, and availability before making the shortlist final.",
    });
  }

  if (needsPublicOption(family) && !savedPrograms.some((item) => isPublicProgram(item.program))) {
    gaps.push({
      type: "missing-public-option",
      title: "No public TK/K option saved",
      detail: "The active child profile points toward TK, K, or elementary planning.",
      action: "Add an SFUSD TK, K, or elementary option so the plan includes a public path.",
    });
  }

  return gaps;
}

function summarizeDeadline(
  item: SavedProgramStrategyInput,
  deadlines: DashboardDeadline[],
  now: Date
): DeadlineSummary {
  const programDeadlines = deadlines.filter(
    (deadline) => deadline.savedProgramId === item.savedProgramId
  );
  const closeDeadline =
    programDeadlines.find(
      (deadline) => deadline.deadlineType === "application-close" && deadline.date
    ) ??
    programDeadlines.find(
      (deadline) => deadline.deadlineType === "application-open" && deadline.date
    ) ??
    null;

  if (!closeDeadline?.date) {
    return {
      label: "Deadline unknown",
      warning: "Application deadline is unknown.",
      daysUntilClose: null,
      hasUnknownCloseDate: true,
    };
  }

  const daysUntilClose = daysUntilDateOnly(closeDeadline.date, now);
  const dateLabel = formatDateOnly(closeDeadline.date, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (daysUntilClose == null) {
    return {
      label: dateLabel,
      warning: null,
      daysUntilClose: null,
      hasUnknownCloseDate: false,
    };
  }

  if (daysUntilClose < 0) {
    return {
      label: dateLabel,
      warning: "Application deadline may have passed.",
      daysUntilClose,
      hasUnknownCloseDate: false,
    };
  }

  if (daysUntilClose <= 14) {
    return {
      label: dateLabel,
      warning: "Application deadline is coming up soon.",
      daysUntilClose,
      hasUnknownCloseDate: false,
    };
  }

  return {
    label: dateLabel,
    warning: null,
    daysUntilClose,
    hasUnknownCloseDate: false,
  };
}

function findDeadlineCollision(
  deadlines: DashboardDeadline[],
  now: Date
): string | null {
  const closeDeadlines = deadlines
    .filter(
      (deadline) =>
        deadline.deadlineType === "application-close" &&
        deadline.date != null &&
        daysUntilDateOnly(deadline.date, now) != null &&
        daysUntilDateOnly(deadline.date, now)! >= 0
    )
    .sort((a, b) => a.date!.localeCompare(b.date!));

  for (let index = 0; index < closeDeadlines.length; index += 1) {
    const current = closeDeadlines[index];
    const currentDays = daysUntilDateOnly(current.date!, now);
    if (currentDays == null) continue;

    const cluster = closeDeadlines.filter((candidate) => {
      const candidateDays = daysUntilDateOnly(candidate.date!, now);
      return candidateDays != null && candidateDays >= currentDays && candidateDays - currentDays <= 7;
    });

    const uniquePrograms = new Set(cluster.map((deadline) => deadline.programId));
    if (uniquePrograms.size >= 2) {
      const firstDate = formatDateOnly(current.date!, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${uniquePrograms.size} saved programs have close deadlines within seven days of ${firstDate}.`;
    }
  }

  return null;
}

function compareRecommendations(
  left: StrategyRecommendation,
  right: StrategyRecommendation
): number {
  const bucketDiff = BUCKET_ORDER[left.bucket] - BUCKET_ORDER[right.bucket];
  if (bucketDiff !== 0) return bucketDiff;
  if (right.matchScore !== left.matchScore) return right.matchScore - left.matchScore;
  return left.programName.localeCompare(right.programName);
}

function isCostRisk(item: SavedProgramStrategyInput, family: Family): boolean {
  if (item.costEstimate.estimatedMonthlyHigh == null) {
    return item.costEstimate.confidence === "uncertain";
  }
  return (
    family.budgetMonthlyMax != null &&
    item.costEstimate.estimatedMonthlyLow != null &&
    item.costEstimate.estimatedMonthlyLow > family.budgetMonthlyMax
  );
}

function isAffordableEstimate(
  estimate: ProgramCostEstimate,
  family: Family
): boolean {
  if (isFreeEstimate(estimate)) return true;
  if (family.budgetMonthlyMax == null || estimate.estimatedMonthlyHigh == null) {
    return false;
  }
  return estimate.estimatedMonthlyHigh <= family.budgetMonthlyMax;
}

function isFreeEstimate(estimate: ProgramCostEstimate): boolean {
  return (
    estimate.estimatedMonthlyLow === 0 &&
    (estimate.estimatedMonthlyHigh === 0 || estimate.estimatedMonthlyHigh == null)
  );
}

function isPublicProgram(program: ProgramWithDetails): boolean {
  return (
    program.primaryType === "sfusd-prek" ||
    program.primaryType === "sfusd-tk" ||
    program.primaryType === "sfusd-elementary"
  );
}

function needsPublicOption(family: Family): boolean {
  const gradeTarget = family.children[0]?.gradeTarget ?? null;
  return gradeTarget != null && gradeTarget !== "prek";
}
