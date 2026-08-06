import { createClient } from "@/lib/supabase/server";
import { SEED_PLACES, SEED_STORIES } from "@/data/seed-places";
import {
  aiSearchPlaces,
  getDiverseRecommendations,
} from "@/lib/search/ai-search";
import type {
  ExperienceStory,
  HomepageSectionKey,
  MoodTag,
  PaidTier,
  Place,
  PlaceAmenityFlags,
  PlaceContact,
  PlaceHighlights,
  PricingItem,
} from "@/types";

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

async function trySupabase() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

export async function getPublishedPlaces(): Promise<Place[]> {
  const supabase = await trySupabase();
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

export async function getPlaceBySlug(slug: string): Promise<Place | null> {
  const supabase = await trySupabase();
  if (!supabase) return seedPlaceBySlug(slug);

  try {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .or("archived.is.null,archived.eq.false")
      .maybeSingle();

    if (error || !data) {
      return seedPlaceBySlug(slug);
    }

    return mapPlaceRow(data as PlaceRow);
  } catch {
    return seedPlaceBySlug(slug);
  }
}

export async function getPlacesBySection(
  key: HomepageSectionKey,
): Promise<Place[]> {
  const supabase = await trySupabase();
  if (!supabase) return seedPlacesBySection(key);

  try {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("published", true)
      .or("archived.is.null,archived.eq.false")
      .contains("homepage_sections", [key])
      .order("updated_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return seedPlacesBySection(key);
    }

    return (data as PlaceRow[]).map(mapPlaceRow);
  } catch {
    return seedPlacesBySection(key);
  }
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
  const supabase = await trySupabase();
  if (!supabase) return seedStoriesForPlace(placeId);

  try {
    const { data, error } = await supabase
      .from("experience_stories")
      .select("*")
      .eq("place_id", placeId)
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return seedStoriesForPlace(placeId);
    }

    return (data as StoryRow[]).map(mapStoryRow);
  } catch {
    return seedStoriesForPlace(placeId);
  }
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
        const { data } = await supabase
          .from("experience_stories")
          .select("likes_count")
          .eq("id", storyId)
          .maybeSingle();

        return {
          likesCount: data?.likes_count ?? 0,
          liked: true,
        };
      }

      const seed = SEED_STORIES.find((item) => item.id === storyId);
      return {
        likesCount: seed ? seed.likesCount + 1 : 0,
        liked: Boolean(seed),
      };
    }

    const { data: current } = await supabase
      .from("experience_stories")
      .select("likes_count")
      .eq("id", storyId)
      .maybeSingle();

    const nextCount = (current?.likes_count ?? 0) + 1;

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