"use client";

import { SearchBar } from "@/components/search/search-bar";
import { QuickVibes } from "@/components/search/quick-vibes";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

type MobileSearchButtonProps = {
  onDark?: boolean;
};

export function MobileSearchButton({ onDark = false }: MobileSearchButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={cn(
          "focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border md:hidden",
          onDark
            ? "border-white/25 bg-white/12 text-[var(--brand-gold)]"
            : "border-[var(--border)] bg-[var(--glass)] text-[var(--accent)]",
        )}
        aria-label="Search"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" strokeWidth={2} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[70] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.fast }}
          >
            <button
              type="button"
              aria-label="Close search"
              className="absolute inset-0 bg-[var(--overlay)]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="absolute inset-x-0 top-0 max-h-[88vh] overflow-y-auto rounded-b-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background-elevated)] p-5 pt-[max(1.25rem,env(safe-area-inset-top))] shadow-[var(--shadow)]"
              initial={reduceMotion ? false : { y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? undefined : { y: -24, opacity: 0 }}
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
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SearchBar autoFocus onNavigate={() => setOpen(false)} />
              <div className="mt-5">
                <p className="mb-3 text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                  Quick vibes
                </p>
                <QuickVibes
                  onSelect={(vibe) => {
                    setOpen(false);
                    router.push(`/discover?vibe=${encodeURIComponent(vibe)}`);
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
