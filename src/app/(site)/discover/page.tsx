import { Reveal } from "@/components/motion/reveal";
import { PlaceGrid } from "@/components/place/place-grid";
import { QuickVibes } from "@/components/search/quick-vibes";
import { SearchBar } from "@/components/search/search-bar";
import { SEED_SECRET_COLLECTIONS } from "@/data/seed-places";
import { getPublishedPlaces, searchPlaces } from "@/lib/data/places";
import type { MoodTag } from "@/types";
import { absoluteUrl } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Zimbabwe places",
  description:
    "Search Panora Go for Zimbabwe tourism — curated places by name, city, or vibe. Discover Connect Belong across Panora Zimbabwe.",
  alternates: {
    canonical: absoluteUrl("/discover"),
  },
};

const MOODS: MoodTag[] = [
  "Golden Hour",
  "Date Night",
  "Hidden Escape",
  "Weekend Away",
  "Coffee Ritual",
  "Tonight",
  "Quiet Luxury",
  "Celebration",
];

function isMoodTag(value: string | undefined): value is MoodTag {
  return Boolean(value && MOODS.includes(value as MoodTag));
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; vibe?: string; collection?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const vibe = isMoodTag(params.vibe) ? params.vibe : undefined;
  const collectionKey = params.collection?.trim() ?? "";
  const collection = SEED_SECRET_COLLECTIONS.find(
    (item) => item.key === collectionKey,
  );

  let places = await searchPlaces(q, vibe);

  if (collection) {
    const ids = new Set(collection.placeIds);
    const all = await getPublishedPlaces();
    const fromCollection = all.filter((place) => ids.has(place.id));
    if (q || vibe) {
      const matchedIds = new Set(places.map((p) => p.id));
      places = fromCollection.filter((place) => matchedIds.has(place.id));
    } else {
      places = fromCollection;
    }
  }

  const heading = collection
    ? collection.title
    : vibe
      ? `Places for ${vibe}`
      : q
        ? `Results for “${q}”`
        : "Discover Zimbabwe";

  return (
    <div className="gradient-mesh pt-[calc(var(--nav-height)+2rem)]">
      <div className="container-panora pb-[var(--space-section)]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {collection ? "Secret collection" : "Discover"}
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">{heading}</h1>
          <p className="mt-3 text-sm text-muted">
            {collection
              ? collection.subtitle
              : "Filter by vibe or search by place, city, or feeling. Every listing is curated with insider notes."}
          </p>
          <div className="mt-8">
            <SearchBar initialQuery={q} initialVibe={vibe} large />
          </div>
          <div className="mt-6">
            <QuickVibes activeVibe={vibe} />
          </div>
        </Reveal>

        <Reveal className="mt-14" delay={0.08}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {places.length} {places.length === 1 ? "place" : "places"}
            </p>
          </div>
          <PlaceGrid
            places={places}
            emptyTitle="No matches this time"
            emptyDescription="Try a different vibe or a shorter search. Chinhoyi caves, courtyard kitchens, and Mashonaland West weekends are all a filter away."
          />
        </Reveal>
      </div>
    </div>
  );
}
