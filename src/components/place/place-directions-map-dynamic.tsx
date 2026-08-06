"use client";

import dynamic from "next/dynamic";

const PlaceDirectionsMapLazy = dynamic(
  () =>
    import("@/components/place/place-directions-map").then(
      (m) => m.PlaceDirectionsMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)]" />
    ),
  },
);

type Props = {
  name: string;
  lat: number;
  lng: number;
  googleMapsUrl?: string | null;
};

/** Client-only wrapper so `ssr: false` is valid (App Router). */
export function PlaceDirectionsMapDynamic(props: Props) {
  return <PlaceDirectionsMapLazy {...props} />;
}
