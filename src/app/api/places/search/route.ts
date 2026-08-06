import { searchPlaces } from "@/lib/data/places";
import type { MoodTag } from "@/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const MOODS = [
  "Golden Hour",
  "Date Night",
  "Hidden Escape",
  "Weekend Away",
  "Coffee Ritual",
  "Tonight",
  "Quiet Luxury",
  "Celebration",
] as const satisfies readonly MoodTag[];

const querySchema = z.object({
  q: z.string().min(1, "Query q is required"),
  vibe: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    vibe: searchParams.get("vibe") ?? searchParams.get("mood") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const vibeParam = parsed.data.vibe;
  const vibe =
    vibeParam && (MOODS as readonly string[]).includes(vibeParam)
      ? (vibeParam as MoodTag)
      : undefined;

  if (vibeParam && !vibe) {
    return NextResponse.json(
      { error: "Unknown vibe filter", allowed: MOODS },
      { status: 400 },
    );
  }

  const places = await searchPlaces(parsed.data.q, vibe);
  return NextResponse.json({
    places,
    count: places.length,
    q: parsed.data.q,
    vibe: vibe ?? null,
  });
}
