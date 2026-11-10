import { PlaceCard } from "@/components/place/place-card";
import type { PlaceCardModel } from "@/lib/places/card";
import Link from "next/link";

export function TrendingHeroPanel({
  title,
  places,
}: {
  title: string;
  places: PlaceCardModel[];
}) {
  if (places.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-widest text-[#D4AF37]">
        {title}
      </p>
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} size="compact" tone="on-dark" />
      ))}
      <Link
        href="/discover"
        className="text-right text-xs text-[#D4AF37]/70 transition-colors hover:text-[#D4AF37]"
      >
        View all curated places →
      </Link>
    </div>
  );
}
