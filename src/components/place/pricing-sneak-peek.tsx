import { ProgressiveImage } from "@/components/media/progressive-image";
import { formatPriceGuide } from "@/lib/utils";
import type { Place, PlaceCategory, PricingItem } from "@/types";
import { Sparkles } from "lucide-react";

type PricingSneakPeekProps = {
  place: Pick<
    Place,
    | "priceGuide"
    | "highlights"
    | "category"
    | "pricingItems"
    | "menuImageUrls"
    | "name"
  >;
};

function sampleLines(category: PlaceCategory, priceGuide: string): string[] {
  const guide = formatPriceGuide(priceGuide);

  switch (category) {
    case "dining":
    case "coffee":
      return [
        `Typical spend ${guide}`,
        "Starters & small plates from $6–14",
        "Mains or signature plates $18–45",
      ];
    case "escape":
    case "weekend":
      return [
        `Nightly rates ${guide}`,
        "Standard room or chalet as listed",
        "Breakfast or half-board often available on request",
      ];
    case "nightlife":
      return [
        `Evening spend ${guide}`,
        "Entry or cover varies by night",
        "Cocktails and pours typically $6–15",
      ];
    case "wellness":
      return [
        `Treatments ${guide}`,
        "Single session or day package options",
        "Add-ons (scrub, facial) priced separately",
      ];
    case "outdoors":
      return [
        `Activity spend ${guide}`,
        "Park or activity fees may apply on arrival",
        "Guides and transfers available via Panora",
      ];
    case "culture":
      return [
        `Visit spend ${guide}`,
        "Entry or ticket priced at the door",
        "Guided experiences available on request",
      ];
    default:
      return [`Typical spend ${guide}`, "Confirm latest rates when you enquire"];
  }
}

function pricingRows(place: PricingSneakPeekProps["place"]): PricingItem[] {
  if (place.pricingItems && place.pricingItems.length > 0) {
    return place.pricingItems;
  }
  const fromHighlights = place.highlights.pricingItems;
  if (fromHighlights && fromHighlights.length > 0) return fromHighlights;
  return [];
}

export function PricingSneakPeek({ place }: PricingSneakPeekProps) {
  const averageSpend =
    place.highlights.averageSpend?.trim() || formatPriceGuide(place.priceGuide);
  const perfectFor = place.highlights.perfectFor?.slice(0, 3) ?? [];
  const rows = pricingRows(place);
  const lines =
    rows.length > 0
      ? rows.slice(0, 6).map((r) => `${r.label} — ${r.price}`)
      : sampleLines(place.category, place.priceGuide).slice(0, 3);
  const menuImages = place.menuImageUrls ?? [];

  return (
    <aside className="glass rounded-[var(--radius-lg)] border border-[var(--border)] p-6 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--accent)]" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Pricing & menu sneak peek
        </p>
      </div>
      <p className="mt-3 font-display text-2xl text-[var(--foreground)]">
        {averageSpend}
      </p>
      <p className="mt-1 text-sm text-muted">
        Guide: {formatPriceGuide(place.priceGuide)}
      </p>

      {menuImages.length > 0 ? (
        <div className="mt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Menu photos
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {menuImages.slice(0, 6).map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)]"
              >
                <ProgressiveImage
                  src={src}
                  alt={`${place.name} menu ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 45vw, 180px"
                  className="object-cover"
                  containerClassName="absolute inset-0"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <ul className="mt-5 space-y-2.5">
        {lines.map((line) => (
          <li
            key={line}
            className="flex gap-2 text-sm leading-relaxed text-[var(--foreground)]"
          >
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
              aria-hidden
            />
            {line}
          </li>
        ))}
      </ul>

      {perfectFor.length > 0 ? (
        <p className="mt-5 text-xs text-muted">
          Perfect for {perfectFor.join(" · ")}
        </p>
      ) : null}
    </aside>
  );
}
