import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const querySchema = z.object({
  token: z.string().uuid(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ token: searchParams.get("token") });

  if (!parsed.success) {
    return new NextResponse(unsubscribePage("Invalid unsubscribe link."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const savedProgramId = parsed.data.token;
  const supabase = await createClient();

  // Set reminder_lead_days to 0 (disabling reminders for this saved program)
  const { error } = await supabase
    .from("saved_programs")
    .update({ reminder_lead_days: 0 })
    .eq("id", savedProgramId);

  if (error) {
    return new NextResponse(
      unsubscribePage("Something went wrong. Please try again later."),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }

  return new NextResponse(
    unsubscribePage(
      "You have been unsubscribed from reminders for this program. You can re-enable reminders from your dashboard."
    ),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

function unsubscribePage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribe — SF School Navigator</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f9fafb; color: #1a1a1a; }
    .card { background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 480px; text-align: center; }
    h1 { font-size: 20px; margin: 0 0 12px; }
    p { color: #6b7280; line-height: 1.6; margin: 0; }
    a { color: #4f46e5; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h1>SF School Navigator</h1>
    <p>${message}</p>
    <p style="margin-top: 16px;"><a href="/dashboard">Go to Dashboard</a></p>
  </div>
</body>
</html>`;
}
