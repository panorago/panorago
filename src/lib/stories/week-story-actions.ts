"use server";

import type { WeekStoryComment } from "@/lib/stories/week-stories";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export type AdminWeekStory = {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  videoUrl: string;
  placeId: string;
  category: string;
  published: boolean;
  publishedAt: string;
  expiresAt: string;
};

type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && profile.role !== "admin") throw new Error("Forbidden");

  return createServiceClient() ?? supabase;
}

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function toIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function revalidateStories() {
  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath("/admin/week-stories");
}

export async function listAdminWeekStories(): Promise<{
  stories: AdminWeekStory[];
  unavailable: boolean;
}> {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase
      .from("week_stories")
      .select(
        "id, title, caption, image_url, video_url, place_id, category, published, published_at, expires_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      if (/week_stories|schema cache|42P01|PGRST205/i.test(error.message)) {
        return { stories: [], unavailable: true };
      }
      return { stories: [], unavailable: false };
    }

    return {
      unavailable: false,
      stories: (data ?? []).map((row) => ({
        id: row.id as string,
        title: (row.title as string) ?? "",
        caption: (row.caption as string) ?? "",
        imageUrl: (row.image_url as string) ?? "",
        videoUrl: (row.video_url as string) ?? "",
        placeId: (row.place_id as string) ?? "",
        category: (row.category as string) ?? "",
        published: Boolean(row.published),
        publishedAt: row.published_at
          ? new Date(row.published_at as string).toISOString().slice(0, 16)
          : "",
        expiresAt: row.expires_at
          ? new Date(row.expires_at as string).toISOString().slice(0, 16)
          : "",
      })),
    };
  } catch (error) {
    return {
      stories: [],
      unavailable: error instanceof Error && /Unauthorized|Forbidden/.test(error.message),
    };
  }
}

export async function saveWeekStory(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const id = asString(formData.get("id"));
    const title = asString(formData.get("title")).slice(0, 120);
    const caption = asString(formData.get("caption")).slice(0, 500);
    const imageUrl = asString(formData.get("imageUrl"));
    const videoUrl = asString(formData.get("videoUrl"));
    if (!title) return { ok: false, error: "A title is required." };
    if (!imageUrl && !videoUrl) {
      return { ok: false, error: "Add an image or a short video." };
    }

    const published = formData.get("published") === "on";
    const publishedAt = toIso(asString(formData.get("publishedAt")));
    const payload = {
      title,
      caption,
      image_url: imageUrl || null,
      video_url: videoUrl || null,
      place_id: asString(formData.get("placeId")) || null,
      category: asString(formData.get("category")).slice(0, 60) || null,
      published,
      published_at: published ? publishedAt ?? new Date().toISOString() : publishedAt,
      expires_at: toIso(asString(formData.get("expiresAt"))),
      updated_at: new Date().toISOString(),
    };

    const query = id
      ? supabase.from("week_stories").update(payload).eq("id", id).select("id")
      : supabase.from("week_stories").insert(payload).select("id");
    const { data, error } = await query.maybeSingle();
    if (error) {
      if (/week_stories|schema cache/i.test(error.message)) {
        return {
          ok: false,
          error: "Run migration 018_week_stories.sql in Supabase, then try again.",
        };
      }
      return { ok: false, error: error.message };
    }
    if (!data?.id) return { ok: false, error: "The status was not saved." };

    revalidateStories();
    return { ok: true, message: id ? "Status updated." : "Status created." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save the status.",
    };
  }
}

export async function deleteWeekStory(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase
      .from("week_stories")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) return { ok: false, error: error.message };
    if (!data?.length) return { ok: false, error: "That status was not deleted." };
    revalidateStories();
    return { ok: true, message: "Status deleted." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not delete the status.",
    };
  }
}

export async function listWeekStoryComments(
  storyId: string,
): Promise<WeekStoryComment[]> {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase
      .from("week_story_comments")
      .select("id, story_id, author_name, body, created_at")
      .eq("story_id", storyId)
      .order("created_at", { ascending: true })
      .limit(80);
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      storyId: row.story_id as string,
      authorName: row.author_name as string,
      body: row.body as string,
      createdAt: row.created_at as string,
    }));
  } catch {
    return [];
  }
}

export async function deleteWeekStoryComment(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase
      .from("week_story_comments")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) return { ok: false, error: error.message };
    if (!data?.length) return { ok: false, error: "That comment was not removed." };
    revalidateStories();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not remove the comment.",
    };
  }
}
