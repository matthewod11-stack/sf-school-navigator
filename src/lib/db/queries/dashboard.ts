import { createClient } from "@/lib/supabase/server";
import { daysUntilDateOnly } from "@/lib/dates/date-only";
import type { DeadlineType, SavedProgramStatus } from "@/types/domain";

export interface DashboardDeadline {
  savedProgramId: string;
  programId: string;
  programName: string;
  programSlug: string;
  deadlineType: DeadlineType;
  date: string | null;
  description: string | null;
  reminderLeadDays: number;
  savedStatus: SavedProgramStatus;
}

export async function getSavedProgramDeadlines(
  familyId: string
): Promise<DashboardDeadline[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("saved_programs")
    .select(`
      id,
      program_id,
      status,
      reminder_lead_days,
      programs:program_id(
        id,
        name,
        slug,
        program_deadlines(
          deadline_type,
          date,
          description
        )
      )
    `)
    .eq("family_id", familyId);

  if (error || !data) return [];

  const deadlines: DashboardDeadline[] = [];

  for (const row of data) {
    const program = row.programs as unknown as {
      id: string;
      name: string;
      slug: string;
      program_deadlines: Array<{
        deadline_type: string;
        date: string | null;
        description: string | null;
      }>;
    } | null;

    if (!program) continue;

    if (program.program_deadlines.length === 0) {
      // Program with no deadlines — show placeholder
      deadlines.push({
        savedProgramId: row.id as string,
        programId: program.id,
        programName: program.name,
        programSlug: program.slug,
        deadlineType: "application-close",
        date: null,
        description: null,
        reminderLeadDays: (row.reminder_lead_days as number) ?? 14,
        savedStatus: row.status as SavedProgramStatus,
      });
    } else {
      for (const dl of program.program_deadlines) {
        deadlines.push({
          savedProgramId: row.id as string,
          programId: program.id,
          programName: program.name,
          programSlug: program.slug,
          deadlineType: dl.deadline_type as DeadlineType,
          date: dl.date,
          description: dl.description,
          reminderLeadDays: (row.reminder_lead_days as number) ?? 14,
          savedStatus: row.status as SavedProgramStatus,
        });
      }
    }
  }

  return deadlines;
}

export interface ReminderCandidate {
  familyId: string;
  userEmail: string;
  programName: string;
  programSlug: string;
  deadlineType: DeadlineType;
  deadlineDate: string;
  reminderLeadDays: number;
}

export async function getDueReminders(): Promise<ReminderCandidate[]> {
  const supabase = await createClient();

  // Get saved programs where reminder_lead_days > 0 and deadlines are upcoming
  const { data, error } = await supabase
    .from("saved_programs")
    .select(`
      id,
      family_id,
      reminder_lead_days,
      families:family_id(
        user_id,
        users:user_id(email)
      ),
      programs:program_id(
        name,
        slug,
        program_deadlines(
          deadline_type,
          date
        )
      )
    `)
    .gt("reminder_lead_days", 0);

  if (error || !data) return [];

  const today = new Date();

  const candidates: ReminderCandidate[] = [];

  for (const row of data) {
    const leadDays = (row.reminder_lead_days as number) ?? 14;
    const family = row.families as unknown as {
      user_id: string;
      users: { email: string } | null;
    } | null;
    const program = row.programs as unknown as {
      name: string;
      slug: string;
      program_deadlines: Array<{
        deadline_type: string;
        date: string | null;
      }>;
    } | null;

    if (!family?.users?.email || !program) continue;

    for (const dl of program.program_deadlines) {
      if (!dl.date) continue;

      const daysUntil = daysUntilDateOnly(dl.date, today);
      if (daysUntil == null) continue;

      // Send reminder exactly on the lead day
      if (daysUntil === leadDays) {
        candidates.push({
          familyId: row.family_id as string,
          userEmail: family.users.email,
          programName: program.name,
          programSlug: program.slug,
          deadlineType: dl.deadline_type as DeadlineType,
          deadlineDate: dl.date,
          reminderLeadDays: leadDays,
        });
      }
    }
  }

  return candidates;
}
