"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { useState } from "react";

import { useOptionalAuth } from "@/components/auth/auth-provider";
import {
  ensureSavedPlaceId,
  getSavedPlaceIds,
  mergeSavedPlaceIds,
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
  const [notice, setNotice] = useState<string | null>(null);

  const dim = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  function flashNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3200);
  }

  async function persistAfterLocalSave() {
    const local = getSavedPlaceIds();
    const synced = await syncWishlistAction(local);
    if (synced.ok) {
      // Server returns local∪remote — replace is safe and picks up other devices
      replaceSavedPlaceIds(synced.placeIds);
      return;
    }
    // Auth / hard errors: keep local heart; surface only real auth problems
    mergeSavedPlaceIds(synced.placeIds ?? local);
    if (synced.error && /join panora|sign in|auth/i.test(synced.error)) {
      flashNotice(synced.error);
      console.warn("[wishlist] save sync auth error", synced.error);
    } else if (synced.error) {
      console.warn("[wishlist] save sync deferred", synced.error);
    }
  }

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Signed-out: open Join Panora — still park the place locally so nothing is lost
    if (auth && !auth.loading && !auth.user) {
      if (!saved) {
        ensureSavedPlaceId(placeId);
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
    toggle(); // optimistic local — must always succeed for UX

    if (!auth?.user) {
      // Auth still loading / no provider: local-only is fine
      return;
    }

    try {
      if (wasSaved) {
        const removed = await unsavePlaceAction(placeId);
        if (!removed.ok) {
          toggle(); // revert optimistic local unsave
          flashNotice(removed.error);
          console.warn("[wishlist] unsave failed", removed.error);
          return;
        }
        // Keep local (already without placeId); pull remote ids without re-adding
        const local = getSavedPlaceIds().filter((id) => id !== placeId);
        const synced = await syncWishlistAction(local);
        if (synced.ok) {
          replaceSavedPlaceIds(
            synced.placeIds.filter((id) => id !== placeId),
          );
        }
        return;
      }

      await persistAfterLocalSave();
    } catch (err) {
      console.warn("[wishlist] save click exception", err);
      if (wasSaved) {
        // Local unsave already applied; leave it — server can reconcile later
      }
      // Save path: keep optimistic local save
    }
  }

  return (
    <span className="relative inline-flex">
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
      <span className="sr-only" aria-live="polite">
        {notice}
      </span>
      {notice ? (
        <span
          role="status"
          className="absolute right-0 top-full z-30 mt-2 w-max max-w-[14rem] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--glass-strong)] px-2.5 py-1.5 text-left text-[11px] leading-snug text-[var(--foreground)] shadow-[var(--shadow)] backdrop-blur-xl"
        >
          {notice}
        </span>
      ) : null}
    </span>
  );
}
