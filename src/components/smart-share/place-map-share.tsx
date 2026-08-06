"use client";

import { PlaceDirectionsMapDynamic } from "@/components/place/place-directions-map-dynamic";
import {
  SmartShareSheet,
  type SmartSharePlace,
} from "@/components/smart-share/smart-share-sheet";
import { useState } from "react";

type PlaceMapShareProps = {
  place: SmartSharePlace & {
    latitude: number;
    longitude: number;
  };
};

/** Directions map that opens Panora SmartShare™ instead of sharing Maps URLs. */
export function PlaceMapShare({ place }: PlaceMapShareProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PlaceDirectionsMapDynamic
        name={place.name}
        lat={place.latitude}
        lng={place.longitude}
        googleMapsUrl={place.contact.googleMapsUrl}
        shareSlug={place.slug}
        onSmartShare={() => setOpen(true)}
      />
      <SmartShareSheet place={place} open={open} onOpenChange={setOpen} />
    </>
  );
}
