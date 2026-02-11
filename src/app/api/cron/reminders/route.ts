import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { daysUntilDateOnly } from "@/lib/dates/date-only";
import { sendDeadlineReminder } from "@/lib/notifications/email";
import { issueUnsubscribeToken } from "@/lib/notifications/unsubscribe-token";
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
    const supabase = createAdminClient();

    // Get all saved programs with reminders enabled
    const { data: savedPrograms, error } = await supabase
      .from("saved_programs")
      .select(`
        id,
        family_id,
        reminder_lead_days,
        families:family_id(
          user_id
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

    if (error) {
      console.error("[cron/reminders] Query error:", error);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      );
    }

    const today = new Date();

    let sent = 0;
    let skipped = 0;

    // Resolve recipient emails using admin API (service role required)
    const userIds = new Set<string>();
    for (const row of savedPrograms ?? []) {
      const family = row.families as unknown as { user_id: string } | null;
      if (family?.user_id) {
        userIds.add(family.user_id);
      }
    }

    const userEmailById = new Map<string, string>();
    for (const userId of userIds) {
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(userId);
      if (userError || !userData.user?.email) {
        continue;
      }
      userEmailById.set(userId, userData.user.email);
    }

    for (const row of savedPrograms ?? []) {
      const leadDays = (row.reminder_lead_days as number) ?? 14;
      const family = row.families as unknown as { user_id: string } | null;
      const userEmail = family?.user_id
        ? userEmailById.get(family.user_id)
        : undefined;

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

        const daysUntil = daysUntilDateOnly(dl.date, today);
        if (daysUntil == null) {
          skipped++;
          continue;
        }

        if (daysUntil === leadDays) {
          let unsubscribeToken: string;
          try {
            unsubscribeToken = issueUnsubscribeToken(row.id as string);
          } catch {
            skipped++;
            continue;
          }

          const success = await sendDeadlineReminder({
            to: userEmail,
            programName: program.name,
            programSlug: program.slug,
            deadlineType: dl.deadline_type as DeadlineType,
            deadlineDate: dl.date,
            daysUntil,
            unsubscribeToken,
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
