import { NextResponse } from "next/server";
import { submitCorrectionSchema } from "@/lib/validation/correction";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = submitCorrectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid correction data" },
        { status: 400 }
      );
    }

    if (parsed.data.programId !== id) {
      return NextResponse.json(
        { error: "Program ID mismatch" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify program exists
    const { data: program, error: lookupError } = await supabase
      .from("programs")
      .select("id")
      .eq("id", id)
      .single();

    if (lookupError || !program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    const { error: insertError } = await supabase
      .from("user_corrections")
      .insert({
        program_id: parsed.data.programId,
        field_name: parsed.data.fieldName,
        suggested_value: parsed.data.suggestedValue,
        submitted_by: "anonymous",
        status: "pending",
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save correction" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to process correction" },
      { status: 500 }
    );
  }
}
