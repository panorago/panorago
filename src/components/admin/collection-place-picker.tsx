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
  const [selected, setSelected] = useState<string[]>(() => initialSelectedIds);
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

  const serialized = selected.join("\n");
  const byId = useMemo(
    () => new Map(places.map((place) => [place.id, place])),
    [places],
  );

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function move(id: string, direction: -1 | 1) {
    setSelected((prev) => {
      const index = prev.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item!);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={serialized} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted">
          Places in collection ({selected.length} selected)
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter places…"
          className={`${field} max-w-xs`}
        />
      </div>
      {selected.length > 0 ? (
        <ol className="max-h-40 space-y-1 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] p-2">
          {selected.map((id, index) => {
            const place = byId.get(id);
            return (
              <li
                key={id}
                className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm"
              >
                <span className="min-w-0 truncate">
                  <span className="text-xs text-muted">{index + 1}. </span>
                  {place?.name ?? id}
                </span>
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs"
                    onClick={() => move(id, -1)}
                    disabled={index === 0}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs"
                    onClick={() => move(id, 1)}
                    disabled={index === selected.length - 1}
                  >
                    Down
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}
      {places.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] px-3 py-4 text-sm text-muted">
          No places available yet. Add places first, then tick them here.
        </p>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] p-2">
          {filtered.map((place) => {
            const checked = selected.includes(place.id);
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
