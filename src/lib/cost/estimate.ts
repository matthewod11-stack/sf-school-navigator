import type {
  ChildProfile,
  CostEstimateBand,
  CostEstimateConfidence,
  Family,
  ProgramWithDetails,
} from "@/types/domain";

export interface OfficialCostLink {
  label: string;
  href: string;
}

export interface ProgramCostEstimate {
  band: CostEstimateBand;
  stickerMonthlyLow: number | null;
  stickerMonthlyHigh: number | null;
  estimatedMonthlyLow: number | null;
  estimatedMonthlyHigh: number | null;
  label: string;
  confidence: CostEstimateConfidence;
  caveats: string[];
  officialLinks: OfficialCostLink[];
}

export const DEFAULT_COST_ESTIMATE_BAND: CostEstimateBand = "unknown";

export const COST_ESTIMATE_BAND_LABELS: Record<CostEstimateBand, string> = {
  unknown: "Not sure yet",
  "sticker-only": "Show sticker price only",
  "elfa-free-0-110-ami": "ELFA free tuition band",
  "elfa-full-credit-111-150-ami": "ELFA full credit band",
  "elfa-half-credit-151-200-ami": "ELFA half credit band",
  "not-eligible-over-200-ami": "Likely private-pay",
};

export const COST_ESTIMATE_BAND_HELP: Record<CostEstimateBand, string> = {
  unknown: "Use program price and subsidy availability without estimating eligibility.",
  "sticker-only": "Do not estimate aid; show only published or verified tuition.",
  "elfa-free-0-110-ami": "For families who believe they may qualify for ELFA Free Tuition.",
  "elfa-full-credit-111-150-ami": "For families who believe they may qualify for DEC's full tuition credit.",
  "elfa-half-credit-151-200-ami": "For families planning around the half tuition credit effective July 1, 2026.",
  "not-eligible-over-200-ami": "Use private-pay cost while still showing program aid signals.",
};

export const OFFICIAL_COST_LINKS: OfficialCostLink[] = [
  {
    label: "DEC Early Learning For All",
    href: "https://www.sf.gov/early-learning-for-all",
  },
  {
    label: "FY25-26 ELFA rates",
    href: "https://media.api.sf.gov/documents/ELFA-Center-FCC-Rates-FY25-26.pdf",
  },
];

const ELFA_FULL_TIME_MONTHLY_RATES = {
  infant: 3027,
  toddler: 2306,
  preschool: 2115,
} as const;

const ELFA_HALF_CREDIT_MONTHLY_RATES = {
  infant: 1514,
  toddler: 1153,
  preschool: 1058,
} as const;

type ElfaAgeGroup = keyof typeof ELFA_FULL_TIME_MONTHLY_RATES;

export function normalizeCostEstimateBand(value: unknown): CostEstimateBand {
  if (
    value === "unknown" ||
    value === "sticker-only" ||
    value === "elfa-free-0-110-ami" ||
    value === "elfa-full-credit-111-150-ami" ||
    value === "elfa-half-credit-151-200-ami" ||
    value === "not-eligible-over-200-ami"
  ) {
    return value;
  }
  return DEFAULT_COST_ESTIMATE_BAND;
}

export function getStickerMonthlyRange(program: ProgramWithDetails): {
  low: number | null;
  high: number | null;
} {
  const lows = [
    ...program.costs.map((cost) => cost.tuitionMonthlyLow),
    ...program.schedules.map((schedule) => schedule.monthlyCostLow),
  ].filter((value): value is number => value != null);
  const highs = [
    ...program.costs.map((cost) => cost.tuitionMonthlyHigh),
    ...program.schedules.map((schedule) => schedule.monthlyCostHigh),
  ].filter((value): value is number => value != null);

  const low = lows.length > 0 ? Math.min(...lows) : null;
  const high = highs.length > 0 ? Math.max(...highs) : low;
  return { low, high };
}

export function estimateProgramCost(
  program: ProgramWithDetails,
  band: CostEstimateBand,
  child?: ChildProfile | null
): ProgramCostEstimate {
  const sticker = getStickerMonthlyRange(program);
  const officialLinks = getOfficialLinks(program);

  if (isPublicFreeProgram(program)) {
    return {
      band,
      stickerMonthlyLow: 0,
      stickerMonthlyHigh: 0,
      estimatedMonthlyLow: 0,
      estimatedMonthlyHigh: 0,
      label: "Likely free",
      confidence: "confirmed",
      caveats: ["Public SFUSD TK, K, and elementary programs are modeled as tuition-free."],
      officialLinks,
    };
  }

  const base: Omit<ProgramCostEstimate, "label" | "confidence" | "caveats"> = {
    band,
    stickerMonthlyLow: sticker.low,
    stickerMonthlyHigh: sticker.high,
    estimatedMonthlyLow: sticker.low,
    estimatedMonthlyHigh: sticker.high,
    officialLinks,
  };

  if (sticker.low == null && sticker.high == null) {
    return {
      ...base,
      estimatedMonthlyLow: null,
      estimatedMonthlyHigh: null,
      label: "Cost unknown",
      confidence: "uncertain",
      caveats: ["No verified tuition range is available yet; contact the program for current pricing."],
    };
  }

  if (band === "unknown" || band === "sticker-only") {
    return {
      ...base,
      label: formatStickerLabel(sticker.low, sticker.high),
      confidence: sticker.low === 0 && sticker.high === 0 ? "confirmed" : "likely",
      caveats:
        band === "sticker-only"
          ? ["Showing published tuition only; subsidy eligibility is not estimated."]
          : ["Choose a broad cost band to estimate family-paid cost after ELFA credits."],
    };
  }

  if (band === "not-eligible-over-200-ami") {
    return {
      ...base,
      label: formatStickerLabel(sticker.low, sticker.high),
      confidence: "likely",
      caveats: ["Modeled as private-pay based on the selected cost band."],
    };
  }

  const elfaParticipating = isElfaParticipating(program);
  if (!elfaParticipating) {
    return {
      ...base,
      label: formatStickerLabel(sticker.low, sticker.high),
      confidence: "uncertain",
      caveats: [
        "ELFA participation is not verified for this program, so the planner shows sticker price.",
      ],
    };
  }

  if (band === "elfa-free-0-110-ami") {
    return {
      ...base,
      estimatedMonthlyLow: 0,
      estimatedMonthlyHigh: 0,
      label: "Likely free",
      confidence: "likely",
      caveats: [
        "This is an estimate for families who may qualify for ELFA Free Tuition; official eligibility and availability must be confirmed through DEC or its partners.",
      ],
    };
  }

  const ageGroup = getElfaAgeGroup(child, program);
  const credit =
    band === "elfa-half-credit-151-200-ami"
      ? ELFA_HALF_CREDIT_MONTHLY_RATES[ageGroup]
      : ELFA_FULL_TIME_MONTHLY_RATES[ageGroup];
  const estimatedLow = sticker.low == null ? null : Math.max(0, sticker.low - credit);
  const estimatedHigh = sticker.high == null ? estimatedLow : Math.max(0, sticker.high - credit);

  return {
    ...base,
    estimatedMonthlyLow: estimatedLow,
    estimatedMonthlyHigh: estimatedHigh,
    label: formatEstimatedLabel(estimatedLow, estimatedHigh),
    confidence: "likely",
    caveats: [
      band === "elfa-half-credit-151-200-ami"
        ? "Half tuition credit rates are marked effective July 1, 2026 in DEC materials."
        : "Full tuition credit estimates subtract DEC's full-time ELFA reimbursement rate from the published tuition range.",
      "Final family cost can vary by schedule, fees, provider policy, funding availability, and official eligibility review.",
    ],
  };
}

export function estimateProgramCostForFamily(
  program: ProgramWithDetails,
  family: Family | null
): ProgramCostEstimate {
  const child = family?.children[0] ?? null;
  return estimateProgramCost(
    program,
    family?.costEstimateBand ?? DEFAULT_COST_ESTIMATE_BAND,
    child
  );
}

function getOfficialLinks(program: ProgramWithDetails): OfficialCostLink[] {
  const elfaLinks = program.costs
    .map((cost) => cost.elfaSourceUrl)
    .filter((href): href is string => Boolean(href));
  const uniqueElfaLinks = [...new Set(elfaLinks)].map((href) => ({
    label: "ELFA program source",
    href,
  }));
  return [...uniqueElfaLinks, ...OFFICIAL_COST_LINKS];
}

function isPublicFreeProgram(program: ProgramWithDetails): boolean {
  return (
    program.primaryType === "sfusd-tk" ||
    program.primaryType === "sfusd-elementary" ||
    (program.primaryType === "sfusd-prek" &&
      program.costs.some(
        (cost) => cost.tuitionMonthlyLow === 0 && cost.tuitionMonthlyHigh === 0
      ))
  );
}

function isElfaParticipating(program: ProgramWithDetails): boolean {
  return program.costs.some((cost) => cost.elfaParticipating === true);
}

function getElfaAgeGroup(
  child: ChildProfile | null | undefined,
  program: ProgramWithDetails
): ElfaAgeGroup {
  const ageMonths = child?.ageMonths ?? program.ageMinMonths ?? null;
  if (ageMonths != null) {
    if (ageMonths < 18) return "infant";
    if (ageMonths < 36) return "toddler";
  }
  return "preschool";
}

function formatStickerLabel(low: number | null, high: number | null): string {
  if (low === 0 && (high === 0 || high == null)) return "Likely free";
  if (low == null && high == null) return "Cost unknown";
  return `Sticker ${formatMonthlyRange(low, high)}`;
}

function formatEstimatedLabel(low: number | null, high: number | null): string {
  if (low == null && high == null) return "Estimated cost unknown";
  if (low === 0 && (high === 0 || high == null)) return "Likely free";
  if (low === 0 && high != null && high > 0) return `Estimated $0-${formatCurrency(high)}/mo`;
  return `Estimated ${formatMonthlyRange(low, high)}`;
}

export function formatMonthlyRange(low: number | null, high: number | null): string {
  if (low == null && high == null) return "unknown";
  const safeLow = low ?? high ?? 0;
  const safeHigh = high ?? low ?? 0;
  if (safeLow === safeHigh) return `${formatCurrency(safeLow)}/mo`;
  return `${formatCurrency(safeLow)}-${formatCurrency(safeHigh)}/mo`;
}

function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}
