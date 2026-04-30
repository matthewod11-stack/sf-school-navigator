import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  normalizePlanChildIds,
  normalizePlanRole,
  normalizePlanTasks,
} from "@/lib/planning/plan-state";

const saveProgramSchema = z.object({
  programId: z.string().uuid(),
  status: z.enum([
    "researching",
    "toured",
    "applied",
    "waitlisted",
    "accepted",
    "enrolled",
    "rejected",
  ]).default("researching"),
  notes: z.string().max(5000).nullable().default(null),
});

// GET /api/saved-programs — list saved programs for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the family for this user
    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!family) {
      return NextResponse.json({ savedPrograms: [] });
    }

    const { data, error } = await supabase
      .from("saved_programs")
      .select(`
        id,
        program_id,
        status,
        notes,
        reminder_lead_days,
        plan_role,
        plan_child_ids,
        plan_tasks,
        created_at,
        updated_at,
        programs:program_id(
          id,
          name,
          slug,
          address,
          primary_type,
          age_min_months,
          age_max_months
        )
      `)
      .eq("family_id", family.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to load saved programs" },
        { status: 500 }
      );
    }

    const savedPrograms = (data ?? []).map((row) => {
      const program = row.programs as unknown as Record<string, unknown> | null;
      return {
        id: row.id,
        programId: row.program_id,
        status: row.status,
        notes: row.notes,
        reminderLeadDays: row.reminder_lead_days,
        planRole: normalizePlanRole(row.plan_role),
        planChildIds: normalizePlanChildIds(row.plan_child_ids, []),
        planTasks: normalizePlanTasks(row.plan_tasks),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        program: program
          ? {
              id: program.id as string,
              name: program.name as string,
              slug: program.slug as string,
              address: program.address as string | null,
              primaryType: program.primary_type as string,
              ageMinMonths: program.age_min_months as number | null,
              ageMaxMonths: program.age_max_months as number | null,
            }
          : null,
      };
    });

    return NextResponse.json({ savedPrograms });
  } catch {
    return NextResponse.json(
      { error: "Failed to load saved programs" },
      { status: 500 }
    );
  }
}

// POST /api/saved-programs — save a program
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = saveProgramSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Get or create family
    let { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!family) {
      const { data: newFamily, error: familyError } = await supabase
        .from("families")
        .insert({
          user_id: user.id,
          num_children: 1,
          has_multiples: false,
          subsidy_interested: false,
          transport_mode: "car",
          preferences: {
            philosophy: [],
            languages: [],
            mustHaves: [],
            niceToHaves: [],
          },
        })
        .select("id")
        .single();

      if (familyError || !newFamily) {
        return NextResponse.json(
          { error: "Failed to create family profile" },
          { status: 500 }
        );
      }
      family = newFamily;
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from("saved_programs")
      .select("id")
      .eq("family_id", family.id)
      .eq("program_id", parsed.data.programId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Program already saved" },
        { status: 409 }
      );
    }

    const { data: savedProgram, error: insertError } = await supabase
      .from("saved_programs")
      .insert({
        family_id: family.id,
        program_id: parsed.data.programId,
        status: parsed.data.status,
        notes: parsed.data.notes,
      })
      .select("id, program_id, status, notes, plan_role, plan_child_ids, plan_tasks, created_at")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save program" },
        { status: 500 }
      );
    }

    return NextResponse.json({ savedProgram }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save program" },
      { status: 500 }
    );
  }
}
