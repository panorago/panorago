import { getPublishedPlaces, searchPlaces } from "@/lib/data/places";
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
  q: z.string().optional().default(""),
  mood: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    mood: searchParams.get("mood") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { q, mood } = parsed.data;
  const vibe =
    mood && (MOODS as readonly string[]).includes(mood)
      ? (mood as MoodTag)
      : undefined;

  if (mood && !vibe) {
    return NextResponse.json(
      { error: "Unknown mood filter", allowed: MOODS },
      { status: 400 },
    );
  }

  const places =
    q || vibe
      ? await searchPlaces(q ?? "", vibe)
      : await getPublishedPlaces();

  return NextResponse.json({ places, count: places.length });
}
