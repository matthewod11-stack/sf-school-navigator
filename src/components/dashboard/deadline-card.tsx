import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { DeadlineType } from "@/types/domain";

const DEADLINE_TYPE_LABELS: Record<DeadlineType, string> = {
  "application-open": "App Opens",
  "application-close": "App Deadline",
  notification: "Notification",
  waitlist: "Waitlist",
};

type UrgencyColor = "green" | "yellow" | "red" | "gray";

function getUrgency(date: string | null): {
  daysRemaining: number | null;
  color: UrgencyColor;
  label: string;
} {
  if (!date) {
    return { daysRemaining: null, color: "gray", label: "Date unknown" };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadline = new Date(date);
  deadline.setHours(0, 0, 0, 0);
  const days = Math.ceil(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days < 0) {
    return { daysRemaining: days, color: "gray", label: "Passed" };
  }
  if (days === 0) {
    return { daysRemaining: 0, color: "red", label: "Today" };
  }
  if (days < 7) {
    return {
      daysRemaining: days,
      color: "red",
      label: `${days} day${days === 1 ? "" : "s"}`,
    };
  }
  if (days <= 30) {
    return { daysRemaining: days, color: "yellow", label: `${days} days` };
  }
  return { daysRemaining: days, color: "green", label: `${days} days` };
}

const urgencyBarColors: Record<UrgencyColor, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  gray: "bg-neutral-300",
};

interface DeadlineCardProps {
  programName: string;
  programSlug: string;
  deadlineType: DeadlineType;
  date: string | null;
}

export function DeadlineCard({
  programName,
  programSlug,
  deadlineType,
  date,
}: DeadlineCardProps) {
  const urgency = getUrgency(date);

  return (
    <div className="relative min-w-[200px] flex-shrink-0 rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className={`h-1 ${urgencyBarColors[urgency.color]}`} />
      <div className="p-3">
        <Link
          href={`/programs/${programSlug}`}
          className="block text-sm font-semibold text-neutral-900 hover:text-brand-600 hover:underline truncate"
          title={programName}
        >
          {programName}
        </Link>
        <p className="mt-1 text-xs text-neutral-500">
          {DEADLINE_TYPE_LABELS[deadlineType]}
        </p>
        {date ? (
          <>
            <p className="mt-1 text-sm font-medium text-neutral-800">
              {new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <div className="mt-2">
              <Badge color={urgency.color}>{urgency.label}</Badge>
            </div>
          </>
        ) : (
          <p className="mt-2 text-xs italic text-neutral-400">
            Contact program for dates
          </p>
        )}
      </div>
    </div>
  );
}

export { getUrgency, type UrgencyColor };
