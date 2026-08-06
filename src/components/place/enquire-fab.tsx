"use client";

import { EnquireModal } from "@/components/place/enquire-modal";

type EnquireFabProps = {
  placeName?: string;
  placeId?: string | null;
  venueAddress?: string | null;
};

/** Mobile FAB + shared enquire modal for venue pages. */
export function EnquireFab({
  placeName = "Panora Go",
  placeId,
  venueAddress,
}: EnquireFabProps) {
  return (
    <EnquireModal
      placeId={placeId}
      placeName={placeName}
      venueAddress={venueAddress}
      showFab
      showDesktopTrigger={false}
    />
  );
}
