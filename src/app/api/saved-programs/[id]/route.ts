import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  status: z.enum([
    "researching",
    "toured",
    "applied",
    "waitlisted",
    "accepted",
    "enrolled",
    "rejected",
  ]).optional(),
  notes: z.string().max(5000).nullable().optional(),
  reminderLeadDays: z.number().int().min(0).max(90).optional(),
});

// PATCH /api/saved-programs/[id] — update a saved program
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify ownership through family
    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!family) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    if (parsed.data.reminderLeadDays !== undefined) {
      updates.reminder_lead_days = parsed.data.reminderLeadDays;
    }

    const { data, error } = await supabase
      .from("saved_programs")
      .update(updates)
      .eq("id", id)
      .eq("family_id", family.id)
      .select("id, program_id, status, notes, reminder_lead_days, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ savedProgram: data });
  } catch {
    return NextResponse.json(
      { error: "Failed to update saved program" },
      { status: 500 }
    );
  }
}

// DELETE /api/saved-programs/[id] — remove a saved program
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!family) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("saved_programs")
      .delete()
      .eq("id", id)
      .eq("family_id", family.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to remove saved program" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to remove saved program" },
      { status: 500 }
    );
  }
}
