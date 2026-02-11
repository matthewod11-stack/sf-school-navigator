import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SavedProgramsList } from "@/components/dashboard/saved-programs-list";
import { DeadlineTimeline } from "@/components/dashboard/deadline-timeline";
import { ReminderSettings } from "@/components/dashboard/reminder-settings";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getSavedProgramDeadlines } from "@/lib/db/queries/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/search");
  }

  // Get family
  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // Get saved programs
  let savedPrograms: Array<{
    id: string;
    programId: string;
    status: string;
    notes: string | null;
    createdAt: string;
    program: {
      id: string;
      name: string;
      slug: string;
      address: string | null;
      primaryType: string;
    } | null;
  }> = [];

  let deadlines: Awaited<ReturnType<typeof getSavedProgramDeadlines>> = [];

  if (family) {
    const { data } = await supabase
      .from("saved_programs")
      .select(`
        id,
        program_id,
        status,
        notes,
        reminder_lead_days,
        created_at,
        programs:program_id(
          id,
          name,
          slug,
          address,
          primary_type
        )
      `)
      .eq("family_id", family.id)
      .order("created_at", { ascending: false });

    savedPrograms = (data ?? []).map((row) => {
      const program = row.programs as unknown as Record<string, unknown> | null;
      return {
        id: row.id as string,
        programId: row.program_id as string,
        status: row.status as string,
        notes: (row.notes as string) ?? null,
        createdAt: row.created_at as string,
        program: program
          ? {
              id: program.id as string,
              name: program.name as string,
              slug: program.slug as string,
              address: (program.address as string) ?? null,
              primaryType: program.primary_type as string,
            }
          : null,
      };
    });

    deadlines = await getSavedProgramDeadlines(family.id);
  }

  // Build unique programs for reminder settings
  const uniquePrograms = new Map<
    string,
    { savedProgramId: string; name: string; leadDays: number }
  >();
  if (family) {
    const rows = (
      await supabase
        .from("saved_programs")
        .select("id, reminder_lead_days, programs:program_id(name)")
        .eq("family_id", family.id)
    ).data;

    for (const row of rows ?? []) {
      const prog = row.programs as unknown as { name: string } | null;
      if (prog) {
        uniquePrograms.set(row.id as string, {
          savedProgramId: row.id as string,
          name: prog.name,
          leadDays: (row.reminder_lead_days as number) ?? 14,
        });
      }
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      {/* Deadline Timeline */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900">
          Upcoming Deadlines
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Deadlines from your saved programs, sorted by date.
        </p>
        <div className="mt-4">
          <DeadlineTimeline deadlines={deadlines} />
        </div>
      </div>

      {/* Reminder Settings */}
      {uniquePrograms.size > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900">
            Email Reminders
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Set how far in advance you want deadline reminders for each program.
          </p>
          <div className="mt-3 space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
            {Array.from(uniquePrograms.values()).map((p) => (
              <ReminderSettings
                key={p.savedProgramId}
                savedProgramId={p.savedProgramId}
                programName={p.name}
                initialLeadDays={p.leadDays}
              />
            ))}
          </div>
        </div>
      )}

      {/* Saved Programs List */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900">
          Saved Programs
        </h2>
        <div className="mt-4">
          <SavedProgramsList initialPrograms={savedPrograms} />
        </div>
      </div>
    </div>
  );
}
