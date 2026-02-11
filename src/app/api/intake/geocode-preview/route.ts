import { NextResponse } from "next/server";
import { z } from "zod";
import { geocodeAndDiscard } from "@/lib/geo/geocode";

const geocodePreviewSchema = z.object({
  homeAddress: z.string().min(5),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = geocodePreviewSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid address" },
        { status: 400 }
      );
    }

    const geocode = await geocodeAndDiscard(parsed.data.homeAddress);
    return NextResponse.json(geocode);
  } catch {
    return NextResponse.json(
      { error: "Unable to preview this address right now" },
      { status: 500 }
    );
  }
}
