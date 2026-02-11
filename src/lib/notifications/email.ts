import { Resend } from "resend";
import type { DeadlineType } from "@/types/domain";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[notifications] RESEND_API_KEY not set — email sending disabled"
    );
    return null;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

const DEADLINE_TYPE_LABELS: Record<DeadlineType, string> = {
  "application-open": "Application Opens",
  "application-close": "Application Deadline",
  notification: "Notification Date",
  waitlist: "Waitlist Deadline",
};

const FROM_EMAIL = "SF School Navigator <notifications@sfschoolnavigator.com>";

interface DeadlineReminderParams {
  to: string;
  programName: string;
  programSlug: string;
  deadlineType: DeadlineType;
  deadlineDate: string;
  daysUntil: number;
  unsubscribeToken: string;
}

export async function sendDeadlineReminder(
  params: DeadlineReminderParams
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sfschoolnavigator.com";
  const profileUrl = `${baseUrl}/programs/${params.programSlug}`;
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`;
  const deadlineLabel = DEADLINE_TYPE_LABELS[params.deadlineType];
  const formattedDate = new Date(params.deadlineDate).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );

  const subject = `Reminder: ${params.programName} — ${deadlineLabel} in ${params.daysUntil} days`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="border-bottom: 3px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="font-size: 20px; margin: 0; color: #4f46e5;">SF School Navigator</h1>
  </div>

  <h2 style="font-size: 18px; margin: 0 0 8px;">Upcoming Deadline Reminder</h2>

  <div style="background: #f5f3ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p style="margin: 0 0 4px; font-weight: 600; font-size: 16px;">${params.programName}</p>
    <p style="margin: 0 0 4px; color: #6b7280;">${deadlineLabel}</p>
    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #4f46e5;">${formattedDate}</p>
    <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">${params.daysUntil} days remaining</p>
  </div>

  <a href="${profileUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 8px 0 24px;">View Program Details</a>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

  <p style="font-size: 12px; color: #9ca3af; margin: 0;">
    You're receiving this because you saved this program on SF School Navigator.
    <a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe from reminders for this program</a>
  </p>
</body>
</html>`;

  const text = `Upcoming Deadline Reminder

${params.programName}
${deadlineLabel}: ${formattedDate}
${params.daysUntil} days remaining

View program: ${profileUrl}

---
Unsubscribe: ${unsubscribeUrl}`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[notifications] Failed to send email:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[notifications] Email send error:", err);
    return false;
  }
}
