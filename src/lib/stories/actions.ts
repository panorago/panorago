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
}) {
  const authorName = input.authorName.trim();
  const body = input.body.trim();

  if (!authorName || !body) {
    return { ok: false as const, error: "Name and story are required." };
  }

  if (body.length < 20) {
    return {
      ok: false as const,
      error: "Share a little more — at least a few sentences.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("experience_stories")
      .insert({
        place_id: input.placeId,
        author_name: authorName,
        body,
        likes_count: 0,
        published: false,
      })
      .select("id, place_id, author_name, body, likes_count, published, created_at")
      .maybeSingle();

    if (error || !data) {
      return {
        ok: true as const,
        pending: true,
        story: {
          id: `local-${Date.now()}`,
          placeId: input.placeId,
          authorName,
          body,
          likesCount: 0,
          published: false,
          createdAt: new Date().toISOString(),
        },
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
      },
    };
  } catch {
    return {
      ok: true as const,
      pending: true,
      story: {
        id: `local-${Date.now()}`,
        placeId: input.placeId,
        authorName,
        body,
        likesCount: 0,
        published: false,
        createdAt: new Date().toISOString(),
      },
    };
  }
}
