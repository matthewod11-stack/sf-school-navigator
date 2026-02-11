import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { ProgramDeadline } from "@/types/domain";

const DEADLINE_LABELS: Record<string, string> = {
  "application-open": "Applications Open",
  "application-close": "Applications Close",
  notification: "Notification Date",
  waitlist: "Waitlist Update",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface ApplicationSectionProps {
  deadlines: ProgramDeadline[];
  website: string | null;
}

export function ApplicationSection({ deadlines, website }: ApplicationSectionProps) {
  if (deadlines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-neutral-900">Application</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 italic">
            No deadline information available yet.
          </p>
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-brand-600 hover:underline"
            >
              Check program website for enrollment info
            </a>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-neutral-900">Application</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deadlines.map((deadline) => (
            <div
              key={deadline.id}
              className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-neutral-900">
                  {DEADLINE_LABELS[deadline.deadlineType] ?? deadline.deadlineType}
                </p>
                <span className="text-xs text-neutral-400">{deadline.schoolYear}</span>
              </div>
              {deadline.date ? (
                <p className="mt-0.5 text-sm text-neutral-700">
                  {formatDate(deadline.date)}
                </p>
              ) : deadline.genericDeadlineEstimate ? (
                <p className="mt-0.5 text-sm text-neutral-500 italic">
                  Estimated: {deadline.genericDeadlineEstimate}
                </p>
              ) : null}
              {deadline.description && (
                <p className="mt-1 text-xs text-neutral-500">{deadline.description}</p>
              )}
              {deadline.sourceUrl && (
                <a
                  href={deadline.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-brand-600 hover:underline"
                >
                  Source
                </a>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
