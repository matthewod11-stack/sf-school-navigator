import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EducationTooltip } from "@/components/education/education-tooltip";
import { SEARCH_PROFILE_EDUCATION } from "@/lib/content/education";
import type { ProgramCost, ProgramSchedule } from "@/types/domain";

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

interface CostSectionProps {
  costs: ProgramCost[];
  schedules: ProgramSchedule[];
}

export function CostSection({ costs, schedules }: CostSectionProps) {
  const hasCostData = costs.length > 0 || schedules.some((s) => s.monthlyCostLow != null);

  if (!hasCostData) {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold text-neutral-900">Cost</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 italic">
            Not yet verified — contact the program directly for current tuition information.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-serif text-lg font-semibold text-neutral-900">Cost</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {costs.map((cost) => (
            <div key={cost.id} className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
              <p className="text-xs font-medium uppercase text-neutral-400">
                {cost.schoolYear}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-700">
                {(cost.tuitionMonthlyLow != null || cost.tuitionMonthlyHigh != null) && (
                  <span>
                    Tuition:{" "}
                    {cost.tuitionMonthlyLow != null && cost.tuitionMonthlyHigh != null
                      ? cost.tuitionMonthlyLow === cost.tuitionMonthlyHigh
                        ? `${formatCurrency(cost.tuitionMonthlyLow)}/mo`
                        : `${formatCurrency(cost.tuitionMonthlyLow)}-${formatCurrency(cost.tuitionMonthlyHigh)}/mo`
                      : cost.tuitionMonthlyLow != null
                        ? `From ${formatCurrency(cost.tuitionMonthlyLow)}/mo`
                        : `Up to ${formatCurrency(cost.tuitionMonthlyHigh!)}/mo`}
                  </span>
                )}
                {cost.registrationFee != null && (
                  <span>Registration fee: {formatCurrency(cost.registrationFee)}</span>
                )}
                {cost.deposit != null && (
                  <span>Deposit: {formatCurrency(cost.deposit)}</span>
                )}
              </div>
              <div className="mt-1 flex gap-4 text-xs text-neutral-500">
                {cost.acceptsSubsidies && (
                  <EducationTooltip
                    label="What accepting subsidies means"
                    description={SEARCH_PROFILE_EDUCATION.subsidy}
                  >
                    <span className="underline decoration-dotted underline-offset-2">
                      Accepts subsidies
                    </span>
                  </EducationTooltip>
                )}
                {cost.financialAidAvailable && <span>Financial aid available</span>}
              </div>
            </div>
          ))}

          {/* Fallback: schedule-based costs when no program_costs rows */}
          {costs.length === 0 &&
            schedules
              .filter((s) => s.monthlyCostLow != null || s.monthlyCostHigh != null)
              .map((s) => (
                <div key={s.id} className="text-sm text-neutral-700">
                  <span className="capitalize">
                    {s.scheduleType.replace(/-/g, " ")}
                  </span>
                  :{" "}
                  {s.monthlyCostLow != null && s.monthlyCostHigh != null
                    ? s.monthlyCostLow === s.monthlyCostHigh
                      ? `${formatCurrency(s.monthlyCostLow)}/mo`
                      : `${formatCurrency(s.monthlyCostLow)}-${formatCurrency(s.monthlyCostHigh)}/mo`
                    : s.monthlyCostLow != null
                      ? `From ${formatCurrency(s.monthlyCostLow)}/mo`
                      : `Up to ${formatCurrency(s.monthlyCostHigh!)}/mo`}
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
