import { createPublicClient } from "@/lib/supabase/public";

export type WeekStory = {
  id: string;
  title: string;
  caption: string;
  imageUrl: string | null;
  videoUrl: string | null;
  placeId: string | null;
  placeName: string | null;
  placeSlug: string | null;
  category: string | null;
  published: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
};

export type WeekStoryComment = {
  id: string;
  storyId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type StoryRow = {
  id: string;
  title: string;
  caption: string | null;
  image_url: string | null;
  video_url: string | null;
  place_id: string | null;
  category: string | null;
  published: boolean;
  published_at: string | null;
  expires_at: string | null;
};

function missingTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /week_stories|schema cache/i.test(error.message ?? "")
  );
}

function mapStory(
  row: StoryRow,
  places: Map<string, { name: string; slug: string }>,
): WeekStory {
  const place = row.place_id ? places.get(row.place_id) : undefined;
  return {
    id: row.id,
    title: row.title,
    caption: row.caption ?? "",
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    placeId: row.place_id,
    placeName: place?.name ?? null,
    placeSlug: place?.slug ?? null,
    category: row.category,
    published: row.published,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
  };
}

export async function getPublishedWeekStories(): Promise<WeekStory[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("week_stories")
    .select(
      "id, title, caption, image_url, video_url, place_id, category, published, published_at, expires_at",
    )
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error || !data) {
    if (error && !missingTable(error)) {
      console.warn("[week-stories] public read failed", error.message);
    }
    return [];
  }

  const now = Date.now();
  const rows = (data as StoryRow[]).filter((row) => {
    if (row.published_at && Date.parse(row.published_at) > now) return false;
    if (row.expires_at && Date.parse(row.expires_at) <= now) return false;
    return true;
  });

  const placeIds = [
    ...new Set(rows.map((row) => row.place_id).filter((id): id is string => Boolean(id))),
  ];
  const places = new Map<string, { name: string; slug: string }>();
  if (placeIds.length > 0) {
    const { data: placeRows } = await supabase
      .from("places")
      .select("id, name, slug")
      .in("id", placeIds)
      .eq("published", true);
    for (const place of placeRows ?? []) {
      places.set(place.id as string, {
        name: place.name as string,
        slug: place.slug as string,
      });
    }
  }

  return rows.map((row) => mapStory(row, places));
}

export async function getWeekStoryComments(
  storyId: string,
): Promise<WeekStoryComment[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
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
}
