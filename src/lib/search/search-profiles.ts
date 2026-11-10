import type { Place, PlaceAmenityFlags } from "@/types";

export type PlaceSearchProfile = {
  tags: string[];
  amenities: string[];
  occasions: string[];
  searchKeywords: string[];
  summary: string;
};

/** Curated search copy for the published seed catalogue, keyed by slug. */
const PROFILES: Record<string, PlaceSearchProfile> = {
  "baobab-braai-garden": {
    tags: ["outdoor", "braai", "fire", "relaxed", "local"],
    amenities: ["parking", "braai-area", "child-friendly"],
    occasions: ["family outing", "group", "casual dinner", "tonight"],
    searchKeywords: [
      "BBQ",
      "fire",
      "bonfire",
      "maize",
      "woodsmoke",
      "outdoor dining",
      "grill",
    ],
    summary:
      "Outdoor braai garden off Banket Road in Chinhoyi — woodsmoke, open fires, maize roasting, relaxed evening atmosphere",
  },
  "mandara-kitchen": {
    tags: ["restaurant", "dining", "intimate", "local-cuisine", "quiet"],
    amenities: ["parking", "bar"],
    occasions: ["date night", "anniversary", "dinner", "business lunch"],
    searchKeywords: [
      "restaurant",
      "food",
      "dinner",
      "eat",
      "local food",
      "Zimbabwean cuisine",
      "dining",
    ],
    summary:
      "Quiet intimate restaurant on Magamba Way Chinhoyi — local flavours, honest cooking, good for date night",
  },
  "caves-edge-lodge": {
    tags: ["lodge", "nature", "escape", "cave", "limestone", "adventure"],
    amenities: ["accommodation", "parking", "solar", "borehole"],
    occasions: ["weekend away", "romantic escape", "adventure", "nature trip"],
    searchKeywords: [
      "caves",
      "limestone",
      "nature",
      "lodge",
      "stay",
      "chinhoyi caves",
      "overnight",
      "sleep",
    ],
    summary:
      "Bush lodge near Chinhoyi Caves — limestone cave views, nature immersion, overnight stays from $95/night",
  },
  "sleeping-pool-lookout": {
    tags: ["scenic", "viewpoint", "golden-hour", "photography", "nature", "free"],
    amenities: ["parking"],
    occasions: ["solo", "romantic", "photography", "day trip"],
    searchKeywords: [
      "viewpoint",
      "view",
      "sunset",
      "lookout",
      "photo spot",
      "blue water",
      "cave pool",
      "golden hour",
    ],
    summary:
      "Scenic lookout over the Chinhoyi Caves Sleeping Pool — vivid blue limestone water, golden hour photography spot",
  },
  "copper-bean-coffee": {
    tags: ["coffee", "cafe", "morning", "quiet", "work-friendly", "casual"],
    amenities: ["Wi-Fi", "seating", "parking"],
    occasions: ["solo", "work", "catch-up", "morning ritual", "coffee ritual"],
    searchKeywords: [
      "coffee",
      "cafe",
      "espresso",
      "morning",
      "work",
      "study",
      "chill",
      "flat white",
      "cappuccino",
    ],
    summary:
      "Specialty coffee shop on Independence Way Chinhoyi — morning ritual spot, quality espresso, relaxed atmosphere",
  },
  "mlichi-farm-stay": {
    tags: ["farm", "rural", "escape", "nature", "peaceful", "authentic"],
    amenities: ["accommodation", "parking", "borehole", "solar", "outdoor-space"],
    occasions: ["family outing", "weekend away", "escape", "nature trip"],
    searchKeywords: [
      "farm",
      "rural",
      "countryside",
      "nature stay",
      "mango trees",
      "quiet",
      "farmhouse",
      "gravel road",
    ],
    summary:
      "Farm stay west of Chinhoyi off Alaska Road — mango trees, peaceful farmhouse, rural escape from $70/night",
  },
  "kariba-houseboat-serenity": {
    tags: ["houseboat", "lake", "water", "luxury", "kariba", "sunset", "unique"],
    amenities: ["accommodation", "water-activities", "bar", "solar"],
    occasions: [
      "romantic escape",
      "anniversary",
      "weekend away",
      "group",
      "honeymoon",
    ],
    searchKeywords: [
      "boat",
      "lake",
      "Kariba",
      "water",
      "sunset on water",
      "houseboat",
      "dam",
      "floating",
      "cruise",
    ],
    summary:
      "Houseboat on Lake Kariba from Andora Harbour — drifts into coves, horizon sunsets, $180/night",
  },
  "victoria-falls-river-lodge": {
    tags: ["lodge", "victoria-falls", "zambezi", "luxury", "nature", "bucket-list"],
    amenities: ["accommodation", "pool", "bar", "parking", "Wi-Fi"],
    occasions: [
      "honeymoon",
      "anniversary",
      "bucket list",
      "weekend away",
      "special occasion",
    ],
    searchKeywords: [
      "Vic Falls",
      "Victoria Falls",
      "Zambezi",
      "luxury lodge",
      "waterfall",
      "safari lodge",
      "falls",
    ],
    summary:
      "Luxury river lodge in Zambezi National Park near Victoria Falls — premium wilderness stay from $450/night",
  },
};

const FLAG_LABELS: Record<string, string> = {
  wifi: "Wi-Fi",
  parking: "parking",
  solar: "solar",
  borehole: "borehole",
  starlink: "Starlink",
  kidFriendly: "child-friendly",
  petFriendly: "pet-friendly",
  wheelchairAccess: "wheelchair-accessible",
  fireplace: "fireplace",
  swimming: "pool",
  outdoorSeating: "outdoor-space",
  music: "live-music",
  power: "power",
  security: "security",
  photography: "photography",
};

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function amenityLabels(amenities: PlaceAmenityFlags | undefined): string[] {
  if (!amenities) return [];
  const labels: string[] = [];
  for (const [key, value] of Object.entries(amenities)) {
    if (value === true && FLAG_LABELS[key]) labels.push(FLAG_LABELS[key]);
    if (key === "other" && Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") labels.push(item);
      }
    }
  }
  return unique(labels);
}

function firstSentence(story: string): string {
  const trimmed = story.replace(/\s+/g, " ").trim();
  const match = trimmed.match(/^.{24,220}?\./);
  return (match?.[0] ?? trimmed.slice(0, 180)).trim();
}

function fallbackProfile(place: Place): PlaceSearchProfile {
  const tags = unique([
    String(place.category ?? ""),
    ...place.mood.map((mood) => mood.toLowerCase()),
  ]);
  const occasions = unique([
    ...(place.highlights.perfectFor ?? []).map((item) => item.toLowerCase()),
    ...place.mood.map((mood) => mood.toLowerCase()),
  ]);
  return {
    tags,
    amenities: amenityLabels(place.amenities),
    occasions,
    searchKeywords: [],
    summary: place.metaDescription?.trim() || firstSentence(place.story || place.name),
  };
}

export function profileForPlace(place: Place): PlaceSearchProfile {
  return PROFILES[place.slug] ?? fallbackProfile(place);
}

export function enrichPlaceSearch(place: Place): Place {
  const profile = profileForPlace(place);
  return {
    ...place,
    tags: place.tags?.length ? place.tags : profile.tags,
    occasions: place.occasions?.length ? place.occasions : profile.occasions,
    searchKeywords: place.searchKeywords?.length
      ? place.searchKeywords
      : profile.searchKeywords,
    summary: place.summary?.trim() ? place.summary : profile.summary,
  };
}
