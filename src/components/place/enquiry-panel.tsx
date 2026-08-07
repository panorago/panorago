"use client";

import { EnquiryBookingForm } from "@/components/place/enquiry-booking-form";
import { EnquireModal } from "@/components/place/enquire-modal";
import { useState } from "react";

interface EnquiryPanelProps {
  placeName: string;
  placeSlug?: string;
  placeId?: string;
  venueAddress?: string;
}

export function EnquiryPanel({
  placeName,
  placeId,
  venueAddress,
}: EnquiryPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <aside className="surface-card w-full min-w-0 rounded-[var(--radius-lg)] p-4 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        Enquire with Panora
      </p>
      <h2 className="mt-2 font-display text-2xl leading-tight">
        Plan your visit to {placeName}
      </h2>
      <p className="mt-2 text-sm text-muted">
        Share a few details — we confirm availability with the venue, then send
        your Panora ticket.
      </p>

      {/* Desktop: open premium glass modal; form also inline in the sidebar */}
      <div className="mt-5 hidden md:block">
        <EnquireModal
          placeId={placeId}
          placeName={placeName}
          venueAddress={venueAddress}
          open={modalOpen}
          onOpenChange={setModalOpen}
          showFab={false}
          showDesktopTrigger
        />
      </div>

      <div className="mt-6 hidden lg:block">
        <EnquiryBookingForm
          placeId={placeId}
          placeName={placeName}
          venueAddress={venueAddress}
          compact
        />
      </div>

      <p className="mt-4 text-xs text-muted lg:hidden">
        Tap Enquire below to open the concierge form.
      </p>
    </aside>
  );
}
