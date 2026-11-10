"use client";

import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { SearchResults } from "@/components/search/search-results";
import { useSearchCatalog } from "@/components/search/search-catalog";
import { useSearch } from "@/hooks/use-search";
import { cn } from "@/lib/utils";

type DesktopSearchProps = {
  onDark?: boolean;
};

export function DesktopSearch({ onDark = false }: DesktopSearchProps) {
  const pathname = usePathname();
  const places = useSearchCatalog();
  const { query, setQuery, results, aiLoading } = useSearch(places);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [pathname, setQuery]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setQuery]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative hidden h-10 w-10 md:block" ref={panelRef}>
      <button
        type="button"
        className={cn(
          "focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border",
          onDark
            ? "border-white/25 bg-white/12 text-[var(--brand-gold)]"
            : "border-[var(--border)] bg-[var(--glass)] text-[var(--accent)]",
          open && "invisible",
        )}
        aria-label="Open search"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" strokeWidth={2} />
      </button>
      {open ? (
        <div
          className={cn(
            "absolute right-0 top-0 z-10 flex h-10 w-[min(20rem,calc(100vw-7rem))] items-center gap-2 rounded-full border px-3",
            onDark
              ? "border-white/25 bg-[var(--brand-navy)]/90 text-white"
              : "border-[var(--border)] bg-[var(--background-elevated)] text-[var(--foreground)]",
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search places, vibes, activities..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-controls={listId}
            aria-expanded={open}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--foreground-muted)]"
          />
          <button
            type="button"
            className="shrink-0 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            onClick={close}
          >
            Cancel
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          id={listId}
          className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-elevated)] shadow-[var(--shadow)]"
        >
          <SearchResults
            results={results}
            loading={aiLoading}
            query={query}
            onSelect={close}
            onSuggest={setQuery}
          />
        </div>
      ) : null}
    </div>
  );
}
