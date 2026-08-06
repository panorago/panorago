"use client";

import { PlaceGrid } from "@/components/place/place-grid";
import type { Place } from "@/types";
import { useEffect, useState } from "react";

type RelatedPlacesProps = {
  excludeSlug?: string;
  excludeId?: string;
  limit?: number;
  title?: string;
  eyebrow?: string;
};

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
  }
  return next;
}

export function RelatedPlaces({
  excludeSlug,
  excludeId,
  limit = 4,
  title = "You might also like",
  eyebrow = "Keep exploring",
}: RelatedPlacesProps) {
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/places");
        if (!res.ok) return;
        const data = (await res.json()) as { places?: Place[] } | Place[];
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.places)
            ? data.places
            : [];
        const filtered = list.filter(
          (p) =>
            p.published !== false &&
            p.slug !== excludeSlug &&
            p.id !== excludeId,
        );
        if (!cancelled) setPlaces(shuffle(filtered).slice(0, limit));
      } catch {
        // ignore — suggestions are optional
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [excludeSlug, excludeId, limit]);

  if (places.length === 0) return null;

  return (
    <div className="mt-8 border-t border-[var(--border)] pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        {eyebrow}
      </p>
      <h3 className="mt-2 mb-5 font-display text-2xl">{title}</h3>
      <PlaceGrid
        places={places}
        className="sm:grid-cols-2 lg:grid-cols-2"
        priorityCount={0}
      />
    </div>
  );
}
