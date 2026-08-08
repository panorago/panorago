"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { QuickVibes } from "@/components/search/quick-vibes";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";
import type { MoodTag } from "@/types";

const SUGGESTIONS = [
  "Garden dining in Harare",
  "Weekend lodge near Nyanga",
  "Coffee with good light",
  "Date night tonight",
  "Quiet luxury spa",
  "Hidden pool escape",
  "Pet friendly escape",
  "Starlink wifi lodge",
  "Swimming pool weekend",
] as const;

type SearchBarProps = {
  className?: string;
  defaultExpanded?: boolean;
  showVibes?: boolean;
  autoFocus?: boolean;
  defaultQuery?: string;
  /** Alias used by discover page */
  initialQuery?: string;
  initialVibe?: MoodTag;
  large?: boolean;
  onNavigate?: () => void;
};

export function SearchBar({
  className,
  defaultExpanded = false,
  showVibes = false,
  autoFocus = false,
  defaultQuery = "",
  initialQuery,
  initialVibe,
  large = false,
  onNavigate,
}: SearchBarProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [expanded, setExpanded] = useState(defaultExpanded || autoFocus || large);
  const [query, setQuery] = useState(initialQuery ?? defaultQuery);
  const [focused, setFocused] = useState(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (initialQuery != null) setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (autoFocus || expanded) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [autoFocus, expanded]);

  const showSuggestions =
    focused && query.trim().length === 0 && SUGGESTIONS.length > 0;

  const filtered =
    deferredQuery.trim().length > 0
      ? SUGGESTIONS.filter((s) =>
          s.toLowerCase().includes(deferredQuery.trim().toLowerCase()),
        )
      : [];

  function navigate(q: string, vibe?: MoodTag) {
    const trimmed = q.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    const vibeValue = vibe ?? initialVibe;
    if (vibeValue) params.set("vibe", vibeValue);
    const qs = params.toString();
    router.push(qs ? `/discover?${qs}` : "/discover");
    onNavigate?.();
    setFocused(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    navigate(query);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
      if (!defaultExpanded && !large) setExpanded(false);
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={onSubmit}
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]",
          "bg-[var(--glass-strong)] shadow-[var(--shadow)] backdrop-blur-xl",
          "transition-[box-shadow,border-color] duration-300",
          focused && "border-[var(--accent)] shadow-[var(--shadow-gold)]",
          large && "rounded-[var(--radius-xl)]",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 px-3 sm:px-4",
            large && "px-4 sm:px-5",
          )}
        >
          <Search
            className={cn(
              "shrink-0 text-[var(--accent)]",
              large ? "h-5 w-5 sm:h-6 sm:w-6" : "h-5 w-5",
            )}
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!expanded) setExpanded(true);
            }}
            onFocus={() => {
              setFocused(true);
              setExpanded(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setFocused(false), 150);
            }}
            onKeyDown={onKeyDown}
            placeholder="What are you looking for today?"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={listId}
            className={cn(
              "w-full bg-transparent text-[var(--foreground)] outline-none",
              "placeholder:text-[var(--foreground-muted)]",
              large
                ? "h-14 text-base sm:h-16 sm:text-lg"
                : "h-12 text-sm sm:h-14 sm:text-base",
            )}
          />
          <AnimatePresence>
            {query ? (
              <motion.button
                type="button"
                aria-label="Clear search"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
                className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--foreground-muted)] hover:bg-[var(--glass)]"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
              >
                <X className="h-4 w-4" />
              </motion.button>
            ) : null}
          </AnimatePresence>
          <button
            type="submit"
            className={cn(
              "focus-ring hidden h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium sm:inline-flex",
              "bg-[var(--brand-navy)] text-[var(--brand-white)]",
              "dark:bg-[var(--accent)] dark:text-[var(--accent-foreground)]",
              large && "h-11 px-5",
            )}
          >
            Search
          </button>
        </div>

        <AnimatePresence>
          {(showSuggestions || filtered.length > 0) && expanded ? (
            <motion.ul
              id={listId}
              role="listbox"
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{
                duration: motionTokens.duration.base,
                ease: motionTokens.ease.out,
              }}
              className="border-t border-[var(--border)]"
            >
              {(filtered.length > 0 ? filtered : SUGGESTIONS).map((item) => (
                <li key={item} role="option" aria-selected={query === item}>
                  <button
                    type="button"
                    className="flex w-full px-4 py-3 text-left text-sm text-[var(--foreground-muted)] transition-colors hover:bg-[var(--glass)] hover:text-[var(--foreground)]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery(item);
                      navigate(item);
                    }}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </form>

      {showVibes ? (
        <div className="mt-4">
          <QuickVibes activeVibe={initialVibe} />
        </div>
      ) : null}
    </div>
  );
}
