import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { ProgramSchedule } from "@/types/domain";

const SCHEDULE_LABELS: Record<string, string> = {
  "full-day": "Full Day",
  "half-day-am": "Half Day (AM)",
  "half-day-pm": "Half Day (PM)",
  "extended-day": "Extended Day",
};

function formatTime(raw: string | null): string | null {
  if (!raw) return null;
  const [hoursRaw, minutesRaw] = raw.split(":");
  const hoursNum = Number(hoursRaw);
  const minutesNum = Number(minutesRaw);
  if (!Number.isFinite(hoursNum) || !Number.isFinite(minutesNum)) return null;
  const suffix = hoursNum >= 12 ? "pm" : "am";
  const normalizedHour = hoursNum % 12 === 0 ? 12 : hoursNum % 12;
  return `${normalizedHour}:${String(minutesNum).padStart(2, "0")}${suffix}`;
}

interface ScheduleSectionProps {
  schedules: ProgramSchedule[];
}

export function ScheduleSection({ schedules }: ScheduleSectionProps) {
  if (schedules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-neutral-900">Schedule</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 italic">
            Not yet verified — contact the program for schedule details.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-neutral-900">Schedule</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const start = formatTime(schedule.openTime);
            const end = formatTime(schedule.closeTime);
            return (
              <div
                key={schedule.id}
                className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
              >
                <p className="font-medium text-sm text-neutral-900">
                  {SCHEDULE_LABELS[schedule.scheduleType] ?? schedule.scheduleType}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600">
                  {start && end && <span>{start} - {end}</span>}
                  {schedule.daysPerWeek != null && (
                    <span>{schedule.daysPerWeek} days/week</span>
                  )}
                  <span className="capitalize">{schedule.operates.replace(/-/g, " ")}</span>
                </div>
                <div className="mt-1 flex gap-4 text-xs text-neutral-500">
                  {schedule.extendedCareAvailable && <span>Extended care available</span>}
                  {schedule.summerProgram && <span>Summer program</span>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
