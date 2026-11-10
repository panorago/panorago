import { PlaceCard } from "@/components/place/place-card";
import type { PlaceCardModel } from "@/lib/places/card";

export function WeeklyPeekStrip({
  title,
  places,
}: {
  title: string;
  places: PlaceCardModel[];
}) {
  if (places.length === 0) return null;

  return (
    <div className="container-panora border-t border-[var(--border)] py-4">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-[var(--foreground-muted)]">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {places.map((place) => (
          <PlaceCard key={place.id} place={place} size="compact" />
        ))}
      </div>
      <p className="mt-4 hidden text-center text-[10px] tracking-wider text-[var(--accent)]/40 lg:block">
        ↓ scroll to explore all venues
      </p>
    </div>
  );
}
