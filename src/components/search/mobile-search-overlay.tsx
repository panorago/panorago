"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

import { SearchResults } from "@/components/search/search-results";
import { useSearchCatalog } from "@/components/search/search-catalog";
import { useSearch } from "@/hooks/use-search";

type MobileSearchOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileSearchOverlay({ open, onClose }: MobileSearchOverlayProps) {
  const places = useSearchCatalog();
  const { query, setQuery, results, aiLoading } = useSearch(places);
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, setQuery]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--background)] md:hidden">
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Search className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Places, vibes, food, activities..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-base text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-muted)]"
        />
        <button
          type="button"
          className="shrink-0 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SearchResults
          results={results}
          loading={aiLoading}
          query={query}
          onSelect={onClose}
          onSuggest={setQuery}
        />
      </div>
    </div>
  );
}
