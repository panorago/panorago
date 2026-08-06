import type { MoodTag, Place, PlaceAmenityFlags, PlaceHighlights } from "@/types";

const SYNONYM_MAP: Record<string, string[]> = {
  pool: ["swimming", "swim"],
  wifi: ["wi-fi", "wifi", "starlink", "internet"],
  romantic: ["date night", "romance", "date"],
  coffee: ["coffee ritual", "cafe"],
  kids: ["kidfriendly", "kid friendly", "family", "family friendly"],
  pet: ["petfriendly", "pet friendly"],
  weekend: ["weekend away", "getaway"],
  lake: ["kariba"],
  falls: ["victoria falls", "waterfall"],
  spa: ["wellness", "massage", "relax"],
  night: ["tonight", "nightlife", "date night"],
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(" ").filter(Boolean);
}

function expandQueryTokens(query: string): string[] {
  const tokens = tokenize(query);
  const expanded = new Set<string>();

  for (const token of tokens) {
    expanded.add(token);
    const synonyms = SYNONYM_MAP[token];
    if (!synonyms) continue;

    for (const synonym of synonyms) {
      const normalized = normalizeText(synonym);
      if (normalized) expanded.add(normalized);
      for (const part of tokenize(synonym)) {
        expanded.add(part);
      }
    }
  }

  return [...expanded];
}

/** Levenshtein distance capped early for typo checks (distance <= 2). */
function levenshteinLite(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  const rows = a.length + 1;
  const cols = b.length + 1;
  let prev = Array.from({ length: cols }, (_, i) => i);
  let curr = new Array<number>(cols);

  for (let i = 1; i < rows; i++) {
    curr[0] = i;
    let rowMin = curr[0];

    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }

    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }

  return prev[b.length];
}

function tokenMatchesField(token: string, fieldNormalized: string, fieldTokens: string[]): number {
  if (!token || !fieldNormalized) return 0;

  if (fieldNormalized === token) return 1;
  if (fieldNormalized.includes(token)) return 0.85;

  let best = 0;
  for (const word of fieldTokens) {
    if (word === token) {
      best = Math.max(best, 1);
      continue;
    }
    if (word.startsWith(token) || token.startsWith(word)) {
      best = Math.max(best, 0.7);
      continue;
    }
    if (token.length >= 4 && word.length >= 4) {
      const distance = levenshteinLite(token, word, 2);
      if (distance <= 2) {
        best = Math.max(best, distance === 0 ? 1 : distance === 1 ? 0.55 : 0.4);
      }
    }
  }

  return best;
}

type WeightedField = { text: string; weight: number };

function amenitySearchTerms(amenities: PlaceAmenityFlags): string[] {
  const terms: string[] = [];

  for (const [key, value] of Object.entries(amenities)) {
    if (value === true) {
      terms.push(key);
      // camelCase → spaced words for friendlier matching
      terms.push(key.replace(/([a-z])([A-Z])/g, "$1 $2"));
    } else if (typeof value === "string" && value) {
      terms.push(key, value);
    }
  }

  return terms;
}

function highlightSearchTerms(highlights: PlaceHighlights): string[] {
  const terms: string[] = [];
  if (highlights.perfectFor?.length) terms.push(...highlights.perfectFor);
  if (highlights.dressVibe) terms.push(highlights.dressVibe);
  if (highlights.bestTime) terms.push(highlights.bestTime);
  if (highlights.goldenHour) terms.push(highlights.goldenHour);
  if (highlights.paymentMethods?.length) terms.push(...highlights.paymentMethods);
  if (highlights.averageSpend) terms.push(highlights.averageSpend);
  if (highlights.noiseLevel) terms.push(highlights.noiseLevel);
  if (highlights.openingHours) terms.push(highlights.openingHours);
  return terms;
}

function collectWeightedFields(place: Place): WeightedField[] {
  return [
    { text: place.name, weight: 12 },
    { text: place.city, weight: 9 },
    { text: place.location, weight: 8 },
    { text: place.category, weight: 7 },
    { text: place.mood.join(" "), weight: 8 },
    { text: place.priceGuide, weight: 4 },
    { text: place.story, weight: 3 },
    { text: place.panoraNotes, weight: 4 },
    { text: highlightSearchTerms(place.highlights).join(" "), weight: 5 },
    { text: amenitySearchTerms(place.amenities).join(" "), weight: 6 },
    { text: place.verifications.join(" "), weight: 5 },
    { text: place.country, weight: 3 },
  ];
}

function scorePlace(place: Place, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 1;

  const fields = collectWeightedFields(place).map((field) => {
    const normalized = normalizeText(field.text);
    return {
      weight: field.weight,
      normalized,
      tokens: tokenize(normalized),
    };
  });

  let score = 0;

  for (const token of queryTokens) {
    let tokenBest = 0;
    for (const field of fields) {
      const match = tokenMatchesField(token, field.normalized, field.tokens);
      if (match > 0) {
        tokenBest = Math.max(tokenBest, match * field.weight);
      }
    }
    score += tokenBest;
  }

  // Prefer places that hit more distinct query tokens
  const hitCount = queryTokens.filter((token) =>
    fields.some(
      (field) => tokenMatchesField(token, field.normalized, field.tokens) > 0,
    ),
  ).length;
  if (hitCount > 1) {
    score += hitCount * 1.5;
  }

  return score;
}

export function aiSearchPlaces(
  places: Place[],
  query: string,
  vibe?: MoodTag,
): Place[] {
  const trimmed = query.trim();
  const queryTokens = trimmed ? expandQueryTokens(trimmed) : [];

  const candidates = vibe
    ? places.filter((place) => place.mood.includes(vibe))
    : places;

  if (!trimmed) {
    return [...candidates];
  }

  return candidates
    .map((place) => ({ place, score: scorePlace(place, queryTokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .map((entry) => entry.place);
}

function trueAmenityKeys(amenities: PlaceAmenityFlags): Set<string> {
  return new Set(
    Object.entries(amenities)
      .filter(([, value]) => value === true)
      .map(([key]) => key),
  );
}

function sharesMoodOrAmenity(current: Place, other: Place): boolean {
  if (other.mood.some((mood) => current.mood.includes(mood))) return true;

  const currentAmenities = trueAmenityKeys(current.amenities);
  if (currentAmenities.size === 0) return false;

  return Object.entries(other.amenities).some(
    ([key, value]) => value === true && currentAmenities.has(key),
  );
}

function isDiverseFrom(current: Place, other: Place): boolean {
  return other.city !== current.city || other.category !== current.category;
}

export function getDiverseRecommendations(
  current: Place,
  all: Place[],
  limit = 4,
): Place[] {
  const others = all.filter(
    (place) => place.id !== current.id && place.published !== false,
  );

  if (others.length === 0 || limit <= 0) return [];

  const preferred = others.filter(
    (place) => isDiverseFrom(current, place) && sharesMoodOrAmenity(current, place),
  );

  const result: Place[] = [];
  const seen = new Set<string>();

  for (const place of preferred) {
    if (result.length >= limit) break;
    result.push(place);
    seen.add(place.id);
  }

  if (result.length < limit) {
    const fillers = others
      .filter((place) => !seen.has(place.id))
      .map((place) => {
        let rank = 0;
        if (isDiverseFrom(current, place)) rank += 4;
        if (sharesMoodOrAmenity(current, place)) rank += 3;
        if (place.city !== current.city) rank += 1;
        if (place.category !== current.category) rank += 1;
        return { place, rank };
      })
      .sort(
        (a, b) =>
          b.rank - a.rank || a.place.name.localeCompare(b.place.name),
      );

    for (const { place } of fillers) {
      if (result.length >= limit) break;
      result.push(place);
      seen.add(place.id);
    }
  }

  return result.slice(0, limit);
}
