import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type {
  ApplicationStrategyPlan,
  StrategyBucket,
} from "@/lib/planning/application-strategy";

interface ApplicationStrategyPanelProps {
  plan: ApplicationStrategyPlan;
}

const BUCKET_LABELS: Record<StrategyBucket, string> = {
  fallback: "Fallback",
  likely: "Likely",
  reach: "Reach",
};

const BUCKET_DESCRIPTIONS: Record<StrategyBucket, string> = {
  fallback: "Lower-risk anchors such as public, free, or budget-aligned options.",
  likely: "Good planning fits without a major cost, deadline, or data warning.",
  reach: "Worth considering, but review the cost, timing, fit, or data risk first.",
};

const BUCKET_COLORS: Record<StrategyBucket, "green" | "blue" | "yellow"> = {
  fallback: "green",
  likely: "blue",
  reach: "yellow",
};

const BUCKET_ORDER: StrategyBucket[] = ["fallback", "likely", "reach"];

export function ApplicationStrategyPanel({ plan }: ApplicationStrategyPanelProps) {
  if (plan.summary.totalSaved < 2) {
    return (
      <section
        className="rounded-lg border border-neutral-200 bg-white p-6"
        aria-labelledby="application-strategy-heading"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2
              id="application-strategy-heading"
              className="font-serif text-lg font-semibold text-neutral-900"
            >
              Application Strategy
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Save at least two programs to see reach, likely, and fallback planning roles.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Browse Programs
          </Link>
        </div>
        <p className="mt-4 text-xs text-neutral-500">
          These roles are planning support only, not placement guarantees.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-white p-6"
      aria-labelledby="application-strategy-heading"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2
            id="application-strategy-heading"
            className="font-serif text-lg font-semibold text-neutral-900"
          >
            Application Strategy
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            A decision-support view of your saved programs using match, cost, deadline,
            public-program, and data-quality signals.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <CountPill label="Fallback" count={plan.summary.fallbackCount} />
          <CountPill label="Likely" count={plan.summary.likelyCount} />
          <CountPill label="Reach" count={plan.summary.reachCount} />
        </div>
      </div>

      {plan.gaps.length > 0 && (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Planning gaps to close</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {plan.gaps.map((gap) => (
              <div key={gap.type}>
                <p className="text-sm font-medium text-amber-950">{gap.title}</p>
                <p className="mt-1 text-xs text-amber-900">{gap.detail}</p>
                <p className="mt-1 text-xs font-medium text-amber-950">{gap.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {BUCKET_ORDER.map((bucket) => (
          <div key={bucket}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  {BUCKET_LABELS[bucket]}
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  {BUCKET_DESCRIPTIONS[bucket]}
                </p>
              </div>
              <Badge color={BUCKET_COLORS[bucket]}>
                {plan.buckets[bucket].length}
              </Badge>
            </div>

            <div className="mt-3 space-y-3">
              {plan.buckets[bucket].length === 0 ? (
                <p className="rounded-md border border-dashed border-neutral-200 p-3 text-xs text-neutral-500">
                  No saved programs currently land here.
                </p>
              ) : (
                plan.buckets[bucket].map((recommendation) => (
                  <article
                    key={recommendation.savedProgramId}
                    className="rounded-md border border-neutral-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/programs/${recommendation.programSlug}`}
                        className="text-sm font-semibold text-neutral-900 hover:text-brand-700 hover:underline"
                      >
                        {recommendation.programName}
                      </Link>
                      <span className="shrink-0 text-xs text-neutral-400">
                        #{recommendation.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {recommendation.costLabel} | {recommendation.deadlineLabel}
                    </p>

                    <ul className="mt-3 space-y-1 text-xs text-neutral-600">
                      {recommendation.reasons.slice(0, 2).map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>

                    {recommendation.warnings.length > 0 && (
                      <p className="mt-3 rounded bg-neutral-50 p-2 text-xs text-neutral-700">
                        {recommendation.warnings[0]}
                      </p>
                    )}

                    <p className="mt-3 text-xs font-medium text-neutral-900">
                      {recommendation.nextActions[0]}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 border-t border-neutral-200 pt-4 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Common checklist</p>
          <ul className="mt-2 space-y-1 text-xs text-neutral-600">
            {plan.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">Important caveats</p>
          <ul className="mt-2 space-y-1 text-xs text-neutral-600">
            {plan.caveats.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function CountPill({ label, count }: { label: string; count: number }) {
  return (
    <div className="min-w-20 rounded-md border border-neutral-200 px-3 py-2">
      <p className="text-lg font-semibold text-neutral-900">{count}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
