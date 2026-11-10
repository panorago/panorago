"use client";

import { useOptionalAuth } from "@/components/auth/auth-provider";
import { Reveal } from "@/components/motion/reveal";
import { PlaceCard } from "@/components/place/place-card";
import {
  getSavedPlaceIds,
  replaceSavedPlaceIds,
  useSavedPlaces,
} from "@/components/place/use-saved-places";
import { syncWishlistAction } from "@/lib/auth/wishlist";
import type { PlaceCardModel } from "@/lib/places/card";
import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const WishlistCatalogContext = createContext<PlaceCardModel[]>([]);

export function WishlistCatalogProvider({
  places,
  children,
}: {
  places: PlaceCardModel[];
  children: ReactNode;
}) {
  return (
    <WishlistCatalogContext.Provider value={places}>
      {children}
    </WishlistCatalogContext.Provider>
  );
}

function resolveSavedPlaces(
  ids: string[],
  catalog: PlaceCardModel[],
): PlaceCardModel[] {
  const byId = new Map<string, PlaceCardModel>();
  const bySlug = new Map<string, PlaceCardModel>();
  const rows = catalog;
  for (const place of rows) {
    if (!byId.has(place.id)) byId.set(place.id, place);
    if (!bySlug.has(place.slug)) bySlug.set(place.slug, place);
  }

  const seen = new Set<string>();
  const resolved: PlaceCardModel[] = [];
  for (const id of ids) {
    const place = byId.get(id) ?? bySlug.get(id);
    if (!place || seen.has(place.id)) continue;
    seen.add(place.id);
    resolved.push(place);
  }
  return resolved;
}

export function useResolvedSavedPlaces() {
  const auth = useOptionalAuth();
  const catalog = useContext(WishlistCatalogContext);
  const { saved } = useSavedPlaces();
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const places = useMemo(
    () => resolveSavedPlaces(saved, catalog),
    [saved, catalog],
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const userId = auth?.user?.id;
    if (!userId) return;
    let cancelled = false;
    const local = getSavedPlaceIds();
    if (local.length === 0) setSyncing(true);
    void syncWishlistAction(local).then((synced) => {
      if (cancelled) return;
      if (synced.ok) {
        const prev = local.slice().sort().join(",");
        const next = synced.placeIds.slice().sort().join(",");
        if (prev !== next) replaceSavedPlaceIds(synced.placeIds);
      } else {
        console.warn("[wishlist] saved sync deferred", synced.error);
      }
      setSyncing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [auth?.user?.id]);

  const loading = !hydrated || (syncing && places.length === 0);
  return { places, loading };
}

export function SavedPlacesClient() {
  const auth = useOptionalAuth();
  const { places, loading } = useResolvedSavedPlaces();

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
