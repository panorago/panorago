"use client";

import { EnquiryBookingForm } from "@/components/place/enquiry-booking-form";

type EnquiryFormProps = {
  initialPlaceName?: string;
  placeId?: string;
  venueAddress?: string;
};

export function EnquiryForm({
  initialPlaceName = "",
  placeId,
  venueAddress,
}: EnquiryFormProps) {
  return (
    <div className="surface-card rounded-[var(--radius-lg)] p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        Enquire with Panora
      </p>
      <h1 className="mt-2 font-display text-3xl leading-tight md:text-4xl">
        {initialPlaceName
          ? `Plan your visit to ${initialPlaceName}`
          : "Start your enquiry"}
      </h1>
      <p className="mt-3 text-sm text-muted">
        We don&apos;t take instant bookings. Share your details and our
        concierge confirms with the venue, then sends your Panora ticket.
      </p>
      <div className="mt-8">
        <EnquiryBookingForm
          placeId={placeId}
          placeName={initialPlaceName || "a general trip"}
          venueAddress={venueAddress}
        />
      </div>
    </div>
  );
}
