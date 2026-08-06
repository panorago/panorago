import type { BookingRow } from "@/lib/bookings/codes";
import {
  buildQrPayload,
  dataUrlToBuffer,
  generateQrDataUrl,
} from "@/lib/bookings/qr";
import { buildLuxuryTicketPdf } from "@/lib/bookings/ticket-pdf";
import { createServiceClient } from "@/lib/supabase/service";
import { absoluteUrl } from "@/lib/utils";

async function uploadAsset(
  path: string,
  bytes: Buffer,
  contentType: string,
): Promise<string | null> {
  const service = createServiceClient();
  if (!service) return null;
  const { error } = await service.storage
    .from("booking-assets")
    .upload(path, bytes, { contentType, upsert: true });
  if (error) {
    console.info("[bookings] asset upload:", error.message);
    return null;
  }
  return service.storage.from("booking-assets").getPublicUrl(path).data
    .publicUrl;
}

export type RegeneratedAssets = {
  qrCodeUrl: string | null;
  ticketPdfUrl: string | null;
  qrDataUrl: string | null;
};

/** Shared confirm path: QR (verify URL) + luxury PDF → Storage when possible. */
export async function regenerateConfirmedTicketAssets(input: {
  bookingReference: string;
  customerNumber: string;
  customerName: string;
  venueName: string;
  venueAddress?: string | null;
  venueId?: string | null;
  preferredDate?: string | null;
  adults: number;
  children: number;
  occasion?: string | null;
  specialRequest?: string | null;
  createdAt: string;
}): Promise<RegeneratedAssets> {
  const qrPayload = buildQrPayload({
    bookingReference: input.bookingReference,
    customerNumber: input.customerNumber,
    venueName: input.venueName,
    venueId: input.venueId,
    customerName: input.customerName,
    visitDate: input.preferredDate,
    adults: input.adults,
    children: input.children,
  });

  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await generateQrDataUrl(qrPayload);
  } catch (err) {
    console.info(
      "[bookings] QR regen failed:",
      err instanceof Error ? err.message : err,
    );
  }

  let ticketPdfUrl: string | null = null;
  let qrCodeUrl: string | null = null;

  try {
    const ticketBytes = await buildLuxuryTicketPdf({
      statusLabel: "CONFIRMED",
      confirmed: true,
      customerName: input.customerName,
      customerNumber: input.customerNumber,
      bookingReference: input.bookingReference,
      venueName: input.venueName,
      venueAddress: input.venueAddress ?? "",
      enquiryDate: new Date(input.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      preferredDate: input.preferredDate ?? "",
      adults: String(input.adults),
      children: String(input.children),
      occasion: input.occasion ?? "",
      specialRequest: input.specialRequest ?? "",
      qrDataUrl,
      verificationUrl: absoluteUrl(`/verify/${input.customerNumber}`),
    });

    if (qrDataUrl) {
      qrCodeUrl = await uploadAsset(
        `qr/${input.bookingReference}.png`,
        dataUrlToBuffer(qrDataUrl),
        "image/png",
      );
    }
    ticketPdfUrl = await uploadAsset(
      `tickets/${input.bookingReference}.pdf`,
      Buffer.from(ticketBytes),
      "application/pdf",
    );
  } catch (err) {
    console.info(
      "[bookings] PDF regen failed:",
      err instanceof Error ? err.message : err,
    );
  }

  return { qrCodeUrl, ticketPdfUrl, qrDataUrl };
}

export function bookingRowToRegenInput(booking: BookingRow) {
  return {
    bookingReference: booking.booking_reference,
    customerNumber: booking.customer_number,
    customerName: booking.customer_name,
    venueName: booking.venue_name,
    venueAddress: booking.venue_address,
    venueId: booking.venue_id,
    preferredDate: booking.preferred_date,
    adults: booking.adults,
    children: booking.children,
    occasion: booking.occasion,
    specialRequest: booking.special_request,
    createdAt: booking.created_at,
  };
}
