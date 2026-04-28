import { getProgramTrustSummary } from "@/lib/trust/program-quality";

interface QualityBannerProps {
  score: number;
  lastVerifiedAt?: string | null;
  compact?: boolean;
  className?: string;
}

export function QualityBanner({
  score,
  lastVerifiedAt = null,
  compact = false,
  className = "",
}: QualityBannerProps) {
  const summary = getProgramTrustSummary({ score, lastVerifiedAt });

  if (!summary.showLimitedInfoBanner) return null;

  return (
    <div
      className={`rounded-md border border-amber-200 bg-amber-50 text-amber-900 ${
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
      } ${className}`}
      role="note"
    >
      <p className="font-semibold">{summary.label}</p>
      {!compact && <p className="mt-1 text-amber-800">{summary.description}</p>}
    </div>
  );
}
