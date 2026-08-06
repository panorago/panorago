import { HomeHero } from "@/components/home/home-hero";
import { Reveal } from "@/components/motion/reveal";
import { PlaceGrid } from "@/components/place/place-grid";
import { SEED_SECRET_COLLECTIONS, SEED_SECTIONS } from "@/data/seed-places";
import { getPlacesBySection } from "@/lib/data/places";
import type { HomepageSectionKey } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Panora Go — Unforgettable Places in Zimbabwe",
  description:
    "Where will your next unforgettable weekend begin? Discover Zimbabwe's most unforgettable places with Panora Go.",
};

const SECTION_ORDER: HomepageSectionKey[] = [
  "trending",
  "new_discoveries",
  "panora_picks",
  "weekend_escape",
  "editors_choice",
];

export default async function HomePage() {
  const sectionPlaces = await Promise.all(
    SECTION_ORDER.map((key) => getPlacesBySection(key)),
  );

  // Curated Victoria Falls still — full-bleed Zimbabwe hero
  const heroImage = "/images/hero-zimbabwe.jpg";

  const sections = SECTION_ORDER.map((key, index) => {
    const meta =
      SEED_SECTIONS.find((section) => section.key === key) ?? {
        title: key,
        subtitle: "",
      };
    return {
      key,
      title: meta.title,
      subtitle: meta.subtitle,
      places: sectionPlaces[index] ?? [],
    };
  });

  return (
    <>
      <HomeHero heroImage={heroImage} />

      <div className="gradient-mesh">
        {sections.map((section, index) => (
          <Reveal
            key={section.key}
            as="section"
            id={section.key === "trending" ? "trending" : undefined}
            className="container-panora py-[var(--space-section)] scroll-mt-[calc(var(--nav-height)+1rem)]"
            delay={index * 0.04}
          >
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Collection
                </p>
                <h2 className="mt-2 font-display text-3xl md:text-4xl">
                  {section.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted">
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
            <p className="mt-2 max-w-xl text-sm text-muted">
              Curated moods for how you actually want the weekend to feel.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SEED_SECRET_COLLECTIONS.map((collection) => (
              <li key={collection.key}>
                <Link
                  href={`/discover?collection=${encodeURIComponent(collection.key)}`}
                  className="group block rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-5 transition hover:border-[var(--accent)] hover:shadow-[var(--shadow-gold)]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                    Secret
                  </p>
                  <h3 className="mt-2 font-display text-2xl leading-tight group-hover:text-[var(--accent)]">
                    {collection.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
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
