"use client";

import { useMemo, useState } from "react";

export type CollectionPlaceOption = {
  id: string;
  name: string;
  city: string;
  slug: string;
};

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

type CollectionPlacePickerProps = {
  places: CollectionPlaceOption[];
  initialSelectedIds?: string[];
  name?: string;
};

export function CollectionPlacePicker({
  places,
  initialSelectedIds = [],
  name = "placeIds",
}: CollectionPlacePickerProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelectedIds),
  );
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places;
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );
  }, [places, query]);

  const serialized = [...selected].join("\n");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={serialized} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted">
          Places in collection ({selected.size} selected)
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter places…"
          className={`${field} max-w-xs`}
        />
      </div>
      {places.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] px-3 py-4 text-sm text-muted">
          No places available yet. Add places first, then tick them here.
        </p>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] p-2">
          {filtered.map((place) => {
            const checked = selected.has(place.id);
            return (
              <li key={place.id}>
                <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm hover:bg-[var(--glass)]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(place.id)}
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="font-medium">{place.name}</span>
                    <span className="block text-xs text-muted">
                      {place.city} · {place.slug}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="px-2 py-3 text-sm text-muted">No matches.</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
