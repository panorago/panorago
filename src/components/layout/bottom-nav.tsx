"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Compass,
  Heart,
  Home,
  Map,
  Search,
  X,
} from "lucide-react";
import { useEffect, useId, useState } from "react";

import { SearchBar } from "@/components/search/search-bar";
import { QuickVibes } from "@/components/search/quick-vibes";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";

const ITEMS = [
  { href: "/", label: "Home", icon: Home, kind: "link" as const },
  { href: "/discover", label: "Discover", icon: Compass, kind: "link" as const },
  { href: "#search", label: "Search", icon: Search, kind: "search" as const },
  { href: "/map", label: "Map", icon: Map, kind: "link" as const },
  { href: "/saved", label: "Saved", icon: Heart, kind: "link" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [searchOpen, setSearchOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [searchOpen]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <nav
        aria-label="Mobile bottom"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 md:hidden",
          "border-t border-[var(--border)] bg-[var(--glass-strong)] backdrop-blur-2xl",
          "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        )}
      >
        <ul
          className="mx-auto flex h-[var(--bottom-nav-height)] max-w-lg items-stretch justify-between px-2"
        >
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.kind === "search" ? searchOpen : isActive(item.href);

            if (item.kind === "search") {
              return (
                <li key={item.label} className="flex flex-1">
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className={cn(
                      "focus-ring flex flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] text-[10px] font-medium",
                      active
                        ? "text-[var(--accent)]"
                        : "text-[var(--foreground-muted)]",
                    )}
                    aria-label="Open search"
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                    {item.label}
                  </button>
                </li>
              );
            }

            return (
              <li key={item.label} className="flex flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "focus-ring relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] text-[10px] font-medium",
                    active
                      ? "text-[var(--accent)]"
                      : "text-[var(--foreground-muted)]",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="bottom-nav-active"
                      className="absolute top-1 h-1 w-1 rounded-full bg-[var(--accent)]"
                      transition={
                        reduceMotion
                          ? { duration: 0.01 }
                          : motionTokens.spring.soft
                      }
                    />
                  ) : null}
                  <Icon
                    className={cn("h-5 w-5", active && "fill-current/10")}
                    strokeWidth={1.75}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <AnimatePresence>
        {searchOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.fast }}
          >
            <button
              type="button"
              aria-label="Close search"
              className="absolute inset-0 bg-[var(--overlay)]"
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background-elevated)] p-5 shadow-[var(--shadow)] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
              initial={reduceMotion ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduceMotion ? undefined : { y: "100%" }}
              transition={motionTokens.spring.soft}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  id={titleId}
                  className="font-[family-name:var(--font-display)] text-xl"
                >
                  Search
                </h2>
                <button
                  type="button"
                  className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)]"
                  aria-label="Close"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SearchBar
                autoFocus
                onNavigate={() => {
                  setSearchOpen(false);
                }}
              />
              <div className="mt-5">
                <p className="mb-3 text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                  Quick vibes
                </p>
                <QuickVibes
                  onSelect={(vibe) => {
                    setSearchOpen(false);
                    router.push(
                      `/discover?vibe=${encodeURIComponent(vibe)}`,
                    );
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
