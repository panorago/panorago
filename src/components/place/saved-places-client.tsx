"use client";

import { useOptionalAuth } from "@/components/auth/auth-provider";
import { Reveal } from "@/components/motion/reveal";
import {
  getSavedPlaceIds,
  PlaceCard,
} from "@/components/place/place-card";
import {
  replaceSavedPlaceIds,
} from "@/components/place/use-saved-places";
import { syncWishlistAction } from "@/lib/auth/wishlist";
import type { Place } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SavedPlacesClient() {
  const auth = useOptionalAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
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

    async function init() {
      // Signed-in: merge localStorage ↔ Supabase so /saved matches /explorer
      if (auth?.user) {
        const local = getSavedPlaceIds();
        const synced = await syncWishlistAction(local);
        if (!cancelled && synced.ok) {
          const prev = local.slice().sort().join(",");
          const next = synced.placeIds.slice().sort().join(",");
          if (prev !== next) replaceSavedPlaceIds(synced.placeIds);
        }
      }
      if (!cancelled) await loadPlaces();
    }

    void init();
    const onChange = () => {
      void loadPlaces();
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
          <p className="mt-3 text-sm text-muted">
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
