import { Reveal } from "@/components/motion/reveal";
import { ProgressiveImage } from "@/components/media/progressive-image";
import { EnquiryPanel } from "@/components/place/enquiry-panel";
import { ExperienceStories } from "@/components/place/experience-stories";
import { GalleryLightbox } from "@/components/place/gallery-lightbox";
import { HighlightsPanel } from "@/components/place/highlights-panel";
import { InterestedIn } from "@/components/place/interested-in";
import { PlaceDirectionsMapDynamic } from "@/components/place/place-directions-map-dynamic";
import { PricingSneakPeek } from "@/components/place/pricing-sneak-peek";
import { VerificationBadges } from "@/components/place/verification-badges";
import { SEED_PLACES } from "@/data/seed-places";
import {
  getPlaceBySlug,
  getPublishedPlaces,
  getRecommendationsForPlace,
  getStoriesForPlace,
} from "@/lib/data/places";
import { absoluteUrl, formatDistance, formatPriceGuide } from "@/lib/utils";
import {
  BadgeCheck,
  ExternalLink,
  Globe,
  MapPin,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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

  const title = place.metaTitle ?? `${place.name} — ${place.city}`;
  const description =
    place.metaDescription ??
    (place.panoraNotes.slice(0, 155) || place.story.slice(0, 155));

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/panoras/${place.slug}`),
      type: "article",
      images: [{ url: place.heroImage, alt: place.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [place.heroImage],
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
  const hasCoords = place.latitude != null && place.longitude != null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Place", "LocalBusiness"],
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
    url: absoluteUrl(`/panoras/${place.slug}`),
    telephone: place.contact.phone ?? undefined,
    email: place.contact.email ?? undefined,
    sameAs: [
      place.contact.website,
      place.contact.instagram
        ? `https://instagram.com/${place.contact.instagram.replace("@", "")}`
        : null,
      place.contact.facebook,
    ].filter(Boolean),
    priceRange: place.priceGuide,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative min-h-[70vh] overflow-hidden pt-[var(--nav-height)]">
        <ProgressiveImage
          src={place.heroImage}
          alt={place.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          containerClassName="absolute inset-0"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--hero-overlay)" }}
          aria-hidden
        />
        <div className="relative z-10 container-panora flex min-h-[60vh] flex-col justify-end pb-12 pt-16 text-white">
          <div className="flex flex-wrap gap-2">
            {place.mood.map((tag) => (
              <Link
                key={tag}
                href={`/discover?vibe=${encodeURIComponent(tag)}`}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-md hover:bg-white/25"
              >
                {tag}
              </Link>
            ))}
          </div>
          <h1 className="mt-4 font-display text-4xl leading-tight md:text-6xl">
            {place.name}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {place.location}, {place.city}
            </span>
            {formatDistance(place.distanceKm) && (
              <span>· {formatDistance(place.distanceKm)}</span>
            )}
            <span>· {formatPriceGuide(place.priceGuide)}</span>
            {place.verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-semibold text-[var(--brand-navy)]">
                <BadgeCheck className="h-4 w-4" />
                Panora Verified
              </span>
            )}
          </p>
        </div>
      </section>

      <div className="gradient-mesh">
        <div className="container-panora grid gap-10 py-[var(--space-section)] lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-14 min-w-0">
            {(place.verified || place.verifications.length > 0) && (
              <Reveal>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Panora Verified
                </p>
                <h2 className="mt-2 mb-4 font-display text-2xl">
                  What we checked
                </h2>
                <VerificationBadges
                  keys={place.verifications}
                  showPanoraVerified={place.verified}
                />
              </Reveal>
            )}

            <Reveal>
              <GalleryLightbox images={gallery} placeName={place.name} />
            </Reveal>

            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                The story
              </p>
              <h2 className="mt-2 font-display text-3xl">Atmosphere & arrival</h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-[var(--foreground)]">
                {place.story.split(/\n\n+/).map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
            </Reveal>

            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Panora notes
              </p>
              <h2 className="mt-2 font-display text-3xl">Insider guidance</h2>
              <p className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-6 text-sm leading-relaxed">
                {place.panoraNotes}
              </p>
            </Reveal>

            <Reveal>
              <PricingSneakPeek place={place} />
            </Reveal>

            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Highlights
              </p>
              <h2 className="mt-2 mb-6 font-display text-3xl">
                Know before you go
              </h2>
              <HighlightsPanel
                highlights={place.highlights}
                amenities={place.amenities}
              />
            </Reveal>

            {(place.contact.website ||
              place.contact.instagram ||
              place.contact.facebook ||
              place.contact.googleMapsUrl) && (
              <Reveal>
                <h2 className="font-display text-2xl">Links & maps</h2>
                <ul className="mt-4 flex flex-wrap gap-3">
                  {place.contact.website && (
                    <li>
                      <a
                        href={place.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:border-[var(--accent)]"
                      >
                        <Globe className="h-4 w-4 text-[var(--accent)]" />
                        Website
                        <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                      </a>
                    </li>
                  )}
                  {place.contact.instagram && (
                    <li>
                      <a
                        href={`https://instagram.com/${place.contact.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:border-[var(--accent)]"
                      >
                        <Globe className="h-4 w-4 text-[var(--accent)]" />
                        {place.contact.instagram}
                      </a>
                    </li>
                  )}
                  {place.contact.facebook && (
                    <li>
                      <a
                        href={
                          place.contact.facebook.startsWith("http")
                            ? place.contact.facebook
                            : `https://facebook.com/${place.contact.facebook}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:border-[var(--accent)]"
                      >
                        <Globe className="h-4 w-4 text-[var(--accent)]" />
                        Facebook
                      </a>
                    </li>
                  )}
                  {place.contact.googleMapsUrl && (
                    <li>
                      <a
                        href={place.contact.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:border-[var(--accent)]"
                      >
                        <MapPin className="h-4 w-4 text-[var(--accent)]" />
                        Open in Maps
                      </a>
                    </li>
                  )}
                </ul>
              </Reveal>
            )}

            {hasCoords ? (
              <Reveal>
                <PlaceDirectionsMapDynamic
                  name={place.name}
                  lat={place.latitude!}
                  lng={place.longitude!}
                  googleMapsUrl={place.contact.googleMapsUrl}
                />
              </Reveal>
            ) : null}

            <Reveal>
              <ExperienceStories
                placeId={place.id}
                placeName={place.name}
                initialStories={stories}
              />
            </Reveal>

            <InterestedIn places={recommendations} />
          </div>

          <div className="lg:pt-2">
            <EnquiryPanel placeName={place.name} placeSlug={place.slug} />
          </div>
        </div>
      </div>
    </>
  );
}
