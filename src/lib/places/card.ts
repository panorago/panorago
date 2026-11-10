import type { Place } from "@/types";

/** Fields a place card needs. Kept small so the wishlist can render without another fetch. */
export type PlaceCardModel = Pick<
  Place,
  | "id"
  | "slug"
  | "name"
  | "location"
  | "city"
  | "story"
  | "heroImage"
  | "mood"
  | "verified"
  | "priceGuide"
  | "distanceKm"
>;

export function toPlaceCardModel(place: Place): PlaceCardModel {
  const raw = place.story ?? "";
  const story = raw.length > 160 ? `${raw.slice(0, 159).trimEnd()}…` : raw;
  return {
    id: place.id,
    slug: place.slug,
    name: place.name,
    location: place.location,
    city: place.city,
    story,
    heroImage: place.heroImage ?? "",
    mood: place.mood ?? [],
    verified: place.verified,
    priceGuide: place.priceGuide,
    distanceKm: place.distanceKm,
  };
}
