import type { MoodTag, Place, PlaceAmenityFlags, PlaceHighlights } from "@/types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "to",
  "of",
  "in",
  "on",
  "at",
  "around",
  "near",
  "places",
  "place",
  "somewhere",
  "something",
  "with",
]);

const SYNONYM_MAP: Record<string, string[]> = {
  pool: ["swimming", "swim"],
  wifi: ["wi-fi", "wifi", "starlink", "internet"],
  romantic: ["date night", "romance", "anniversary", "couple"],
  romance: ["romantic", "date night"],
  relax: ["relaxation", "spa", "wellness", "quiet luxury"],
  relaxation: ["spa", "wellness", "quiet luxury", "massage", "retreat"],
  food: ["dining", "restaurant", "kitchen", "lunch", "dinner"],
  eat: ["dining", "restaurant", "food"],
  restaurant: ["dining", "food", "kitchen"],
  coffee: ["coffee ritual", "cafe"],
  kids: ["kidfriendly", "kid friendly", "family", "family friendly"],
  pet: ["petfriendly", "pet friendly"],
  weekend: ["weekend away", "getaway", "escape"],
  activity: ["outdoors", "experience", "weekend"],
  activities: ["outdoors", "experience", "weekend"],
  harare: ["harare"],
  lake: ["kariba"],
  falls: ["victoria falls", "waterfall"],
  spa: ["wellness", "massage", "relax", "relaxation"],
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

function synonymsFor(token: string): string[] {
  if (SYNONYM_MAP[token]) return SYNONYM_MAP[token];
  if (token.length < 5) return [];
  for (const key of Object.keys(SYNONYM_MAP)) {
    if (Math.abs(key.length - token.length) > 1) continue;
    if (levenshteinLite(token, key, 1) <= 1) return SYNONYM_MAP[key];
  }
  return [];
}

type QueryToken = { token: string; fromSynonym: boolean };

function expandQueryTokens(query: string): QueryToken[] {
  const tokens = tokenize(query).filter((token) => !STOP_WORDS.has(token));
  const expanded: QueryToken[] = [];
  const seen = new Set<string>();

  const add = (token: string, fromSynonym: boolean) => {
    if (!token || seen.has(token)) return;
    seen.add(token);
    expanded.push({ token, fromSynonym });
  };

  for (const token of tokens) {
    add(token, false);
    for (const synonym of synonymsFor(token)) {
      const normalized = normalizeText(synonym);
      if (!normalized) continue;
      add(normalized, true);
      if (normalized.includes(" ")) {
        for (const part of tokenize(normalized)) {
          if (part.length >= 5) add(part, true);
        }
      }
    }
  }

  return expanded;
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
  if (token.length >= 4 && fieldNormalized.includes(token)) {
    const padded = ` ${fieldNormalized} `;
    return padded.includes(` ${token} `) ? 1 : 0.8;
  }

  let best = 0;
  for (const word of fieldTokens) {
    if (word === token) {
      best = Math.max(best, 1);
      continue;
    }
    if (
      token.length >= 4 &&
      Math.abs(word.length - token.length) <= 3 &&
      (word.startsWith(token) || token.startsWith(word))
    ) {
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
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) terms.push(item);
      }
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
    { text: (place.tags ?? []).join(" "), weight: 7 },
    { text: (place.occasions ?? []).join(" "), weight: 6 },
    { text: (place.searchKeywords ?? []).join(" "), weight: 6 },
    { text: place.summary ?? "", weight: 4 },
  ];
}

export function scoreSearchFields(
  query: string,
  fields: WeightedField[],
): number {
  const queryTokens = expandQueryTokens(query);
  if (queryTokens.length === 0) return 0;

  const prepared = fields.map((field) => {
    const normalized = normalizeText(field.text);
    return {
      weight: field.weight,
      normalized,
      tokens: tokenize(normalized),
    };
  });

  let score = 0;
  for (const queryToken of queryTokens) {
    let tokenBest = 0;
    for (const field of prepared) {
      if (queryToken.fromSynonym && field.weight < 6) continue;
      const match = tokenMatchesField(
        queryToken.token,
        field.normalized,
        field.tokens,
      );
      if (match > 0) tokenBest = Math.max(tokenBest, match * field.weight);
    }
    score += tokenBest;
  }
  return score;
}

function scorePlace(place: Place, query: string): number {
  if (!query.trim()) return 1;
  return scoreSearchFields(query, collectWeightedFields(place));
}

export function aiSearchPlaces(
  places: Place[],
  query: string,
  vibe?: MoodTag,
): Place[] {
  const trimmed = query.trim();

  const candidates = vibe
    ? places.filter((place) => place.mood.includes(vibe))
    : places;

  if (!trimmed) {
    return [...candidates];
  }

  return candidates
    .map((place) => ({ place, score: scorePlace(place, trimmed) }))
    .filter((entry) => entry.score >= 5)
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
