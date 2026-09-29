"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, useScroll } from "framer-motion";
import { Heart, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useOptionalAuth } from "@/components/auth/auth-provider";
import { PanoraLogo } from "@/components/brand/panora-logo";
import { MobileSearchButton } from "@/components/search/mobile-search-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";

const NAV_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/discover?vibe=Weekend%20Away", label: "Weekend" },
  { href: "/the-panora-way", label: "The Panora Way" },
] as const;

type SiteHeaderProps = {
  className?: string;
};

export function SiteHeader({ className }: SiteHeaderProps) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();
  const auth = useOptionalAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Sync immediately (restored scroll / mid-page nav) so glass chrome never
    // keeps a stale on-dark wordmark over the light header.
    // Only commit when the boolean flips — avoids scroll-driven re-renders.
    setScrolled(scrollY.get() > 24);
    return scrollY.on("change", (y) => {
      const next = y > 24;
      setScrolled((prev) => (prev === next ? prev : next));
    });
  }, [scrollY]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function isActive(href: string) {
    const path = href.split("?")[0] ?? href;
    if (path === "/discover") {
      return pathname === "/discover" || pathname.startsWith("/discover/");
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  /**
   * Inverse mark only while the transparent bar sits on a full-bleed dark surface.
   * Once glass chrome is active, follow theme (`auto`) — never keep on-dark on
   * the frosted pill (light or dark theme).
   */
  const overDarkSurface =
    pathname === "/" ||
    pathname.startsWith("/panoras/") ||
    pathname.startsWith("/p/");
  const glassActive = scrolled || open;
  const logoTone =
    !glassActive && overDarkSurface
      ? ("on-dark" as const)
      : ("auto" as const);

  return (
    <header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50",
        "pl-[max(var(--nav-float-inset),env(safe-area-inset-left,0px))] pr-[max(var(--nav-float-inset),env(safe-area-inset-right,0px))]",
        "pt-[max(var(--nav-float-inset),env(safe-area-inset-top,0px))]",
        className,
      )}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-[1120px]">
        <div
          className={cn(
            "rounded-full border transition-[background-color,backdrop-filter,border-color,box-shadow,-webkit-backdrop-filter] duration-150",
            glassActive
              ? "border-[var(--border)] bg-[var(--glass-strong)] shadow-[var(--nav-shadow)] backdrop-blur-2xl"
              : "border-transparent bg-transparent shadow-none",
          )}
        >
          <div className="flex h-[var(--nav-bar-height)] min-w-0 items-center justify-between gap-3 px-3.5 sm:gap-4 sm:px-5">
            <div className="flex min-w-0 shrink-0 items-center">
              <PanoraLogo variant="full" tone={logoTone} priority />
            </div>

            <nav
              aria-label="Primary"
              className="hidden items-center gap-1 lg:flex"
            >
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    prefetch
                    className={cn(
                      "focus-ring relative rounded-[var(--radius-sm)] px-3.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "text-[var(--foreground)]"
                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                      !glassActive && overDarkSurface
                        ? active
                          ? "text-white"
                          : "text-white/85 hover:text-white"
                        : null,
                    )}
                  >
                    {link.label}
                    {active ? (
                      <motion.span
                        layoutId="header-active"
                        className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-[var(--accent)]"
                        transition={
                          reduceMotion
                            ? { duration: 0.01 }
                            : motionTokens.spring.soft
                        }
                      />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <MobileSearchButton
                onDark={!glassActive && overDarkSurface}
              />
              <Link
                href="/saved"
                aria-label="Wishlist"
                title="Wishlist"
                className={cn(
                  "focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--glass)]",
                  "text-[var(--foreground-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]",
                  pathname === "/saved" || pathname.startsWith("/saved/")
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : null,
                  !glassActive && overDarkSurface
                    ? "border-white/25 bg-white/12 text-white hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    : null,
                )}
              >
                <Heart className="h-4 w-4" strokeWidth={2} />
              </Link>
              <ThemeToggle className="hidden sm:inline-flex" />
              <Button
                href="/add-your-place"
                variant="ghost"
                size="sm"
                className={cn(
                  "hidden md:inline-flex",
                  !glassActive && overDarkSurface
                    ? "text-white hover:bg-white/10 hover:text-white"
                    : null,
                )}
              >
                Add your place
              </Button>
              {auth?.user ? (
                <Button
                  href="/explorer"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "hidden sm:inline-flex",
                    !glassActive && overDarkSurface
                      ? "border-white/30 text-white hover:bg-white/10"
                      : null,
                  )}
                >
                  Explorer
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "hidden sm:inline-flex",
                    !glassActive && overDarkSurface
                      ? "border-white/30 text-white hover:bg-white/10"
                      : null,
                  )}
                  onClick={() =>
                    auth?.openAuth({
                      kind: "generic",
                      headline: "Join Panora",
                    })
                  }
                >
                  Join Panora
                </Button>
              )}
              <Button
                href="/enquiry"
                variant="gold"
                size="sm"
                className="hidden sm:inline-flex opacity-100"
              >
                Enquiry
              </Button>
              <button
                type="button"
                className={cn(
                  "focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--glass)] lg:hidden",
                  !glassActive && overDarkSurface
                    ? "border-white/25 bg-white/12 text-white"
                    : null,
                )}
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              id="mobile-nav"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: motionTokens.duration.base }}
              className="mt-2 overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--glass-strong)] shadow-[var(--nav-shadow)] backdrop-blur-2xl lg:hidden"
            >
              <nav
                aria-label="Mobile primary"
                className="flex flex-col gap-1 px-3 py-4 sm:px-4"
              >
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "rounded-[var(--radius-md)] px-3 py-3 text-base font-medium",
                      isActive(link.href)
                        ? "bg-[var(--glass)] text-[var(--foreground)]"
                        : "text-[var(--foreground-muted)]",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-3 flex flex-col gap-2 px-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href="/saved"
                        aria-label="Wishlist"
                        title="Wishlist"
                        className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--glass)] text-[var(--foreground-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        onClick={() => setOpen(false)}
                      >
                        <Heart className="h-4 w-4" strokeWidth={2} />
                      </Link>
                      <ThemeToggle />
                    </div>
                    <Button href="/enquiry" variant="gold" size="md">
                      Enquiry
                    </Button>
                  </div>
                  <Button
                    href="/add-your-place"
                    variant="secondary"
                    size="md"
                    className="w-full justify-center"
                    onClick={() => setOpen(false)}
                  >
                    Add your place
                  </Button>
                  {auth?.user ? (
                    <Button
                      href="/explorer"
                      variant="outline"
                      size="md"
                      className="w-full justify-center"
                      onClick={() => setOpen(false)}
                    >
                      Explorer Profile
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      className="w-full justify-center"
                      onClick={() => {
                        setOpen(false);
                        auth?.openAuth({
                          kind: "generic",
                          headline: "Join Panora",
                        });
                      }}
                    >
                      Join Panora
                    </Button>
                  )}
                </div>
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
