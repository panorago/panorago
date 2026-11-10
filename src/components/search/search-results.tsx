"use client";

import Image from "next/image";
import Link from "next/link";

import type { SearchPlace } from "@/lib/search/search-document";

const SUGGESTIONS = [
  "braai",
  "lake view",
  "date night",
  "coffee",
  "Kariba",
  "family",
  "escape",
  "scenic",
  "caves",
  "overnight",
] as const;

type SearchResultsProps = {
  results: SearchPlace[];
  loading: boolean;
  query: string;
  onSelect?: () => void;
  onSuggest?: (term: string) => void;
};

export function SearchResults({
  results,
  loading,
  query,
  onSelect,
  onSuggest,
}: SearchResultsProps) {
  if (!query.trim()) {
    return (
      <div className="p-5">
        <p className="mb-3 text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
          Try searching for
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((term) => (
            <button
              key={term}
              type="button"
              className="rounded-full bg-[var(--glass)] px-3 py-1.5 text-xs text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSuggest?.(term)}
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0 && !loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">
          No places found for “{query}”
        </p>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          Try a mood — romantic, outdoor, quiet, scenic
        </p>
      </div>
    );
  }

  return (
    <div>
      {results.length > 0 ? (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-[var(--foreground-muted)]">
            {results.length} place{results.length === 1 ? "" : "s"} found
            {loading ? " · finding more" : ""}
          </p>
        </div>
      ) : null}

      <div className="divide-y divide-[var(--border)]">
        {results.map((place) => (
          <Link
            key={place.id}
            href={`/panoras/${place.slug}`}
            onClick={onSelect}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--glass)]"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--glass)]">
              {place.heroImage ? (
                <Image
                  src={place.heroImage}
                  alt=""
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {place.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--foreground-muted)]">
                {place.location}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {place.vibe.slice(0, 2).map((vibe) => (
                  <span
                    key={vibe}
                    className="rounded-full bg-[var(--accent)]/15 px-1.5 py-0.5 text-[10px] text-[var(--accent)]"
                  >
                    {vibe}
                  </span>
                ))}
              </div>
            </div>
            <p className="shrink-0 text-right text-xs text-[var(--foreground-muted)]">
              {place.priceRange}
            </p>
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="animate-pulse text-xs text-[var(--foreground-muted)]">
            Finding more matches...
          </p>
        </div>
      ) : null}
    </div>
  );
}
