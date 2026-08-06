"use client";

import { PlaceMapShare } from "@/components/smart-share/place-map-share";
import { SmartShareButton } from "@/components/smart-share/smart-share-button";
import type { SmartSharePlace } from "@/components/smart-share/smart-share-sheet";
import { Button } from "@/components/ui/button";
import {
  googleMapsNavigateUrl,
  placeDetailPath,
} from "@/lib/panora/smart-share";
import { Navigation } from "lucide-react";

type MapsFinaleProps = {
  place: SmartSharePlace & {
    latitude: number | null;
    longitude: number | null;
  };
};

export function MapsFinale({ place }: MapsFinaleProps) {
  const hasCoords = place.latitude != null && place.longitude != null;
  const mapsHref = googleMapsNavigateUrl({
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    googleMapsUrl: place.contact.googleMapsUrl,
  });

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Then navigate
        </p>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">
          Find your way
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          You&apos;ve felt the place. When you&apos;re ready, Google Maps takes
          you there — as the final step, not the first.
        </p>
      </div>

      {hasCoords ? (
        <PlaceMapShare
          place={{
            ...place,
            latitude: place.latitude!,
            longitude: place.longitude!,
          }}
        />
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-6 text-sm text-muted">
          Map coordinates are coming soon. You can still open Google Maps with
          the venue name.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-7 text-base font-medium text-[var(--accent-foreground)] shadow-[var(--shadow-gold)] transition hover:brightness-105"
        >
          <Navigation className="h-4 w-4" />
          Navigate with Google Maps
        </a>
        <Button
          href={placeDetailPath(place.slug)}
          variant="outline"
          size="lg"
          className="rounded-full"
        >
          Continue the Journey
        </Button>
        <SmartShareButton
          place={place}
          label="Share this place"
          variant="ghost"
          size="lg"
        />
      </div>
    </section>
  );
}
