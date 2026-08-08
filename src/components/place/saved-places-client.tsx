"use client";

import { useOptionalAuth } from "@/components/auth/auth-provider";
import { Reveal } from "@/components/motion/reveal";
import {
  getSavedPlaceIds,
  PlaceCard,
} from "@/components/place/place-card";
import {
  mergeSavedPlaceIds,
  replaceSavedPlaceIds,
} from "@/components/place/use-saved-places";
import { SEED_PLACES } from "@/data/seed-places";
import { syncWishlistAction } from "@/lib/auth/wishlist";
import type { Place } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";

function resolveSavedPlaces(ids: string[], published: Place[]): Place[] {
  const byId = new Map<string, Place>();
  for (const place of published) byId.set(place.id, place);
  for (const place of SEED_PLACES) {
    if (!byId.has(place.id) && place.published && !place.archived) {
      byId.set(place.id, place);
    }
  }
  return ids
    .map((id) => byId.get(id))
    .filter((place): place is Place => Boolean(place));
}

export function SavedPlacesClient() {
  const auth = useOptionalAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces(ids: string[]) {
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
          setPlaces(resolveSavedPlaces(ids, all));
          setLoading(false);
        }
      } catch (err) {
        console.warn("[wishlist] /saved load failed — using seed fallback", err);
        if (!cancelled) {
          setPlaces(resolveSavedPlaces(ids, []));
          setLoading(false);
        }
      }
    }

    async function init() {
      let ids = getSavedPlaceIds();

      // Signed-in: merge localStorage ↔ Supabase so /saved matches /explorer
      if (auth?.user) {
        const synced = await syncWishlistAction(ids);
        if (!cancelled) {
          if (synced.ok) {
            const prev = ids.slice().sort().join(",");
            const next = synced.placeIds.slice().sort().join(",");
            if (prev !== next) replaceSavedPlaceIds(synced.placeIds);
            ids = synced.placeIds;
          } else {
            // Never wipe local on sync failure
            ids = mergeSavedPlaceIds(synced.placeIds ?? ids);
            console.warn("[wishlist] /saved sync deferred", synced.error);
          }
        }
      }

      if (!cancelled) await loadPlaces(getSavedPlaceIds().length ? getSavedPlaceIds() : ids);
    }

    void init();
    const onChange = () => {
      void loadPlaces(getSavedPlaceIds());
    };
    window.addEventListener("panora-saved-changed", onChange);
    window.addEventListener("panora-saved-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("panora-saved-changed", onChange);
      window.removeEventListener("panora-saved-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [auth?.user]);

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
          <p className="long-form mt-3 text-sm leading-relaxed text-muted">
            {auth?.user
              ? "Your wishlist syncs with your Panora account — the same list as Explorer."
              : "Saved on this device for now. Join Panora to keep your wishlist across devices."}
          </p>
        </Reveal>

        <Reveal className="mt-12" delay={0.06}>
          {loading ? (
            <p className="text-sm text-muted">Loading your saved places…</p>
          ) : places.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-8 py-16 text-center">
              <h2 className="font-display text-2xl">Wishlist is empty</h2>
              <p className="long-form mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
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
