import { Reveal } from "@/components/motion/reveal";
import { PlaceGrid } from "@/components/place/place-grid";
import type { Place } from "@/types";

type NearbyDiscoveriesProps = {
  places: Place[];
};

/** Venue recommendations — formerly InterestedIn / “Could be interested in?” */
export function NearbyDiscoveries({ places }: NearbyDiscoveriesProps) {
  if (places.length === 0) return null;

  return (
    <Reveal>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        Keep exploring
      </p>
      <h2 className="mt-2 mb-6 font-display text-3xl">Nearby Discoveries</h2>
      <PlaceGrid places={places} className="lg:grid-cols-2" priorityCount={0} />
    </Reveal>
  );
}

/** @deprecated Use NearbyDiscoveries */
export function InterestedIn(props: NearbyDiscoveriesProps) {
  return <NearbyDiscoveries {...props} />;
}
