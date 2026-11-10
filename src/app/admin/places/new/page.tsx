import { PlaceForm } from "@/components/admin/place-form";
import { createPlace, getAdminSections } from "@/lib/admin/actions";
import { getPlaceSubmissions } from "@/lib/admin/command";
import type { Place, PlaceSubmission } from "@/types";

export const metadata = {
  title: "Admin · Add place",
};

function textList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function submissionDraft(sub: PlaceSubmission): Place {
  const extra = sub.payload ?? {};
  const pricingItems = Array.isArray(extra.pricing_items)
    ? extra.pricing_items.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const label = text((item as { label?: unknown }).label);
        const price = text((item as { price?: unknown }).price);
        return label && price ? [{ label, price }] : [];
      })
    : [];
  const amenities =
    extra.amenities &&
    typeof extra.amenities === "object" &&
    !Array.isArray(extra.amenities)
      ? (extra.amenities as Place["amenities"])
      : {};

  return {
    id: "",
    slug: "",
    name: sub.placeName,
    location: sub.location,
    city: sub.city,
    country: sub.country || "Zimbabwe",
    latitude: sub.latitude,
    longitude: sub.longitude,
    category: sub.category || "dining",
    mood: textList(extra.mood) as Place["mood"],
    story: sub.story,
    panoraNotes: text(extra.panora_notes) || sub.notes || "",
    highlights: {
      goldenHour: text(extra.golden_hour) || undefined,
      bestTime: text(extra.best_time) || undefined,
      dressVibe: text(extra.dress_vibe) || undefined,
      noiseLevel: text(extra.noise_level) || undefined,
      averageSpend: text(extra.average_spend) || undefined,
      openingHours: text(extra.opening_hours) || undefined,
      perfectFor: textList(extra.perfect_for),
      paymentMethods: textList(extra.payment_methods),
      searchTags: textList(extra.search_tags),
      searchKeywords: textList(extra.search_keywords),
      searchOccasions: textList(extra.search_occasions),
      searchSummary: text(extra.search_summary) || undefined,
      pricingItems,
    },
    amenities,
    contact: {
      email: text(extra.email) || sub.submitterEmail,
      phone: text(extra.phone) || sub.submitterPhone,
      whatsapp: sub.whatsapp,
      website: sub.website,
      instagram: text(extra.instagram) || null,
      facebook: text(extra.facebook) || null,
      tiktok: text(extra.tiktok) || null,
      googleMapsUrl: text(extra.google_maps_url) || null,
    },
    priceGuide: text(extra.price_guide),
    distanceKm: null,
    verified: false,
    published: false,
    featured: false,
    archived: false,
    paidTier: "basic",
    heroImage: sub.heroImage ?? "",
    gallery: textList(extra.gallery_urls),
    menuImageUrls: textList(extra.menu_image_urls),
    videoUrl: text(extra.video_url) || null,
    pricingItems,
    metaTitle: null,
    metaDescription: null,
    homepageSections: [],
    verifications: [],
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  };
}

export default async function AdminNewPlacePage({
  searchParams,
}: {
  searchParams: Promise<{ submission?: string }>;
}) {
  const { submission } = await searchParams;
  const [sections, submissions] = await Promise.all([
    getAdminSections(),
    submission ? getPlaceSubmissions() : Promise.resolve([]),
  ]);
  const source = submissions.find((item) => item.id === submission);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Add place</h1>
        <p className="mt-1 text-sm text-muted">
          {source
            ? `Prefilled from “${source.placeName}”. Saving creates an unpublished listing.`
            : "Create a new listing in Supabase. Unpublished places stay in draft."}
        </p>
      </div>
      <PlaceForm
        place={source ? submissionDraft(source) : undefined}
        action={createPlace}
        submitLabel="Create place"
        sectionChoices={sections.map((section) => ({
          key: section.key,
          title: section.title,
        }))}
      />
    </div>
  );
}
