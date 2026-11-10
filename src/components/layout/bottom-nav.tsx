"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Compass, Heart, Home, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { MobileSearchOverlay } from "@/components/search/mobile-search-overlay";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";

const ITEMS = [
  { href: "/", label: "Home", icon: Home, kind: "link" as const },
  { href: "/discover", label: "Discover", icon: Compass, kind: "link" as const },
  { href: "#search", label: "Search", icon: Search, kind: "search" as const },
  { href: "/saved", label: "Wishlist", icon: Heart, kind: "link" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

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
                  prefetch
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

      <MobileSearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
