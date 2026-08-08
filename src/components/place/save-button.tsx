"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";

import { useOptionalAuth } from "@/components/auth/auth-provider";
import {
  getSavedPlaceIds,
  replaceSavedPlaceIds,
  useIsSaved,
} from "@/components/place/use-saved-places";
import {
  syncWishlistAction,
  unsavePlaceAction,
} from "@/lib/auth/wishlist";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";

type SaveButtonProps = {
  placeId: string;
  placeName?: string;
  imageUrl?: string | null;
  atmospheres?: string[];
  slug?: string;
  className?: string;
  size?: "sm" | "md";
};

export function SaveButton({
  placeId,
  placeName,
  imageUrl,
  atmospheres,
  slug,
  className,
  size = "md",
}: SaveButtonProps) {
  const { saved, toggle, mounted } = useIsSaved(placeId);
  const auth = useOptionalAuth();
  const reduceMotion = useReducedMotion();

  const dim = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Signed-out: open Join Panora — do not toggle yet
    if (auth && !auth.loading && !auth.user) {
      if (!saved) {
        auth.openAuth({
          kind: "save",
          place: {
            placeId,
            placeName,
            imageUrl: imageUrl ?? undefined,
            atmospheres,
            slug,
          },
          headline: "Save this experience forever.",
          subtitle:
            "Create a free Panora account to keep this place on your wishlist across devices.",
        });
        return;
      }
      // Allow unsave of locally saved items without auth
      toggle();
      return;
    }

    const wasSaved = saved;
    toggle();

    if (auth?.user) {
      try {
        if (wasSaved) {
          const removed = await unsavePlaceAction(placeId);
          if (!removed.ok) {
            toggle(); // revert optimistic local unsave
            return;
          }
        }
        const local = getSavedPlaceIds();
        const synced = await syncWishlistAction(local);
        if (synced.ok) {
          replaceSavedPlaceIds(synced.placeIds);
        } else if (!wasSaved) {
          // Save failed server-side — keep local heart, retry next sync
        }
      } catch {
        if (!wasSaved) {
          // keep optimistic local save
        } else {
          toggle();
        }
      }
    }
  }

  return (
    <motion.button
      type="button"
      onClick={(e) => void handleClick(e)}
      aria-pressed={mounted ? saved : false}
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
