import type { DataQualityTier } from "@/types/domain";

export type FreshnessState = "fresh" | "stale" | "unknown";

const STALE_AFTER_DAYS = 180;

export function getProgramQualityTier(score: number | null | undefined): DataQualityTier {
  const normalized = Math.max(0, Math.min(100, Math.round(score ?? 0)));
  if (normalized < 30) return "skeletal";
  if (normalized < 50) return "basic";
  if (normalized < 80) return "adequate";
  return "complete";
}

export function getFreshnessState(
  lastVerifiedAt: string | null | undefined,
  now: Date = new Date()
): FreshnessState {
  if (!lastVerifiedAt) return "unknown";

  const verifiedAt = new Date(lastVerifiedAt);
  if (Number.isNaN(verifiedAt.getTime())) return "unknown";

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - STALE_AFTER_DAYS);
  return verifiedAt < cutoff ? "stale" : "fresh";
}

export interface ProgramTrustSummary {
  tier: DataQualityTier;
  freshness: FreshnessState;
  label: string;
  description: string;
  showLimitedInfoBanner: boolean;
}

export function getProgramTrustSummary({
  score,
  lastVerifiedAt,
  now,
}: {
  score: number | null | undefined;
  lastVerifiedAt?: string | null;
  now?: Date;
}): ProgramTrustSummary {
  const tier = getProgramQualityTier(score);
  const freshness = getFreshnessState(lastVerifiedAt, now);

  const copy: Record<DataQualityTier, { label: string; description: string }> = {
    skeletal: {
      label: "Limited information",
      description: "This listing has only basic licensing details. Confirm schedule, cost, and availability directly with the program.",
    },
    basic: {
      label: "Limited information",
      description: "This listing is missing details families usually need, such as schedule, cost, or age coverage.",
    },
    adequate: {
      label: "Adequate information",
      description: "This listing has enough detail for screening, but some fields may still need confirmation.",
    },
    complete: {
      label: "Complete profile",
      description: "This listing has strong coverage across the fields SF School Navigator tracks.",
    },
  };

  return {
    tier,
    freshness,
    label: copy[tier].label,
    description: copy[tier].description,
    showLimitedInfoBanner: tier === "skeletal" || tier === "basic",
  };
}

