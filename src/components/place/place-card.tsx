"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { ProgressiveImage } from "@/components/media/progressive-image";
import { VerifiedBadge } from "@/components/ui/badge";
import { SaveButton } from "@/components/place/save-button";
import { getSavedPlaceIds } from "@/components/place/use-saved-places";
import { fadeUp, cardHover, floatSubtle } from "@/lib/motion/variants";
import { cn, formatDistance, formatPriceGuide } from "@/lib/utils";
import type { Place } from "@/types";

export { getSavedPlaceIds };

type PlaceCardProps = {
  place: Place;
  className?: string;
  float?: boolean;
  priority?: boolean;
};

export function PlaceCard({
  place,
  className,
  float = false,
  priority = false,
}: PlaceCardProps) {
  const reduceMotion = useReducedMotion();
  const distance = formatDistance(place.distanceKm);
  const mood = place.mood[0];
  const tease =
    place.story.length > 96
      ? `${place.story.slice(0, 96).trimEnd()}…`
      : place.story;

  return (
    <motion.article
      variants={reduceMotion ? undefined : fadeUp}
      className={cn("group relative min-w-0", className)}
      {...(float && !reduceMotion ? floatSubtle : {})}
    >
      <motion.div
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-xl)]",
          "border border-[var(--border)] bg-[var(--surface-card)]",
          "backdrop-blur-xl shadow-[var(--shadow)]",
        )}
        initial="rest"
        whileHover={reduceMotion ? undefined : "hover"}
        variants={reduceMotion ? undefined : cardHover}
      >
        <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between gap-2 pointer-events-none">
          {place.verified ? (
            <span className="pointer-events-none">
              <VerifiedBadge />
            </span>
          ) : (
            <span />
          )}
          <span className="pointer-events-auto">
            <SaveButton
              placeId={place.id}
              placeName={place.name}
              imageUrl={place.heroImage}
              atmospheres={place.mood}
              slug={place.slug}
              size="sm"
            />
          </span>
        </div>

        <Link
          href={`/panoras/${place.slug}`}
          className="focus-ring block rounded-[inherit] outline-offset-4"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            <motion.div
              className="absolute inset-0"
              variants={
                reduceMotion
                  ? undefined
                  : {
                      rest: { scale: 1 },
                      hover: {
                        scale: 1.05,
                        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                      },
                    }
              }
            >
              <ProgressiveImage
                src={place.heroImage}
                alt={place.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={priority}
                className="object-cover"
                containerClassName="absolute inset-0"
              />
            </motion.div>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(5,5,5,0.72)] via-transparent to-transparent opacity-90"
            />

            {mood ? (
              <span className="absolute bottom-3 left-3 z-10 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                {mood}
              </span>
            ) : null}
          </div>

          <div className="space-y-2.5 p-4 sm:p-5">
            <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
              <span className="truncate">
                {place.location}
                {place.city ? `, ${place.city}` : ""}
              </span>
            </div>

            <h3 className="break-words font-[family-name:var(--font-display)] text-xl leading-tight tracking-tight text-[var(--foreground)]">
              {place.name}
            </h3>

            <p className="line-clamp-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
              {tease}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs font-medium text-[var(--foreground)]">
              {distance ? (
                <span className="text-[var(--foreground-muted)]">{distance}</span>
              ) : null}
              <span className="text-[var(--accent)]">
                {formatPriceGuide(place.priceGuide)}
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.article>
  );
}
