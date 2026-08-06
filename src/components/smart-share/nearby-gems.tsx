import { Reveal } from "@/components/motion/reveal";
import { PlaceGrid } from "@/components/place/place-grid";
import type { Place } from "@/types";

type NearbyGemsProps = {
  places: Place[];
};

export function NearbyGems({ places }: NearbyGemsProps) {
  if (places.length === 0) return null;

  return (
    <Reveal>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        Continue your journey
      </p>
      <h2 className="mt-2 mb-2 font-display text-3xl md:text-4xl">
        Nearby Gems
      </h2>
      <p className="mb-6 max-w-xl text-sm text-muted">
        Places that share the atmosphere — a little further down the road, or
        just around the feeling.
      </p>
      <PlaceGrid places={places} className="lg:grid-cols-2" priorityCount={0} />
    </Reveal>
  );
}
