"use client";

import dynamic from "next/dynamic";
import type { Place } from "@/types";

const PlacesMapLazy = dynamic(
  () =>
    import("@/components/map/places-map").then((m) => ({
      default: m.PlacesMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[calc(100dvh-var(--nav-height)-var(--bottom-nav-height)-env(safe-area-inset-bottom))] min-h-[28rem] items-center justify-center bg-[var(--brand-navy)] text-sm text-white/70 md:h-[calc(100dvh-var(--nav-height))]"
        aria-busy
        aria-label="Loading map"
      >
        Preparing map…
      </div>
    ),
  },
);

type Props = {
  places: Place[];
};

/** Client-only wrapper so the Google Maps chunk stays off the critical path. */
export function PlacesMapDynamic({ places }: Props) {
  return <PlacesMapLazy places={places} />;
}
