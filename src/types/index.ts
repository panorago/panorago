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

export type VerificationKey =
  | "photos_verified"
  | "accurate_pricing"
  | "family_friendly"
  | "solar_power"
  | "borehole_water"
  | "starlink";

export type PaidTier = "basic" | "silver" | "gold" | "platinum";

export type ProfileRole = "admin" | "editor" | "viewer" | "suspended";

export type PlaceSubmissionStatus = "pending" | "approved" | "rejected";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "unavailable"
  | "cancelled"
  | "completed";

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

export interface PricingItem {
  label: string;
  price: string;
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
  /** Optional sneak-peek pricing rows for admin / detail UI later */
  pricingItems?: PricingItem[];
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

export interface VerificationBadge {
  id: string;
  key: string;
  label: string;
  icon?: string;
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
  featured: boolean;
  archived: boolean;
  paidTier: PaidTier;
  heroImage: string;
  gallery: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  homepageSections: HomepageSectionKey[];
  verifications: string[];
  /** Optional structured pricing sneak peek (admin / detail later) */
  pricingItems?: PricingItem[];
  /** Optional venue video (mp4 URL or YouTube/Vimeo) shown below hero */
  videoUrl?: string | null;
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
  pinned?: boolean;
  reported?: boolean;
  createdAt: string;
  feeling?: string | null;
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

export interface SecretCollection {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  sortOrder: number;
  enabled: boolean;
  placeIds: string[];
}

export interface AdminProfile {
  id: string;
  email: string;
  role: ProfileRole;
  displayName: string | null;
  suspendedAt?: string | null;
  /** From admin_credentials — password itself is in Supabase Auth. */
  passwordUpdatedAt?: string | null;
  mustReset?: boolean;
  credentialsActive?: boolean;
}

export interface PlaceSubmission {
  id: string;
  status: PlaceSubmissionStatus;
  submitterName: string;
  submitterEmail: string | null;
  submitterPhone: string | null;
  placeName: string;
  location: string;
  city: string;
  country: string;
  category: string;
  story: string;
  website: string | null;
  whatsapp: string | null;
  latitude: number | null;
  longitude: number | null;
  heroImage: string | null;
  notes: string | null;
  createdPlaceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  whatsapp: string;
  email: string;
  phone: string;
  phoneDisplay: string;
  heroVideoUrl: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  mapsApiKeyNote: string;
}

export interface MediaAsset {
  id: string;
  bucket: string;
  path: string;
  publicUrl: string | null;
  filename: string;
  contentType: string | null;
  sizeBytes: number | null;
  alt: string;
  tags: string[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface BookingHistoryEntry {
  at: string;
  event: string;
  status?: string;
  note?: string;
  actorId?: string | null;
}

export interface Booking {
  id: string;
  bookingReference: string;
  customerNumber: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  venueId: string | null;
  venueName: string;
  venueAddress: string | null;
  preferredDate: string | null;
  adults: number;
  children: number;
  occasion: string | null;
  budget: string | null;
  specialRequest: string | null;
  status: BookingStatus;
  qrCodeUrl: string | null;
  ticketPdfUrl: string | null;
  history: BookingHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
