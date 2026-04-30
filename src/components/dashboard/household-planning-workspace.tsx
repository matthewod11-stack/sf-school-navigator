import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ApplicationStrategyPanel } from "@/components/dashboard/application-strategy-panel";
import { DeadlineTimeline } from "@/components/dashboard/deadline-timeline";
import { HouseholdCompareSummary } from "@/components/dashboard/household-compare-summary";
import { ReminderSettings } from "@/components/dashboard/reminder-settings";
import { SavedProgramsList, type SavedProgramItem } from "@/components/dashboard/saved-programs-list";
import { COST_ESTIMATE_BAND_LABELS } from "@/lib/cost/estimate";
import type { ApplicationStrategyPlan } from "@/lib/planning/application-strategy";
import type { HouseholdPlan } from "@/lib/planning/household-plan";
import type { DashboardDeadline } from "@/lib/db/queries/dashboard";
import type { ChildProfile, CostEstimateBand } from "@/types/domain";

interface ReminderProgram {
  savedProgramId: string;
  name: string;
  leadDays: number;
}

interface HouseholdPlanningWorkspaceProps {
  childrenProfiles: ChildProfile[];
  costEstimateBand: CostEstimateBand;
  householdPlan: HouseholdPlan;
  applicationStrategy: ApplicationStrategyPlan | null;
  deadlines: DashboardDeadline[];
  reminderPrograms: ReminderProgram[];
  savedPrograms: SavedProgramItem[];
}

export function HouseholdPlanningWorkspace({
  childrenProfiles,
  costEstimateBand,
  householdPlan,
  applicationStrategy,
  deadlines,
  reminderPrograms,
  savedPrograms,
}: HouseholdPlanningWorkspaceProps) {
  const compareCandidates = householdPlan.children
    .flatMap((childPlan) => childPlan.active)
    .map((program) => ({
      id: program.programId,
      name: program.programName,
      slug: program.programSlug,
    }))
    .filter(
      (candidate, index, all) =>
        all.findIndex((item) => item.id === candidate.id) === index
    )
    .slice(0, 4);

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-neutral-900">
              Household Plan
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-neutral-500">
              {householdPlan.summary.shareSummary}
            </p>
          </div>
          <Badge color="gray">
            {COST_ESTIMATE_BAND_LABELS[costEstimateBand]}
          </Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryMetric label="Active" value={householdPlan.summary.activeCount} />
          <SummaryMetric label="Backups" value={householdPlan.summary.backupCount} />
          <SummaryMetric label="Inactive" value={householdPlan.summary.inactiveCount} />
          <SummaryMetric
            label="Dated deadlines"
            value={householdPlan.summary.upcomingDeadlineCount}
          />
          <div className="rounded-md border border-neutral-200 p-3 sm:col-span-2 lg:col-span-1">
            <p className="text-xs text-neutral-500">Cost span</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {householdPlan.summary.activeCostLabel}
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-neutral-500">
          Household summary is only shown inside this signed-in dashboard. No share link
          or public page is generated.
        </p>
      </section>

      <HouseholdCompareSummary candidates={compareCandidates} />

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-semibold text-neutral-900">
              Children
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Each child gets a simple view of active contenders, backups, cost, and next actions.
            </p>
          </div>
          <Link
            href="#saved-program-plan"
            className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
          >
            Edit plan details
          </Link>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {householdPlan.children.map((childPlan) => (
            <article
              key={childPlan.child.id}
              className="rounded-lg border border-neutral-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-neutral-900">
                    {childPlan.child.label}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {childPlan.costLabel}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge color="green">F {childPlan.strategyCounts.fallback}</Badge>
                  <Badge color="blue">L {childPlan.strategyCounts.likely}</Badge>
                  <Badge color="yellow">R {childPlan.strategyCounts.reach}</Badge>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ProgramGroup title="Active" programs={childPlan.active} />
                <ProgramGroup title="Backups" programs={childPlan.backups} />
                <ProgramGroup title="Inactive" programs={childPlan.inactive} />
              </div>

              <div className="mt-4 rounded-md bg-neutral-50 p-3">
                <p className="text-sm font-semibold text-neutral-900">Next actions</p>
                <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                  {childPlan.nextActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      {applicationStrategy && <ApplicationStrategyPanel plan={applicationStrategy} />}

      <section>
        <h2 className="font-serif text-lg font-semibold text-neutral-900">
          Upcoming Deadlines
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Deadlines from your saved programs, sorted by date.
        </p>
        <div className="mt-4">
          <DeadlineTimeline deadlines={deadlines} />
        </div>
      </section>

      {reminderPrograms.length > 0 && (
        <section>
          <h2 className="font-serif text-lg font-semibold text-neutral-900">
            Email Reminders
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Set how far in advance you want deadline reminders for each program.
          </p>
          <div className="mt-3 space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
            {reminderPrograms.map((program) => (
              <ReminderSettings
                key={program.savedProgramId}
                savedProgramId={program.savedProgramId}
                programName={program.name}
                initialLeadDays={program.leadDays}
              />
            ))}
          </div>
        </section>
      )}

      <section id="saved-program-plan" className="scroll-mt-24">
        <h2 className="font-serif text-lg font-semibold text-neutral-900">
          Saved Program Plan
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Update program status, planning role, child assignment, tasks, and notes.
        </p>
        <div className="mt-4">
          <SavedProgramsList
            initialPrograms={savedPrograms}
            childrenProfiles={childrenProfiles}
          />
        </div>
      </section>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-neutral-200 p-3">
      <p className="text-2xl font-semibold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function ProgramGroup({
  title,
  programs,
}: {
  title: string;
  programs: Array<{ savedProgramId: string; programName: string; programSlug: string }>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-neutral-500">
        {title}
      </p>
      {programs.length === 0 ? (
        <p className="mt-2 text-xs text-neutral-400">None yet</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {programs.map((program) => (
            <li key={program.savedProgramId}>
              <Link
                href={`/programs/${program.programSlug}`}
                className="text-neutral-800 hover:text-brand-700 hover:underline"
              >
                {program.programName}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
