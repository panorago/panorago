import {
  amenityLabels,
  profileForPlace,
} from "@/lib/search/search-profiles";
import type { Place } from "@/types";

/** Slim place record scored in the browser and summarised for Gemini. */
export type SearchPlace = {
  id: string;
  name: string;
  slug: string;
  vibe: string[];
  location: string;
  description: string;
  priceRange: string;
  heroImage?: string;
  tags: string[];
  amenities: string[];
  occasions: string[];
  searchKeywords: string[];
  summary: string;
};

function clip(value: string, max = 420): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

export function toSearchPlace(place: Place): SearchPlace {
  const profile = profileForPlace(place);
  const location = [place.location, place.city].filter(Boolean).join(", ");
  return {
    id: place.id,
    name: place.name,
    slug: place.slug,
    vibe: place.mood,
    location,
    description: clip(place.story || place.panoraNotes || ""),
    priceRange: place.priceGuide,
    heroImage: place.heroImage || undefined,
    tags: profile.tags,
    amenities: [
      ...profile.amenities,
      ...amenityLabels(place.amenities).filter(
        (label) =>
          !profile.amenities.some(
            (item) => item.toLowerCase() === label.toLowerCase(),
          ),
      ),
    ],
    occasions: profile.occasions,
    searchKeywords: profile.searchKeywords,
    summary: profile.summary,
  };
}

export function searchPlaceSummary(place: SearchPlace): string {
  return [
    `ID: ${place.id}`,
    `Name: ${place.name}`,
    `Summary: ${place.summary}`,
    `Tags: ${place.tags.join(", ")}`,
    `Amenities: ${place.amenities.join(", ")}`,
    `Occasions: ${place.occasions.join(", ")}`,
    `Keywords: ${place.searchKeywords.join(", ")}`,
    `Vibe: ${place.vibe.join(", ")}`,
    `Location: ${place.location}`,
    `Price: ${place.priceRange}`,
  ].join(" | ");
}
