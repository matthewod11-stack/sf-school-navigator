const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseDateOnly(dateString: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(dateString);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(year, monthIndex, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== monthIndex ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function formatDateOnly(
  dateString: string,
  options: Intl.DateTimeFormatOptions,
  locale = "en-US"
): string {
  const parsed = parseDateOnly(dateString);
  if (!parsed) return dateString;
  return parsed.toLocaleDateString(locale, options);
}

export function daysUntilDateOnly(
  dateString: string,
  now: Date = new Date()
): number | null {
  const target = parseDateOnly(dateString);
  if (!target) return null;

  const targetDay = startOfLocalDay(target).getTime();
  const currentDay = startOfLocalDay(now).getTime();
  return Math.round((targetDay - currentDay) / MS_PER_DAY);
}
