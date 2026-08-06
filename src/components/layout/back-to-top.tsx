"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";

type BackToTopProps = {
  className?: string;
  threshold?: number;
};

export function BackToTop({ className, threshold = 480 }: BackToTopProps) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  /** Place pages show the enquire FAB on mobile — stack above it. */
  const aboveEnquireFab = pathname.startsWith("/panoras/");

  useEffect(() => {
    return scrollY.on("change", (y) => {
      setVisible(y > threshold);
    });
  }, [scrollY, threshold]);

  function scrollTop() {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={scrollTop}
          className={cn(
            "focus-ring fixed z-40 inline-flex h-11 w-11 items-center justify-center",
            "rounded-full border border-[var(--border)] bg-[var(--glass-strong)] text-[var(--foreground)]",
            "shadow-[var(--shadow)] backdrop-blur-xl",
            "bottom-[var(--fab-bottom)]",
            /* Keep clear of the enquire FAB on place pages (mobile). */
            aboveEnquireFab
              ? "left-[var(--fab-edge)] right-auto md:left-auto md:right-8 md:bottom-8"
              : "right-[var(--fab-edge)] md:right-8 md:bottom-8",
            "hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-[var(--shadow-gold)]",
            className,
          )}
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.9 }}
          transition={motionTokens.spring.soft}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.94 }}
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2} aria-hidden />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
