"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { SearchResults } from "@/components/search/search-results";
import { useSearchCatalog } from "@/components/search/search-catalog";
import { useSearch } from "@/hooks/use-search";
import { cn } from "@/lib/utils";

type PlaceSearchProps = {
  placeholder?: string;
  autoFocus?: boolean;
  large?: boolean;
  onSelect?: () => void;
  className?: string;
};

export function PlaceSearch({
  placeholder = "Search places, vibes, activities...",
  autoFocus = false,
  large = false,
  onSelect,
  className,
}: PlaceSearchProps) {
  const places = useSearchCatalog();
  const { query, setQuery, results, aiLoading } = useSearch(places);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const open = query.trim().length > 0;

  useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)]",
          "bg-[var(--glass-strong)] px-3 shadow-[var(--shadow)] backdrop-blur-xl sm:px-4",
          "focus-within:border-[var(--accent)] focus-within:shadow-[var(--shadow-gold)]",
          large && "rounded-[var(--radius-xl)] px-4 sm:px-5",
        )}
      >
        <Search
          className={cn(
            "shrink-0 text-[var(--accent)]",
            large ? "h-5 w-5 sm:h-6 sm:w-6" : "h-4 w-4",
          )}
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          className={cn(
            "w-full min-w-0 bg-transparent text-[var(--foreground)] outline-none",
            "placeholder:text-[var(--foreground-muted)]",
            large
              ? "h-14 text-base sm:h-16 sm:text-lg"
              : "h-11 text-sm sm:h-12",
          )}
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--foreground-muted)] hover:bg-[var(--glass)]"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id={listId}
          className="absolute top-full z-50 mt-2 max-h-[60vh] w-full overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-elevated)] shadow-[var(--shadow)]"
        >
          <SearchResults
            results={results}
            loading={aiLoading}
            query={query}
            onSelect={onSelect}
            onSuggest={setQuery}
          />
        </div>
      ) : null}
    </div>
  );
}
