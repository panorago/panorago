import { HomeHero } from "@/components/home/home-hero";
import { HomepageLiveRefresh } from "@/components/home/homepage-live-refresh";
import { MobileOpenOnContent } from "@/components/home/mobile-open-on-content";
import { Reveal } from "@/components/motion/reveal";
import { PlaceGrid } from "@/components/place/place-grid";
import { SEED_SECRET_COLLECTIONS } from "@/data/seed-places";
import {
  getEnabledHomepageSections,
  getPlacesBySection,
} from "@/lib/data/places";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 120;

export const metadata: Metadata = {
  title: {
    absolute: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
  },
};

export default async function HomePage() {
  const homepageSections = await getEnabledHomepageSections();
  const sectionPlaces = await Promise.all(
    homepageSections.map((section) =>
      getPlacesBySection(section.key, section.placeIds),
    ),
  );

  // Curated Victoria Falls still — full-bleed Zimbabwe hero
  const heroImage = "/images/hero-zimbabwe.jpg";

  const sections = homepageSections.map((section, index) => ({
    key: section.key,
    title: section.title,
    subtitle: section.subtitle,
    places: sectionPlaces[index] ?? [],
  }));

  const firstSectionId = sections[0] ? "venues-section" : undefined;

  return (
    <>
      <HomepageLiveRefresh />
      {firstSectionId ? <MobileOpenOnContent targetId={firstSectionId} /> : null}
      <HomeHero heroImage={heroImage} />

      <div className="gradient-mesh">
        <Reveal
          as="section"
          className="container-panora pt-[var(--space-section)] pb-4"
          aria-labelledby="panora-go-intro"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Panora Go · Panora Zimbabwe
          </p>
          <h2
            id="panora-go-intro"
            className="mt-2 max-w-2xl font-display text-3xl md:text-4xl"
          >
            Tourism discovery built to Discover, Connect, and Belong
          </h2>
          <p className="long-form mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Panora Go curates Zimbabwe&apos;s most unforgettable places —
            weekends, dining, and escapes with insider notes so your next trip
            feels planned, not guessed.
          </p>
        </Reveal>

        {sections.map((section, index) => (
          <Reveal
            key={section.key}
            as="section"
            id={index === 0 ? "venues-section" : undefined}
            className="container-panora py-[var(--space-section)] scroll-mt-[calc(var(--nav-height)+1rem)]"
            delay={index * 0.04}
          >
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Collection
                </p>
                <h2 className="mt-2 font-display text-3xl md:text-4xl">
                  {section.title}
                </h2>
                <p className="long-form mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  {section.subtitle}
                </p>
              </div>
              <Link
                href={`/discover`}
                className="text-sm font-medium text-[var(--accent)] transition hover:opacity-80"
              >
                View all →
              </Link>
            </div>
            <PlaceGrid places={section.places} />
          </Reveal>
        ))}

        <Reveal
          as="section"
          className="container-panora py-[var(--space-section)]"
          delay={0.08}
        >
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Insider lists
            </p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              Secret Collections
            </h2>
            <p className="long-form mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Curated moods for how you actually want the weekend to feel.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SEED_SECRET_COLLECTIONS.map((collection) => (
              <li key={collection.key} className="min-w-0">
                <Link
                  href={`/discover?collection=${encodeURIComponent(collection.key)}`}
                  className="group block h-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-5 transition hover:border-[var(--accent)] hover:shadow-[var(--shadow-gold)]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                    Secret
                  </p>
                  <h3 className="mt-2 font-display text-2xl leading-tight group-hover:text-[var(--accent)]">
                    {collection.title}
                  </h3>
                  <p className="long-form mt-2 text-sm leading-relaxed text-muted">
                    {collection.subtitle}
                  </p>
                  <p className="mt-4 text-xs font-medium text-[var(--accent)]">
                    {collection.placeIds.length} places →
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </>
  );
}
