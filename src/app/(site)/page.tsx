import { HomeHero } from "@/components/home/home-hero";
import { Reveal } from "@/components/motion/reveal";
import { PlaceGrid } from "@/components/place/place-grid";
import { SEED_SECTIONS } from "@/data/seed-places";
import { getPlacesBySection, getPublishedPlaces } from "@/lib/data/places";
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
  const [places, ...sectionPlaces] = await Promise.all([
    getPublishedPlaces(),
    ...SECTION_ORDER.map((key) => getPlacesBySection(key)),
  ]);

  const heroImage =
    places[0]?.heroImage ??
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=2000&q=80";

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
            className="container-panora py-[var(--space-section)]"
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
      </div>
    </>
  );
}
