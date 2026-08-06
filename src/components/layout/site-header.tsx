"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { PanoraBrandLockup } from "@/components/brand/panora-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";

const NAV_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/map", label: "Map" },
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
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (y) => {
      setScrolled(y > 24);
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

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300",
        scrolled
          ? "border-b border-[var(--border)] bg-[var(--glass-strong)] shadow-[var(--shadow)] backdrop-blur-2xl"
          : "border-b border-transparent bg-transparent",
        className,
      )}
    >
      <div className="container-panora flex h-[var(--nav-height)] items-center justify-between gap-4">
        <motion.div
          animate={{
            scale: scrolled && !reduceMotion ? 0.94 : 1,
          }}
          transition={motionTokens.spring.soft}
          className="origin-left"
        >
          <PanoraBrandLockup scrolled={scrolled} />
        </motion.div>

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
                className={cn(
                  "focus-ring relative rounded-[var(--radius-sm)] px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-[var(--foreground)]"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
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
          <ThemeToggle className="hidden sm:inline-flex" />
          <Button
            href="/enquiry"
            variant="gold"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Enquiry
          </Button>
          <button
            type="button"
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--glass)] lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
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
            className="border-t border-[var(--border)] bg-[var(--glass-strong)] backdrop-blur-2xl lg:hidden"
          >
            <nav
              aria-label="Mobile primary"
              className="container-panora flex flex-col gap-1 py-4"
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
              <div className="mt-3 flex items-center justify-between gap-3 px-1">
                <ThemeToggle />
                <Button href="/enquiry" variant="gold" size="md">
                  Enquiry
                </Button>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
