export type ThemeMode = "light" | "dark" | "system";

export type PlaceCategory =
  | "dining"
  | "escape"
  | "nightlife"
  | "wellness"
  | "culture"
  | "outdoors"
  | "coffee"
  | "weekend";

export type MoodTag =
  | "Golden Hour"
  | "Date Night"
  | "Hidden Escape"
  | "Weekend Away"
  | "Coffee Ritual"
  | "Tonight"
  | "Quiet Luxury"
  | "Celebration";

export type HomepageSectionKey =
  | "trending"
  | "new_discoveries"
  | "panora_picks"
  | "weekend_escape"
  | "editors_choice";

export interface PlaceAmenityFlags {
  power?: boolean;
  solar?: boolean;
  borehole?: boolean;
  wifi?: boolean;
  starlink?: boolean;
  petFriendly?: boolean;
  kidFriendly?: boolean;
  wheelchairAccess?: boolean;
  parking?: boolean;
  security?: boolean;
  swimming?: boolean;
  fireplace?: boolean;
  outdoorSeating?: boolean;
  music?: boolean;
  photography?: boolean;
  phoneSignal?: "strong" | "moderate" | "weak" | "none";
  roadCondition?: "excellent" | "good" | "fair" | "challenging";
}

export interface PlaceHighlights {
  goldenHour?: string;
  bestTime?: string;
  dressVibe?: string;
  noiseLevel?: string;
  perfectFor?: string[];
  paymentMethods?: string[];
  averageSpend?: string;
  openingHours?: string;
}

export interface PlaceContact {
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  googleMapsUrl?: string | null;
}

export interface PlaceImage {
  id: string;
  placeId: string;
  url: string;
  alt: string;
  sortOrder: number;
  isHero?: boolean;
}

export interface Place {
  id: string;
  slug: string;
  name: string;
  location: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  category: PlaceCategory;
  mood: MoodTag[];
  story: string;
  panoraNotes: string;
  highlights: PlaceHighlights;
  amenities: PlaceAmenityFlags;
  contact: PlaceContact;
  priceGuide: string;
  distanceKm: number | null;
  verified: boolean;
  published: boolean;
  heroImage: string;
  gallery: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  homepageSections: HomepageSectionKey[];
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceStory {
  id: string;
  placeId: string;
  authorName: string;
  body: string;
  likesCount: number;
  published: boolean;
  createdAt: string;
  likedByMe?: boolean;
}

export interface HomepageSection {
  id: string;
  key: HomepageSectionKey;
  title: string;
  subtitle: string;
  sortOrder: number;
  enabled: boolean;
  placeIds: string[];
}

export interface AdminProfile {
  id: string;
  email: string;
  role: "admin";
  displayName: string | null;
}
