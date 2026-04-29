import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  childProfilesUpdateSchema,
  coerceChildProfiles,
  familyChildColumns,
  finalizeChildProfiles,
} from "@/lib/family/child-profiles";
import type { ChildProfile } from "@/types/domain";

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function fallbackChildFromRow(row: Record<string, unknown> | null): ChildProfile {
  return {
    id: "child-1",
    label: "Child 1",
    ageMonths: numberOrNull(row?.child_age_months),
    expectedDueDate:
      typeof row?.child_expected_due_date === "string"
        ? row.child_expected_due_date
        : null,
    pottyTrained:
      typeof row?.potty_trained === "boolean" ? row.potty_trained : null,
    gradeTarget: "prek",
  };
}

function normalizeFamilyChildren(row: Record<string, unknown>): ChildProfile[] {
  return coerceChildProfiles(row.children, fallbackChildFromRow(row));
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: family, error } = await supabase
      .from("families")
      .select("id, child_age_months, child_expected_due_date, potty_trained, children")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Failed to load child profiles" },
        { status: 500 }
      );
    }

    if (!family) {
      return NextResponse.json({ familyId: null, children: [] });
    }

    return NextResponse.json({
      familyId: family.id,
      children: normalizeFamilyChildren(family as Record<string, unknown>),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load child profiles" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = childProfilesUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid child profiles", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const children = finalizeChildProfiles(parsed.data.children);
    const childColumns = familyChildColumns(children);

    const { data: existingFamily, error: loadError } = await supabase
      .from("families")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (loadError) {
      return NextResponse.json(
        { error: "Failed to load family profile" },
        { status: 500 }
      );
    }

    const baseUpdates = {
      ...childColumns,
      updated_at: new Date().toISOString(),
    };

    const query = existingFamily
      ? supabase
          .from("families")
          .update(baseUpdates)
          .eq("id", existingFamily.id)
          .eq("user_id", user.id)
      : supabase.from("families").insert({
          user_id: user.id,
          ...baseUpdates,
          subsidy_interested: false,
          transport_mode: "car",
          preferences: {
            philosophy: [],
            languages: [],
            mustHaves: [],
            niceToHaves: [],
          },
        });

    const { data: family, error } = await query
      .select("id, child_age_months, child_expected_due_date, potty_trained, children")
      .single();

    if (error || !family) {
      return NextResponse.json(
        { error: "Failed to save child profiles" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      familyId: family.id,
      children: normalizeFamilyChildren(family as Record<string, unknown>),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to save child profiles" },
      { status: 500 }
    );
  }
}
