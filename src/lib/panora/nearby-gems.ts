import { haversineKm } from "@/lib/maps/geo";
import { atmospheresForPlace } from "@/lib/panora/atmospheres";
import type { Place } from "@/types";

function atmosphereOverlap(a: Place, b: Place): number {
  const aIds = new Set(atmospheresForPlace(a, 6).map((x) => x.id));
  return atmospheresForPlace(b, 6).filter((x) => aIds.has(x.id)).length;
}

/**
 * Nearby Gems for SmartShare landings — distance + atmosphere + popularity signals.
 */
export function getNearbyGems(
  current: Place,
  all: Place[],
  limit = 4,
): Place[] {
  const candidates = all.filter(
    (p) => p.id !== current.id && p.published !== false && !p.archived,
  );

  const scored = candidates.map((place) => {
    let score = 0;
    const hasCoords =
      current.latitude != null &&
      current.longitude != null &&
      place.latitude != null &&
      place.longitude != null;

    let distanceKm: number | null = null;
    if (hasCoords) {
      distanceKm = haversineKm(
        current.latitude!,
        current.longitude!,
        place.latitude!,
        place.longitude!,
      );
      if (distanceKm < 15) score += 8;
      else if (distanceKm < 40) score += 5;
      else if (distanceKm < 120) score += 2;
    } else if (place.city === current.city) {
      score += 6;
    }

    score += atmosphereOverlap(current, place) * 3;
    if (place.mood.some((m) => current.mood.includes(m))) score += 2;
    if (place.featured) score += 2;
    if (place.verified) score += 1;
    if (place.category === current.category) score += 1;

    return { place, score, distanceKm };
  });

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999) ||
      a.place.name.localeCompare(b.place.name),
  );

  return scored.slice(0, limit).map((s) => s.place);
}
