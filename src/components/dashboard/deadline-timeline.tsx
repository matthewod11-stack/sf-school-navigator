import { DeadlineCard } from "./deadline-card";
import { parseDateOnly } from "@/lib/dates/date-only";
import type { DashboardDeadline } from "@/lib/db/queries/dashboard";

interface DeadlineTimelineProps {
  deadlines: DashboardDeadline[];
}

export function DeadlineTimeline({ deadlines }: DeadlineTimelineProps) {
  if (deadlines.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center">
        <p className="font-medium text-neutral-900">No deadlines to show</p>
        <p className="mt-1 text-sm text-neutral-500">
          Save programs to see their upcoming deadlines here.
        </p>
      </div>
    );
  }

  // Separate deadlines with and without dates
  const withDates = deadlines.filter((d) => d.date !== null);
  const withoutDates = deadlines.filter((d) => d.date === null);

  // Sort deadlines with dates chronologically
  const sorted = [...withDates].sort((a, b) => {
    const da = parseDateOnly(a.date!);
    const db = parseDateOnly(b.date!);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });

  // Append unknown-date items at end
  const ordered = [...sorted, ...withoutDates];

  return (
    <div className="relative">
      <div role="list" className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {ordered.map((d, i) => (
          <div role="listitem" key={`${d.savedProgramId}-${d.deadlineType}-${i}`}>
          <DeadlineCard
            programName={d.programName}
            programSlug={d.programSlug}
            deadlineType={d.deadlineType}
            date={d.date}
          />
          </div>
        ))}
      </div>
    </div>
  );
}
