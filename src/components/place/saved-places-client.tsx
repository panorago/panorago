"use client";

import { Reveal } from "@/components/motion/reveal";
import {
  getSavedPlaceIds,
  PlaceCard,
} from "@/components/place/place-card";
import type { Place } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SavedPlacesClient() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const ids = getSavedPlaceIds();
      if (ids.length === 0) {
        if (!cancelled) {
          setPlaces([]);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/places/published");
        if (!res.ok) throw new Error("Failed to load places");
        const all = (await res.json()) as Place[];
        if (!cancelled) {
          setPlaces(all.filter((place) => ids.includes(place.id)));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPlaces([]);
          setLoading(false);
        }
      }
    }

    load();
    const onChange = () => load();
    window.addEventListener("panora-saved-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("panora-saved-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return (
    <div className="gradient-mesh pt-8">
      <div className="container-panora pb-[var(--space-section)]">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Wishlist
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            Places you&apos;re holding onto
          </h1>
          <p className="mt-3 text-sm text-muted">
            Your wishlist is the same as saved places on this device — tap the
            heart anywhere to add or remove.
          </p>
        </Reveal>

        <Reveal className="mt-12" delay={0.06}>
          {loading ? (
            <p className="text-sm text-muted">Loading your saved places…</p>
          ) : places.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-8 py-16 text-center">
              <h2 className="font-display text-2xl">Wishlist is empty</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                Tap the heart on any place to add it to your wishlist. Start
                with Discover and find your next unforgettable weekend.
              </p>
              <Link
                href="/discover"
                className="mt-6 inline-flex text-sm font-medium text-[var(--accent)] hover:opacity-80"
              >
                Explore places →
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {places.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
