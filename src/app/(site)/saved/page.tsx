import { SavedPlacesClient } from "@/components/place/saved-places-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved places",
  description:
    "Your saved Panora Go places on this device — ready for the next weekend.",
};

export default function SavedPage() {
  return <SavedPlacesClient />;
}
