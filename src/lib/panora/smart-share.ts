import { atmospheresForPlace } from "@/lib/panora/atmospheres";
import { absoluteUrl, whatsappUrl } from "@/lib/utils";
import type { Place } from "@/types";

/** Canonical SmartShare™ path — never a Google Maps URL. */
export function smartSharePath(slug: string) {
  return `/p/${encodeURIComponent(slug)}`;
}

export function smartShareUrl(slug: string, origin?: string | null) {
  return absoluteUrl(smartSharePath(slug), origin);
}

/** Full place page (enquiry, amenities) — linked from share landing. */
export function placeDetailPath(slug: string) {
  return `/panoras/${encodeURIComponent(slug)}`;
}

export function placeDetailUrl(slug: string, origin?: string | null) {
  return absoluteUrl(placeDetailPath(slug), origin);
}

export function smartShareMessage(place: Pick<Place, "name" | "city" | "slug" | "mood" | "category" | "amenities" | "story">) {
  const atmospheres = atmospheresForPlace(place, 3)
    .map((a) => a.label)
    .join(" · ");
  const url = smartShareUrl(place.slug);
  const lines = [
    `Discover ${place.name} on Panora Go`,
    `${place.city}${atmospheres ? ` · ${atmospheres}` : ""}`,
    "",
    url,
    "",
    "Discover. Connect. Belong.",
  ];
  return lines.join("\n");
}

export function smartShareWhatsAppUrl(
  place: Pick<Place, "name" | "city" | "slug" | "mood" | "category" | "amenities" | "story">,
  phone?: string | null,
) {
  const message = smartShareMessage(place);
  if (phone?.trim()) return whatsappUrl(phone, message);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function smartShareFacebookUrl(slug: string) {
  const url = smartShareUrl(slug);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function smartShareXUrl(place: Pick<Place, "name" | "slug" | "city">) {
  const url = smartShareUrl(place.slug);
  const text = `${place.name} · ${place.city} — discovered on Panora Go`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export function smartShareTelegramUrl(slug: string) {
  const url = smartShareUrl(slug);
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Discover this place on Panora Go")}`;
}

/** Navigation-only Maps URL — never use in share CTAs / copy / QR. */
export function googleMapsNavigateUrl(place: {
  name: string;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl?: string | null;
}) {
  if (place.latitude != null && place.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;
  }
  if (place.googleMapsUrl?.startsWith("http")) {
    return place.googleMapsUrl;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
}

export function ogDescriptionForPlace(place: Place) {
  const atmospheres = atmospheresForPlace(place, 3)
    .map((a) => a.label)
    .join(" · ");
  const storyBite =
    place.metaDescription?.trim() ||
    place.panoraNotes.slice(0, 120).trim() ||
    place.story.slice(0, 120).trim();
  const location = `${place.location}, ${place.city}`;
  const parts = [
    storyBite.endsWith(".") ? storyBite : `${storyBite}…`,
    atmospheres ? `Atmosphere: ${atmospheres}.` : null,
    location,
  ].filter(Boolean);
  return parts.join(" ").slice(0, 200);
}
