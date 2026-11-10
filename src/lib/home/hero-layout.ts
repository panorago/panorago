import { toPlaceCardModel, type PlaceCardModel } from "@/lib/places/card";
import type { HomepageSection, Place } from "@/types";

export const HERO_RIGHT_PANEL_KEY = "hero_right_panel";
export const HERO_PEEK_STRIP_KEY = "hero_peek_strip";

export function isHeroLayoutKey(key: string) {
  return key === HERO_RIGHT_PANEL_KEY || key === HERO_PEEK_STRIP_KEY;
}

function clampLimit(value: number | undefined, fallback: number) {
  const n = value ?? fallback;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(6, Math.max(1, Math.round(n)));
}

function byIds(places: Place[], ids: string[]) {
  const rank = new Map(ids.map((id, index) => [id, index]));
  return places
    .filter((place) => rank.has(place.id) || rank.has(place.slug))
    .sort((a, b) => {
      const left = rank.get(a.id) ?? rank.get(a.slug) ?? 99;
      const right = rank.get(b.id) ?? rank.get(b.slug) ?? 99;
      return left - right;
    });
}

function byMood(places: Place[], vibe: string) {
  const needle = vibe.toLowerCase();
  return places.filter((place) =>
    place.mood.some((mood) => mood.toLowerCase() === needle),
  );
}

export function placesForHeroSlot(
  published: Place[],
  trending: Place[],
  section: HomepageSection | undefined,
  slot: "panel" | "peek",
): { visible: boolean; title: string; places: PlaceCardModel[] } {
  const defaults =
    slot === "panel"
      ? { title: "Trending Now", limit: 3, vibe: "trending" }
      : { title: "New This Week", limit: 4, vibe: "" };

  if (section && !section.enabled) {
    return { visible: false, title: section.title || defaults.title, places: [] };
  }

  const limit = clampLimit(section?.cardLimit, defaults.limit);
  const title = section?.title?.trim() || defaults.title;
  const vibe = (section?.vibeFilter ?? defaults.vibe).trim();

  let pool: Place[] = [];
  if (section && section.placeIds.length > 0) {
    pool = byIds(published, section.placeIds);
  } else if (vibe && vibe.toLowerCase() !== "trending") {
    pool = byMood(published, vibe);
  } else if (slot === "peek") {
    pool = [...published].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else {
    pool = trending;
  }

  if (pool.length === 0) {
    pool = trending.length > 0 ? trending : published;
  }

  return {
    visible: true,
    title,
    places: pool.slice(0, limit).map(toPlaceCardModel),
  };
}
