import { Badge } from "@/components/ui/badge";
import { formatMonthlyRange, type ProgramCostEstimate } from "@/lib/cost/estimate";

interface CostEstimateSummaryProps {
  estimate: ProgramCostEstimate;
  compact?: boolean;
  className?: string;
}

const CONFIDENCE_LABELS: Record<ProgramCostEstimate["confidence"], string> = {
  confirmed: "Confirmed",
  likely: "Estimate",
  uncertain: "Check details",
};

const CONFIDENCE_COLORS: Record<ProgramCostEstimate["confidence"], "green" | "blue" | "yellow"> = {
  confirmed: "green",
  likely: "blue",
  uncertain: "yellow",
};

export function CostEstimateSummary({
  estimate,
  compact = false,
  className = "",
}: CostEstimateSummaryProps) {
  return (
    <div className={`rounded-md border border-neutral-200 bg-neutral-50 p-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge color={CONFIDENCE_COLORS[estimate.confidence]}>
          {CONFIDENCE_LABELS[estimate.confidence]}
        </Badge>
        <p className="text-sm font-medium text-neutral-900">{estimate.label}</p>
      </div>
      {!compact && (
        <div className="mt-2 space-y-2">
          <dl className="grid gap-2 text-xs text-neutral-600 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-neutral-500">Sticker price</dt>
              <dd>{formatMonthlyRange(estimate.stickerMonthlyLow, estimate.stickerMonthlyHigh)}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-500">Estimated family cost</dt>
              <dd>{formatMonthlyRange(estimate.estimatedMonthlyLow, estimate.estimatedMonthlyHigh)}</dd>
            </div>
          </dl>
          {estimate.caveats.length > 0 && (
            <p className="text-xs leading-relaxed text-neutral-500">
              {estimate.caveats[0]}
            </p>
          )}
          {estimate.officialLinks.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {estimate.officialLinks.slice(0, 2).map((link) => (
                <a
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-brand-700 hover:text-brand-800 hover:underline"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
