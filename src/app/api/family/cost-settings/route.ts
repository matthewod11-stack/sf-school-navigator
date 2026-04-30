import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const costSettingsSchema = z.object({
  costEstimateBand: z.enum([
    "unknown",
    "sticker-only",
    "elfa-free-0-110-ami",
    "elfa-full-credit-111-150-ami",
    "elfa-half-credit-151-200-ami",
    "not-eligible-over-200-ami",
  ]),
});

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
    const parsed = costSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cost settings" }, { status: 400 });
    }

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

    const query = existingFamily
      ? supabase
          .from("families")
          .update({ cost_estimate_band: parsed.data.costEstimateBand })
          .eq("id", existingFamily.id)
          .eq("user_id", user.id)
      : supabase.from("families").insert({
          user_id: user.id,
          num_children: 1,
          has_multiples: false,
          subsidy_interested: false,
          cost_estimate_band: parsed.data.costEstimateBand,
          transport_mode: "car",
          preferences: {
            philosophy: [],
            languages: [],
            mustHaves: [],
            niceToHaves: [],
          },
        });

    const { data: family, error } = await query
      .select("id, cost_estimate_band")
      .single();

    if (error || !family) {
      return NextResponse.json(
        { error: "Failed to save cost settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      familyId: family.id,
      costEstimateBand: family.cost_estimate_band,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to save cost settings" },
      { status: 500 }
    );
  }
}
