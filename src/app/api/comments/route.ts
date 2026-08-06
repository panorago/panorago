import { getStoriesForPlace } from "@/lib/data/places";
import { createClient } from "@/lib/supabase/server";
import { SEED_STORIES } from "@/data/seed-places";
import { NextResponse } from "next/server";
import { z } from "zod";

const getSchema = z.object({
  place_id: z.string().uuid("place_id must be a valid UUID"),
});

const postSchema = z.object({
  place_id: z.string().uuid(),
  author_name: z.string().trim().min(1).max(60),
  body: z.string().trim().min(20).max(1200),
  feeling: z
    .string()
    .trim()
    .max(40)
    .optional()
    .nullable()
    .transform((v) => (v ? v.toLowerCase() : null)),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = getSchema.safeParse({
    place_id: searchParams.get("place_id") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const comments = await getStoriesForPlace(parsed.data.place_id);
  return NextResponse.json({ comments, count: comments.length });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { place_id, author_name, body, feeling } = parsed.data;

  try {
    const supabase = await createClient();
    const payload: Record<string, unknown> = {
      place_id,
      author_name,
      body,
      likes_count: 0,
      published: false,
    };
    if (feeling) payload.feeling = feeling;

    const { data, error } = await supabase
      .from("experience_stories")
      .insert(payload)
      .select(
        "id, place_id, author_name, body, likes_count, published, created_at, feeling",
      )
      .maybeSingle();

    if (!error && data) {
      return NextResponse.json(
        {
          comment: {
            id: data.id,
            placeId: data.place_id,
            authorName: data.author_name,
            body: data.body,
            likesCount: data.likes_count,
            published: data.published,
            createdAt: data.created_at,
            feeling: (data as { feeling?: string | null }).feeling ?? feeling,
          },
          pending: !data.published,
        },
        { status: 201 },
      );
    }
  } catch {
    // fall through to local response
  }

  const seedPlaceExists = SEED_STORIES.some((s) => s.placeId === place_id) ||
    place_id.startsWith("11111111-");

  if (!seedPlaceExists) {
    // still accept — seed IDs are known; unknown UUIDs ok for optimistic UX
  }

  return NextResponse.json(
    {
      comment: {
        id: `local-${Date.now()}`,
        placeId: place_id,
        authorName: author_name,
        body,
        likesCount: 0,
        published: false,
        createdAt: new Date().toISOString(),
        feeling,
      },
      pending: true,
    },
    { status: 201 },
  );
}
