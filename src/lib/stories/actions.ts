"use server";

import { likeStory } from "@/lib/data/places";
import { createClient } from "@/lib/supabase/server";

export async function likeStoryAction(storyId: string, visitorKey: string) {
  return likeStory(storyId, visitorKey);
}

export async function createStoryAction(input: {
  placeId: string;
  authorName: string;
  body: string;
  feeling?: string | null;
}) {
  const authorName = input.authorName.trim();
  const body = input.body.trim();
  const feelingRaw = input.feeling?.trim() ?? "";
  const feeling = feelingRaw
    ? feelingRaw.split(/\s+/)[0]?.slice(0, 40).toLowerCase() ?? null
    : null;

  if (!authorName || !body) {
    return { ok: false as const, error: "Name and story are required." };
  }

  if (body.length < 20) {
    return {
      ok: false as const,
      error: "Share a little more — at least a few sentences.",
    };
  }

  const localStory = {
    id: `local-${Date.now()}`,
    placeId: input.placeId,
    authorName,
    body,
    likesCount: 0,
    published: false,
    createdAt: new Date().toISOString(),
    feeling,
  };

  try {
    const supabase = await createClient();
    const payload: Record<string, unknown> = {
      place_id: input.placeId,
      author_name: authorName,
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

    if (error || !data) {
      // Column missing or table unavailable — keep optimistic local story
      return {
        ok: true as const,
        pending: true,
        story: localStory,
      };
    }

    return {
      ok: true as const,
      pending: !data.published,
      story: {
        id: data.id as string,
        placeId: data.place_id as string,
        authorName: data.author_name as string,
        body: data.body as string,
        likesCount: data.likes_count as number,
        published: data.published as boolean,
        createdAt: data.created_at as string,
        feeling:
          ((data as { feeling?: string | null }).feeling as string | null) ??
          feeling,
      },
    };
  } catch {
    return {
      ok: true as const,
      pending: true,
      story: localStory,
    };
  }
}
