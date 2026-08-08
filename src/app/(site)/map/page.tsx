import { PlacesMapDynamic } from "@/components/map/places-map-dynamic";
import { getPublishedPlaces } from "@/lib/data/places";
import { absoluteUrl } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Map",
  description:
    "Explore Panora Go places on an interactive map — Zimbabwe tourism across Chinhoyi, Mashonaland West, Kariba, Victoria Falls, and beyond.",
  alternates: {
    canonical: absoluteUrl("/map"),
  },
};

export default async function MapPage() {
  const places = await getPublishedPlaces();

  return (
    <div className="-mt-[var(--nav-height)] pt-[var(--nav-height)]">
      <PlacesMapDynamic places={places} />
    </div>
  );
}
