"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";
import { useIsSaved } from "@/components/place/use-saved-places";

type SaveButtonProps = {
  placeId: string;
  placeName?: string;
  className?: string;
  size?: "sm" | "md";
};

export function SaveButton({
  placeId,
  placeName,
  className,
  size = "md",
}: SaveButtonProps) {
  const { saved, toggle } = useIsSaved(placeId);
  const reduceMotion = useReducedMotion();

  const dim = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      aria-pressed={saved}
      aria-label={
        saved
          ? `Remove ${placeName ?? "place"} from wishlist`
          : `Add ${placeName ?? "place"} to wishlist`
      }
      className={cn(
        "focus-ring relative inline-flex items-center justify-center rounded-full",
        "border border-[var(--border)] bg-[var(--glass-strong)] backdrop-blur-xl",
        "text-[var(--foreground)] shadow-[var(--shadow)]",
        "hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]",
        "hover:text-[var(--accent)]",
        dim,
        className,
      )}
      whileTap={reduceMotion ? undefined : { scale: 0.9 }}
      transition={motionTokens.spring.snappy}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={saved ? "on" : "off"}
          initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={reduceMotion ? undefined : { scale: 0.6, opacity: 0 }}
          transition={{ duration: motionTokens.duration.fast }}
          className="flex"
        >
          <Heart
            className={cn(
              icon,
              saved && "fill-[var(--accent)] text-[var(--accent)]",
            )}
            strokeWidth={1.75}
          />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
