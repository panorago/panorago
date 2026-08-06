import { ProgressiveImage } from "@/components/media/progressive-image";
import { Reveal } from "@/components/motion/reveal";
import { GalleryLightbox } from "@/components/place/gallery-lightbox";
import { PlaceVideo } from "@/components/place/place-video";
import { SaveButton } from "@/components/place/save-button";
import { AtmosphereBadges } from "@/components/smart-share/atmosphere-badges";
import { MapsFinale } from "@/components/smart-share/maps-finale";
import { NearbyGems } from "@/components/smart-share/nearby-gems";
import { PanoraCircle } from "@/components/smart-share/panora-circle";
import { SmartShareButton } from "@/components/smart-share/smart-share-button";
import { ViralShareBand } from "@/components/smart-share/viral-share-band";
import { SEED_PLACES } from "@/data/seed-places";
import {
  getPlaceBySlug,
  getPublishedPlaces,
  getStoriesForPlace,
} from "@/lib/data/places";
import { atmospheresForPlace } from "@/lib/panora/atmospheres";
import { getNearbyGems } from "@/lib/panora/nearby-gems";
import {
  ogDescriptionForPlace,
  placeDetailPath,
  smartSharePath,
  smartShareUrl,
} from "@/lib/panora/smart-share";
import { absoluteUrl, formatDistance, formatPriceGuide } from "@/lib/utils";
import {
  Accessibility,
  Baby,
  Clock,
  MapPin,
  Sparkles,
  Wallet,
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

  const atmospheres = atmospheresForPlace(place, 3)
    .map((a) => a.label)
    .join(" · ");
  const title =
    place.metaTitle ??
    `${place.name} — ${atmospheres || place.city} | Panora Go`;
  const description = ogDescriptionForPlace(place);
  const url = smartShareUrl(place.slug);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${place.name} · Panora Go`,
      description,
      url,
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
      title: `${place.name} · Panora Go`,
      description,
      images: [absoluteUrl(`/p/${place.slug}/opengraph-image`)],
    },
  };
}

export default async function SmartShareLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) notFound();

  const [stories, allPlaces] = await Promise.all([
    getStoriesForPlace(place.id),
    getPublishedPlaces().catch(() => SEED_PLACES.filter((p) => p.published)),
  ]);
  const nearby = getNearbyGems(place, allPlaces, 4);
  const atmospheres = atmospheresForPlace(place, 5);
  const gallery =
    place.gallery.length > 0 ? place.gallery : [place.heroImage];
  const sharePlace = {
    name: place.name,
    slug: place.slug,
    city: place.city,
    location: place.location,
    country: place.country,
    heroImage: place.heroImage,
    mood: place.mood,
    category: place.category,
    amenities: place.amenities,
    story: place.story,
    contact: place.contact,
    latitude: place.latitude,
    longitude: place.longitude,
  };

  const practical = [
    place.highlights.bestTime
      ? {
          icon: Clock,
          label: "Best time",
          value: place.highlights.bestTime,
        }
      : null,
    place.priceGuide || place.highlights.averageSpend
      ? {
          icon: Wallet,
          label: "Pricing",
          value: place.highlights.averageSpend || formatPriceGuide(place.priceGuide),
        }
      : null,
    place.amenities.kidFriendly
      ? {
          icon: Baby,
          label: "Family",
          value: "Kid-friendly welcome",
        }
      : null,
    place.amenities.wheelchairAccess
      ? {
          icon: Accessibility,
          label: "Access",
          value: "Wheelchair access noted",
        }
      : null,
  ].filter(Boolean) as {
    icon: typeof Clock;
    label: string;
    value: string;
  }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Place", "TouristAttraction"],
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
    url: smartShareUrl(place.slug),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero — full-bleed */}
      <section className="relative min-h-[100svh] overflow-hidden">
        {place.videoUrl ? (
          <div className="absolute inset-0">
            <ProgressiveImage
              src={place.heroImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
              containerClassName="absolute inset-0"
            />
          </div>
        ) : (
          <ProgressiveImage
            src={place.heroImage}
            alt={place.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            containerClassName="absolute inset-0"
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "var(--hero-overlay)" }}
          aria-hidden
        />

        <div className="relative z-10 flex min-h-[100svh] flex-col justify-end px-4 pb-12 pt-[calc(var(--nav-height)+1.5rem)] sm:px-6 md:px-10">
          <div className="mx-auto w-full max-w-3xl">
            {/* Glass welcome — brand first */}
            <div className="rounded-[var(--radius-xl)] border border-white/20 bg-white/10 p-6 shadow-[var(--shadow-gold)] backdrop-blur-xl md:p-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-gold)]">
                    Panora Go
                  </p>
                  <p className="mt-1 text-xs tracking-wide text-white/65">
                    Discover. Connect. Belong.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <SaveButton
                    placeId={place.id}
                    placeName={place.name}
                    size="sm"
                  />
                  <SmartShareButton
                    place={sharePlace}
                    label="Share"
                    variant="accent"
                    size="sm"
                    className="border-0"
                  />
                </div>
              </div>

              <h1 className="mt-5 font-display text-4xl leading-[1.05] text-white md:text-6xl">
                {place.name}
              </h1>

              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[var(--brand-gold)]" />
                  {place.location}, {place.city}
                </span>
                {formatDistance(place.distanceKm) ? (
                  <span>· {formatDistance(place.distanceKm)}</span>
                ) : null}
              </p>

              <div className="mt-5">
                <AtmosphereBadges atmospheres={atmospheres} onDark />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gradient-mesh">
        <div className="container-panora space-y-16 py-[var(--space-section)] md:space-y-20">
          {place.videoUrl ? (
            <Reveal>
              <PlaceVideo src={place.videoUrl} title={place.name} />
            </Reveal>
          ) : null}

          {/* The Panora Story */}
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Feel the place
            </p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              The Panora Story
            </h2>
            <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed md:text-lg">
              {place.story.split(/\n\n+/).map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
            {place.panoraNotes ? (
              <p className="mt-6 max-w-2xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-5 text-sm leading-relaxed backdrop-blur-md">
                <span className="font-semibold text-[var(--accent)]">
                  Insider whisper —{" "}
                </span>
                {place.panoraNotes}
              </p>
            ) : null}
          </Reveal>

          {/* Atmospheres */}
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Atmosphere
            </p>
            <h2 className="mt-2 font-display text-3xl">How it feels</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Because people remember how a place felt long after they&apos;ve
              forgotten what it cost.
            </p>
            <div className="mt-6">
              <AtmosphereBadges atmospheres={atmospheres} />
            </div>
          </Reveal>

          {/* Gallery */}
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Gallery
            </p>
            <h2 className="mt-2 mb-6 font-display text-3xl">See the light</h2>
            <GalleryLightbox images={gallery} placeName={place.name} />
          </Reveal>

          {/* Practical — only when data exists */}
          {practical.length > 0 ? (
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Know before you go
              </p>
              <h2 className="mt-2 mb-6 font-display text-3xl">
                The useful details
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {practical.map((item) => (
                  <li
                    key={item.label}
                    className="flex gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-4 backdrop-blur-md"
                  >
                    <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed">{item.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}

          {/* Explorer Passport teaser */}
          <Reveal>
            <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-5 backdrop-blur-md">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
              <div>
                <p className="text-sm font-semibold">Explorer Passport</p>
                <p className="mt-1 text-sm text-muted">
                  Save this place to your wishlist — your Panora passport of
                  discoveries is on the horizon.
                </p>
              </div>
            </div>
          </Reveal>

          <PanoraCircle
            placeName={place.name}
            stories={stories}
            fullPlaceHref={placeDetailPath(place.slug)}
          />

          <NearbyGems places={nearby} />

          {/* Maps LAST */}
          <Reveal>
            <MapsFinale place={sharePlace} />
          </Reveal>

          <ViralShareBand place={sharePlace} />

          <p className="text-center text-sm text-muted">
            Want menus, amenities, and enquiries?{" "}
            <Link
              href={placeDetailPath(place.slug)}
              className="font-semibold text-[var(--accent)] hover:underline"
            >
              Open the full place page
            </Link>
            <span className="mx-2 text-[var(--border-strong)]">·</span>
            <span className="font-mono text-xs opacity-60">
              {smartSharePath(place.slug)}
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
