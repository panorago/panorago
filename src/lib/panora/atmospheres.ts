import type { MoodTag, Place, PlaceCategory } from "@/types";

/**
 * Curated Panora Atmospheres™ — feeling-first labels for discovery & SmartShare.
 * Prefer these over raw tags in share landings and share cards.
 */
export type PanoraAtmosphere = {
  id: string;
  label: string;
  /** Short line for OG / share cards */
  whisper: string;
};

export const PANORA_ATMOSPHERES: readonly PanoraAtmosphere[] = [
  {
    id: "golden-hour",
    label: "Golden Hour",
    whisper: "Light that turns ordinary into unforgettable",
  },
  {
    id: "quiet-luxury",
    label: "Quiet Luxury",
    whisper: "Soft edges, unhurried evenings",
  },
  {
    id: "hidden-escape",
    label: "Hidden Escape",
    whisper: "Off the usual map, worth the turn",
  },
  {
    id: "date-night",
    label: "Date Night",
    whisper: "Made for two and a long conversation",
  },
  {
    id: "weekend-away",
    label: "Weekend Away",
    whisper: "Leave Friday — return changed",
  },
  {
    id: "coffee-ritual",
    label: "Coffee Ritual",
    whisper: "Morning pace, proper cup",
  },
  {
    id: "tonight",
    label: "Tonight",
    whisper: "Energy after dark",
  },
  {
    id: "celebration",
    label: "Celebration",
    whisper: "Occasions that deserve a setting",
  },
  {
    id: "water-whisper",
    label: "Water Whisper",
    whisper: "Shorelines, pools, and cool air",
  },
  {
    id: "wilderness-quiet",
    label: "Wilderness Quiet",
    whisper: "Space between the noise",
  },
  {
    id: "firelight",
    label: "Firelight",
    whisper: "Warmth after the sun drops",
  },
  {
    id: "family-warmth",
    label: "Family Warmth",
    whisper: "Room for everyone to belong",
  },
  {
    id: "city-glow",
    label: "City Glow",
    whisper: "Urban polish with local soul",
  },
  {
    id: "adventure-pulse",
    label: "Adventure Pulse",
    whisper: "Movement, views, a little courage",
  },
  {
    id: "serene-waters",
    label: "Serene Waters",
    whisper: "Blue calm that resets the week",
  },
  {
    id: "mist-mystery",
    label: "Mist & Mystery",
    whisper: "Places that keep a secret",
  },
] as const;

const BY_ID = new Map(PANORA_ATMOSPHERES.map((a) => [a.id, a]));

const MOOD_TO_ATMOSPHERE: Record<MoodTag, string> = {
  "Golden Hour": "golden-hour",
  "Date Night": "date-night",
  "Hidden Escape": "hidden-escape",
  "Weekend Away": "weekend-away",
  "Coffee Ritual": "coffee-ritual",
  Tonight: "tonight",
  "Quiet Luxury": "quiet-luxury",
  Celebration: "celebration",
};

const CATEGORY_ATMOSPHERES: Partial<Record<PlaceCategory, string[]>> = {
  dining: ["city-glow", "date-night"],
  escape: ["hidden-escape", "quiet-luxury"],
  nightlife: ["tonight", "celebration"],
  wellness: ["quiet-luxury", "serene-waters"],
  culture: ["mist-mystery", "city-glow"],
  outdoors: ["wilderness-quiet", "adventure-pulse"],
  coffee: ["coffee-ritual", "city-glow"],
  weekend: ["weekend-away", "hidden-escape"],
};

function pushUnique(
  ids: string[],
  seen: Set<string>,
  id: string | undefined,
) {
  if (!id || seen.has(id) || !BY_ID.has(id)) return;
  seen.add(id);
  ids.push(id);
}

/** Map a place’s moods, category, and amenities into Panora Atmospheres. */
export function atmospheresForPlace(
  place: Pick<Place, "mood" | "category" | "amenities" | "story" | "name">,
  limit = 5,
): PanoraAtmosphere[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const mood of place.mood) {
    pushUnique(ids, seen, MOOD_TO_ATMOSPHERE[mood]);
  }

  for (const id of CATEGORY_ATMOSPHERES[place.category as PlaceCategory] ?? []) {
    pushUnique(ids, seen, id);
  }

  const { amenities } = place;
  if (amenities.swimming || amenities.borehole) {
    pushUnique(ids, seen, "water-whisper");
    pushUnique(ids, seen, "serene-waters");
  }
  if (amenities.fireplace) pushUnique(ids, seen, "firelight");
  if (amenities.kidFriendly) pushUnique(ids, seen, "family-warmth");
  if (amenities.photography) pushUnique(ids, seen, "golden-hour");

  const text = `${place.name} ${place.story}`.toLowerCase();
  if (/\bcave|mist|secret|hidden\b/.test(text)) {
    pushUnique(ids, seen, "mist-mystery");
  }
  if (/\blake|river|harbour|harbor|falls|water\b/.test(text)) {
    pushUnique(ids, seen, "serene-waters");
  }
  if (/\bsafari|bush|wilderness|trail\b/.test(text)) {
    pushUnique(ids, seen, "wilderness-quiet");
    pushUnique(ids, seen, "adventure-pulse");
  }

  if (ids.length === 0) {
    pushUnique(ids, seen, "hidden-escape");
  }

  return ids
    .slice(0, limit)
    .map((id) => BY_ID.get(id)!)
    .filter(Boolean);
}

export function atmosphereLabels(place: Place, limit = 5): string[] {
  return atmospheresForPlace(place, limit).map((a) => a.label);
}
