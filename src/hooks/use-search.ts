"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { scoreSearchFields } from "@/lib/search/ai-search";
import type { SearchPlace } from "@/lib/search/search-document";

function scorePlace(place: SearchPlace, query: string): number {
  return scoreSearchFields(query, [
    { text: place.name, weight: 12 },
    { text: place.location, weight: 8 },
    { text: place.vibe.join(" "), weight: 8 },
    { text: place.tags.join(" "), weight: 7 },
    { text: place.occasions.join(" "), weight: 6 },
    { text: place.searchKeywords.join(" "), weight: 6 },
    { text: place.amenities.join(" "), weight: 6 },
    { text: place.summary, weight: 4 },
    { text: place.description, weight: 3 },
  ]);
}

async function geminiSearch(query: string): Promise<string[]> {
  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { matchedIds?: unknown };
    return Array.isArray(data.matchedIds)
      ? data.matchedIds.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function useSearch(places: SearchPlace[]) {
  const [query, setQuery] = useState("");
  const [aiExtra, setAiExtra] = useState<SearchPlace[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const requestId = useRef(0);
  const placesRef = useRef(places);
  placesRef.current = places;
  const catalogKey = places.map((place) => place.id).join("\0");

  const instant = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return places
      .map((place) => ({ place, score: scorePlace(place, query) }))
      .filter(({ score }) => score >= 5)
      .sort(
        (a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name),
      )
      .map(({ place }) => place);
  }, [query, places]);

  useEffect(() => {
    const id = ++requestId.current;
    const trimmed = query.trim();
    setAiExtra([]);

    if (trimmed.length < 2) {
      setAiLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setAiLoading(true);
      try {
        const catalogue = placesRef.current;
        const aiIds = await geminiSearch(trimmed);
        if (requestId.current !== id) return;
        const layer1Ids = new Set(instant.map((place) => place.id));
        const byId = new Map(catalogue.map((place) => [place.id, place]));
        const aiOnly = aiIds
          .map((placeId) => byId.get(placeId))
          .filter((place): place is SearchPlace =>
            Boolean(place && !layer1Ids.has(place.id)),
          );
        setAiExtra(aiOnly);
      } finally {
        if (requestId.current === id) setAiLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, catalogKey, instant]);

  const instantIds = new Set(instant.map((place) => place.id));
  const results = [
    ...instant,
    ...aiExtra.filter((place) => !instantIds.has(place.id)),
  ];

  return { query, setQuery, results, aiLoading };
}
