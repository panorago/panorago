import { SavedPlacesClient } from "@/components/place/saved-places-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wishlist",
  description:
    "Your Panora Go wishlist — saved places on this device, ready for the next weekend.",
  alternates: {
    canonical: "/saved",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SavedPage() {
  return <SavedPlacesClient />;
}
