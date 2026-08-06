import { PlacesMap } from "@/components/map/places-map";
import { getPublishedPlaces } from "@/lib/data/places";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Map · Panora Go",
  description:
    "Explore curated Zimbabwe places on an interactive map — Harare, Nyanga, Kariba, Victoria Falls, Bulawayo, and beyond.",
};

export default async function MapPage() {
  const places = await getPublishedPlaces();

  return (
    <div className="-mt-[var(--nav-height)] pt-[var(--nav-height)]">
      <PlacesMap places={places} />
    </div>
  );
}
