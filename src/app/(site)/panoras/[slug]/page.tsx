import { PlaceListing } from "@/components/place/place-listing";
import { SEED_PLACES } from "@/data/seed-places";
import {
  getPlaceBySlug,
  getPublishedPlaces,
  getRecommendationsForPlace,
  getStoriesForPlace,
} from "@/lib/data/places";
import { JsonLd } from "@/components/seo/json-ld";
import { smartShareUrl } from "@/lib/panora/smart-share";
import { titleWithoutBrandSuffix } from "@/lib/text/repair-stored-text";
import { absoluteUrl } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 120;

export async function generateStaticParams() {
  const places = await getPublishedPlaces().catch(() =>
    SEED_PLACES.filter((p) => p.published),
  );
  return places.map((place) => ({ slug: place.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) {
    return { title: "Place not found" };
  }

  const title = titleWithoutBrandSuffix(
    place.metaTitle ?? `${place.name} — ${place.city}`,
  );
  const description =
    place.metaDescription ??
    (place.panoraNotes.slice(0, 155) || place.story.slice(0, 155));
  const canonical = absoluteUrl(`/panoras/${place.slug}`);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "Panora Go",
      locale: "en_ZW",
      images: [
        {
          url: absoluteUrl(`/p/${place.slug}/opengraph-image`),
          width: 1200,
          height: 630,
          alt: `${place.name} — ${place.city} | Panora Go`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(`/p/${place.slug}/opengraph-image`)],
    },
  };
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) notFound();

  const [stories, recommendations] = await Promise.all([
    getStoriesForPlace(place.id),
    getRecommendationsForPlace(place.slug),
  ]);
  const gallery =
    place.gallery.length > 0 ? place.gallery : [place.heroImage];

  const placeUrl = absoluteUrl(`/panoras/${place.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Place", "LocalBusiness", "TouristAttraction"],
    "@id": `${placeUrl}#place`,
    name: place.name,
    description: place.story.slice(0, 300),
    image: gallery,
    address: {
      "@type": "PostalAddress",
      streetAddress: place.location,
      addressLocality: place.city,
      addressCountry: place.country,
    },
    geo:
      place.latitude != null && place.longitude != null
        ? {
            "@type": "GeoCoordinates",
            latitude: place.latitude,
            longitude: place.longitude,
          }
        : undefined,
    url: placeUrl,
    mainEntityOfPage: placeUrl,
    telephone: place.contact.phone ?? undefined,
    email: place.contact.email ?? undefined,
    sameAs: [
      place.contact.website,
      place.contact.instagram
        ? `https://instagram.com/${place.contact.instagram.replace("@", "")}`
        : null,
      place.contact.facebook,
      smartShareUrl(place.slug),
    ].filter(Boolean),
    priceRange: place.priceGuide || undefined,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PlaceListing
        place={place}
        stories={stories}
        recommendations={recommendations}
      />
    </>
  );
}
