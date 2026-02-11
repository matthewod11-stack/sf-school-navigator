import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendDeadlineReminder } from "@/lib/notifications/email";
import type { DeadlineType } from "@/types/domain";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn("[cron/reminders] CRON_SECRET not set — endpoint disabled");
    return NextResponse.json(
      { error: "Cron endpoint not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get all saved programs with reminders enabled
    const { data: savedPrograms, error } = await supabase
      .from("saved_programs")
      .select(`
        id,
        family_id,
        reminder_lead_days,
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

    if (error) {
      console.error("[cron/reminders] Query error:", error);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sent = 0;
    let skipped = 0;

    // Collect family IDs that need emails
    const familyIds = new Set<string>();
    for (const row of savedPrograms ?? []) {
      familyIds.add(row.family_id as string);
    }

    // Batch-fetch user emails for all relevant families
    const emailMap = new Map<string, string>();
    if (familyIds.size > 0) {
      const { data: families } = await supabase
        .from("families")
        .select("id, user_id")
        .in("id", Array.from(familyIds));

      if (families) {
        const userIds = families.map((f) => f.user_id as string);
        const { data: { users } } = await supabase.auth.admin.listUsers();
        if (users) {
          const userEmailMap = new Map<string, string>();
          for (const u of users) {
            if (u.email) userEmailMap.set(u.id, u.email);
          }
          for (const f of families) {
            const email = userEmailMap.get(f.user_id as string);
            if (email) emailMap.set(f.id as string, email);
          }
        }
      }
    }

    for (const row of savedPrograms ?? []) {
      const leadDays = (row.reminder_lead_days as number) ?? 14;
      const familyId = row.family_id as string;
      const userEmail = emailMap.get(familyId);

      if (!userEmail) {
        skipped++;
        continue;
      }

      const program = row.programs as unknown as {
        name: string;
        slug: string;
        program_deadlines: Array<{
          deadline_type: string;
          date: string | null;
        }>;
      } | null;

      if (!program) {
        skipped++;
        continue;
      }

      for (const dl of program.program_deadlines) {
        if (!dl.date) continue;

        const deadlineDate = new Date(dl.date);
        deadlineDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil(
          (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntil === leadDays) {
          // Use savedProgramId as unsubscribe token (simple approach)
          const success = await sendDeadlineReminder({
            to: userEmail,
            programName: program.name,
            programSlug: program.slug,
            deadlineType: dl.deadline_type as DeadlineType,
            deadlineDate: dl.date,
            daysUntil,
            unsubscribeToken: row.id as string,
          });

          if (success) {
            sent++;
          } else {
            skipped++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/reminders] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
