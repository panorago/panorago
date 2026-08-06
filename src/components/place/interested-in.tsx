import { Reveal } from "@/components/motion/reveal";
import { PlaceGrid } from "@/components/place/place-grid";
import type { Place } from "@/types";

type InterestedInProps = {
  places: Place[];
};

export function InterestedIn({ places }: InterestedInProps) {
  if (places.length === 0) return null;

  return (
    <Reveal>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        Keep exploring
      </p>
      <h2 className="mt-2 mb-6 font-display text-3xl">
        Could be interested in?
      </h2>
      <PlaceGrid places={places} className="lg:grid-cols-2" priorityCount={0} />
    </Reveal>
  );
}
