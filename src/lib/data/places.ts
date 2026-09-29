import { unstable_cache } from "next/cache";
import { SEED_PLACES, SEED_SECTIONS, SEED_STORIES } from "@/data/seed-places";
import {
  aiSearchPlaces,
  getDiverseRecommendations,
} from "@/lib/search/ai-search";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type {
  ExperienceStory,
  HomepageSection,
  HomepageSectionKey,
  MoodTag,
  PaidTier,
  Place,
  PlaceAmenityFlags,
  PlaceContact,
  PlaceHighlights,
  PricingItem,
} from "@/types";

/** Public catalogue freshness — admin mutations already revalidatePath. */
const PLACES_REVALIDATE_SECONDS = 120;

export interface PlaceRow {
  id: string;
  slug: string;
  name: string;
  location: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  category: Place["category"];
  mood: MoodTag[] | null;
  story: string;
  panora_notes: string;
  highlights: PlaceHighlights | null;
  amenities: PlaceAmenityFlags | null;
  contact: PlaceContact | null;
  price_guide: string;
  distance_km: number | null;
  verified: boolean;
  published: boolean;
  featured?: boolean | null;
  archived?: boolean | null;
  paid_tier?: PaidTier | null;
  hero_image: string;
  gallery: string[] | null;
  menu_image_urls?: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  homepage_sections: HomepageSectionKey[] | null;
  verifications?: string[] | null;
  pricing_items?: PricingItem[] | null;
  video_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryRow {
  id: string;
  place_id: string;
  author_name: string;
  body: string;
  likes_count: number;
  published: boolean;
  pinned?: boolean | null;
  reported?: boolean | null;
  created_at: string;
  feeling?: string | null;
}

function asMoodTags(value: unknown): MoodTag[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is MoodTag => typeof item === "string") as MoodTag[];
}

function asSectionKeys(value: unknown): HomepageSectionKey[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is HomepageSectionKey => typeof item === "string",
  ) as HomepageSectionKey[];
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asObject<T>(value: unknown, fallback: T): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}

function asPricingItems(value: unknown): PricingItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is PricingItem =>
        !!item &&
        typeof item === "object" &&
        typeof (item as PricingItem).label === "string" &&
        typeof (item as PricingItem).price === "string",
    )
    .map((item) => ({ label: item.label, price: item.price }));
}

export function mapPlaceRow(row: PlaceRow): Place {
  const highlights = asObject<PlaceHighlights>(row.highlights, {});
  const pricingFromColumn = asPricingItems(row.pricing_items);
  const pricingFromHighlights = asPricingItems(highlights.pricingItems);
  const pricingItems =
    pricingFromColumn.length > 0 ? pricingFromColumn : pricingFromHighlights;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    city: row.city,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    category: row.category,
    mood: asMoodTags(row.mood),
    story: row.story,
    panoraNotes: row.panora_notes,
    highlights,
    amenities: asObject<PlaceAmenityFlags>(row.amenities, {}),
    contact: asObject<PlaceContact>(row.contact, {}),
    priceGuide: row.price_guide,
    distanceKm: row.distance_km,
    verified: row.verified,
    published: row.published,
    featured: Boolean(row.featured),
    archived: Boolean(row.archived),
    paidTier: (row.paid_tier ?? "basic") as PaidTier,
    heroImage: row.hero_image,
    gallery: asStringArray(row.gallery),
    menuImageUrls: asStringArray(row.menu_image_urls),
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    homepageSections: asSectionKeys(row.homepage_sections),
    verifications: asStringArray(row.verifications),
    pricingItems,
    videoUrl: row.video_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapStoryRow(row: StoryRow): ExperienceStory {
  return {
    id: row.id,
    placeId: row.place_id,
    authorName: row.author_name,
    body: row.body,
    likesCount: row.likes_count,
    published: row.published,
    pinned: Boolean(row.pinned),
    reported: Boolean(row.reported),
    createdAt: row.created_at,
    feeling: row.feeling ?? null,
  };
}

function seedPublishedPlaces(): Place[] {
  return SEED_PLACES.filter((place) => place.published && !place.archived);
}

function seedPlaceBySlug(slug: string): Place | null {
  return seedPublishedPlaces().find((place) => place.slug === slug) ?? null;
}

function seedPlacesBySection(key: HomepageSectionKey): Place[] {
  return seedPublishedPlaces().filter((place) =>
    place.homepageSections.includes(key),
  );
}

function seedStoriesForPlace(placeId: string): ExperienceStory[] {
  return SEED_STORIES.filter(
    (story) => story.placeId === placeId && story.published,
  ).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Cookie-based client — for authenticated story likes / user-scoped writes. */
async function trySupabase() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

async function fetchPublishedPlaces(): Promise<Place[]> {
  const supabase = createPublicClient();
  if (!supabase) return seedPublishedPlaces();

  try {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("published", true)
      .or("archived.is.null,archived.eq.false")
      .order("updated_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return seedPublishedPlaces();
    }

    return (data as PlaceRow[]).map(mapPlaceRow);
  } catch {
    return seedPublishedPlaces();
  }
}

export const getPublishedPlaces = unstable_cache(
  fetchPublishedPlaces,
  ["published-places"],
  { revalidate: PLACES_REVALIDATE_SECONDS, tags: ["places"] },
);

export async function getPlaceBySlug(slug: string): Promise<Place | null> {
  const normalized = slug.trim();
  if (!normalized) return null;

  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      if (!supabase) return seedPlaceBySlug(normalized);

      try {
        const { data, error } = await supabase
          .from("places")
          .select("*")
          .eq("slug", normalized)
          .eq("published", true)
          .or("archived.is.null,archived.eq.false")
          .maybeSingle();

        if (error || !data) {
          return seedPlaceBySlug(normalized);
        }

        return mapPlaceRow(data as PlaceRow);
      } catch {
        return seedPlaceBySlug(normalized);
      }
    },
    ["place-by-slug", normalized],
    { revalidate: PLACES_REVALIDATE_SECONDS, tags: ["places", `place:${normalized}`] },
  )();
}

function sortByCuratedIds(places: Place[], placeIds: string[]): Place[] {
  if (placeIds.length === 0) return places;
  const rank = new Map(placeIds.map((id, index) => [id, index]));
  return [...places].sort((a, b) => {
    const left = rank.get(a.id);
    const right = rank.get(b.id);
    if (left == null && right == null) return 0;
    if (left == null) return 1;
    if (right == null) return -1;
    return left - right;
  });
}

function mapHomepageSection(row: {
  id: string;
  key: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
  enabled: boolean;
  place_ids: string[] | null;
  section_type?: string | null;
}): HomepageSection {
  return {
    id: row.id,
    key: row.key,
    title: row.title,
    subtitle: row.subtitle ?? "",
    sortOrder: row.sort_order,
    enabled: Boolean(row.enabled),
    placeIds: Array.isArray(row.place_ids) ? row.place_ids : [],
    sectionType: row.section_type ?? "grid",
  };
}

export async function getEnabledHomepageSections(): Promise<HomepageSection[]> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      if (!supabase) return SEED_SECTIONS.filter((section) => section.enabled);

      try {
        const { data, error } = await supabase
          .from("homepage_sections")
          .select("*")
          .eq("enabled", true)
          .order("sort_order", { ascending: true });

        if (error || !data || data.length === 0) {
          return SEED_SECTIONS.filter((section) => section.enabled);
        }

        return data.map((row) =>
          mapHomepageSection(
            row as {
              id: string;
              key: string;
              title: string;
              subtitle: string | null;
              sort_order: number;
              enabled: boolean;
              place_ids: string[] | null;
              section_type?: string | null;
            },
          ),
        );
      } catch {
        return SEED_SECTIONS.filter((section) => section.enabled);
      }
    },
    ["homepage-sections"],
    { revalidate: PLACES_REVALIDATE_SECONDS, tags: ["places"] },
  )();
}

export async function getPlacesBySection(
  key: HomepageSectionKey,
  placeIds: string[] = [],
): Promise<Place[]> {
  const orderKey = placeIds.join(",");
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      if (!supabase) {
        return sortByCuratedIds(seedPlacesBySection(key), placeIds);
      }

      try {
        const { data, error } = await supabase
          .from("places")
          .select("*")
          .eq("published", true)
          .or("archived.is.null,archived.eq.false")
          .contains("homepage_sections", [key])
          .order("updated_at", { ascending: false });

        if (error || !data || data.length === 0) {
          return sortByCuratedIds(seedPlacesBySection(key), placeIds);
        }

        return sortByCuratedIds(
          (data as PlaceRow[]).map(mapPlaceRow),
          placeIds,
        );
      } catch {
        return sortByCuratedIds(seedPlacesBySection(key), placeIds);
      }
    },
    ["places-by-section", key, orderKey],
    { revalidate: PLACES_REVALIDATE_SECONDS, tags: ["places"] },
  )();
}

export async function searchPlaces(
  query: string,
  vibe?: MoodTag,
): Promise<Place[]> {
  const places = await getPublishedPlaces();
  return aiSearchPlaces(places, query, vibe);
}

export async function getRecommendationsForPlace(
  slugOrId: string,
): Promise<Place[]> {
  const places = await getPublishedPlaces();
  let current =
    places.find(
      (place) => place.slug === slugOrId || place.id === slugOrId,
    ) ?? null;

  if (!current) {
    current = await getPlaceBySlug(slugOrId);
  }

  if (!current) {
    const seed = SEED_PLACES.find(
      (place) => place.slug === slugOrId || place.id === slugOrId,
    );
    if (!seed) return [];
    return getDiverseRecommendations(seed, places);
  }

  return getDiverseRecommendations(current, places);
}

export async function getStoriesForPlace(
  placeId: string,
): Promise<ExperienceStory[]> {
  const id = placeId.trim();
  if (!id) return [];

  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      if (!supabase) return seedStoriesForPlace(id);

      try {
        const { data, error } = await supabase
          .from("experience_stories")
          .select("*")
          .eq("place_id", id)
          .eq("published", true)
          .order("created_at", { ascending: false });

        if (error || !data || data.length === 0) {
          return seedStoriesForPlace(id);
        }

        return (data as StoryRow[]).map(mapStoryRow);
      } catch {
        return seedStoriesForPlace(id);
      }
    },
    ["stories-for-place", id],
    { revalidate: PLACES_REVALIDATE_SECONDS, tags: ["places", `stories:${id}`] },
  )();
}

async function readLikesCount(
  storyId: string,
  fallback = 0,
): Promise<number> {
  const supabase = await trySupabase();
  if (!supabase) return fallback;
  const { data } = await supabase
    .from("experience_stories")
    .select("likes_count")
    .eq("id", storyId)
    .maybeSingle();
  return data?.likes_count ?? fallback;
}

export async function likeStory(
  storyId: string,
  visitorKey: string,
): Promise<{ likesCount: number; liked: boolean }> {
  const supabase = await trySupabase();

  if (!supabase) {
    const story = SEED_STORIES.find((item) => item.id === storyId);
    if (!story) {
      return { likesCount: 0, liked: false };
    }
    return { likesCount: story.likesCount + 1, liked: true };
  }

  try {
    const { error: likeError } = await supabase.from("story_likes").insert({
      story_id: storyId,
      visitor_key: visitorKey,
    });

    if (likeError) {
      if (likeError.code === "23505") {
        return {
          likesCount: await readLikesCount(storyId),
          liked: true,
        };
      }

      const seed = SEED_STORIES.find((item) => item.id === storyId);
      return {
        likesCount: seed ? seed.likesCount + 1 : 0,
        liked: Boolean(seed),
      };
    }

    const nextCount = (await readLikesCount(storyId)) + 1;

    await supabase
      .from("experience_stories")
      .update({ likes_count: nextCount })
      .eq("id", storyId);

    return { likesCount: nextCount, liked: true };
  } catch {
    const seed = SEED_STORIES.find((item) => item.id === storyId);
    return {
      likesCount: seed ? seed.likesCount + 1 : 0,
      liked: Boolean(seed),
    };
  }
}

export async function unlikeStory(
  storyId: string,
  visitorKey: string,
): Promise<{ likesCount: number; liked: boolean }> {
  const supabase = await trySupabase();

  if (!supabase) {
    const story = SEED_STORIES.find((item) => item.id === storyId);
    if (!story) {
      return { likesCount: 0, liked: false };
    }
    return {
      likesCount: Math.max(0, story.likesCount - 1),
      liked: false,
    };
  }

  try {
    // Prefer service role so unlike works even before the public DELETE policy.
    const { createServiceClient } = await import("@/lib/supabase/service");
    const writer = createServiceClient() ?? supabase;

    const { data: existing } = await writer
      .from("story_likes")
      .select("story_id")
      .eq("story_id", storyId)
      .eq("visitor_key", visitorKey)
      .maybeSingle();

    if (!existing) {
      return {
        likesCount: await readLikesCount(storyId),
        liked: false,
      };
    }

    const { error: deleteError } = await writer
      .from("story_likes")
      .delete()
      .eq("story_id", storyId)
      .eq("visitor_key", visitorKey);

    if (deleteError) {
      console.info("[stories] unlike:", deleteError.message);
      return {
        likesCount: await readLikesCount(storyId),
        liked: true,
      };
    }

    const current = await readLikesCount(storyId);
    const nextCount = Math.max(0, current - 1);

    await writer
      .from("experience_stories")
      .update({ likes_count: nextCount })
      .eq("id", storyId);

    return { likesCount: nextCount, liked: false };
  } catch (err) {
    console.info(
      "[stories] unlike failed:",
      err instanceof Error ? err.message : err,
    );
    const seed = SEED_STORIES.find((item) => item.id === storyId);
    return {
      likesCount: seed ? Math.max(0, seed.likesCount - 1) : 0,
      liked: false,
    };
  }
}

/** Toggle like / unlike for a visitor. */
export async function toggleStoryLike(
  storyId: string,
  visitorKey: string,
  currentlyLiked: boolean,
): Promise<{ likesCount: number; liked: boolean }> {
  if (currentlyLiked) {
    return unlikeStory(storyId, visitorKey);
  }
  return likeStory(storyId, visitorKey);
}