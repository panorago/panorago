"use client";

import { useReducedMotion } from "framer-motion";

import { PlaceCard } from "@/components/place/place-card";
import { Stagger } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { Place } from "@/types";

type PlaceGridProps = {
  places: Place[];
  className?: string;
  float?: boolean;
  priorityCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function PlaceGrid({
  places,
  className,
  float = false,
  priorityCount = 2,
  emptyTitle = "No places to show just yet",
  emptyDescription = "Check back soon — new discoveries are always on the way.",
}: PlaceGridProps) {
  const reduceMotion = useReducedMotion();

  if (places.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--glass)] px-6 py-12 text-center backdrop-blur-xl">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
          {emptyTitle}
        </p>
        <p className="long-form mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <Stagger
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 [&>*]:min-w-0",
        className,
      )}
      fast={reduceMotion ?? false}
    >
      {places.map((place, index) => (
        <PlaceCard
          key={place.id}
          place={place}
          float={float && index % 2 === 0}
          priority={index < priorityCount}
        />
      ))}
    </Stagger>
  );
}
