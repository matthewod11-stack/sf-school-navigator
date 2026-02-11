import { NextResponse } from "next/server";
import { z } from "zod";
import { getProgramsByIds } from "@/lib/db/queries/programs";

const requestSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(4),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request: provide 1-4 program UUIDs" },
        { status: 400 }
      );
    }

    const programs = await getProgramsByIds(parsed.data.ids);

    return NextResponse.json({ programs });
  } catch {
    return NextResponse.json(
      { error: "Failed to load programs for comparison" },
      { status: 500 }
    );
  }
}
