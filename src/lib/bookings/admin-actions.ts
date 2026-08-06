"use server";

import {
  BOOKING_STATUS_COLORS,
  type BookingHistoryEvent,
  type BookingRow,
  type BookingStatus,
} from "@/lib/bookings/codes";
import {
  confirmationWhatsAppDeepLink,
  notifyBookingConfirmed,
} from "@/lib/bookings/notifications";
import { buildQrPayload, generateQrDataUrl } from "@/lib/bookings/qr";
import { buildLuxuryTicketPdf } from "@/lib/bookings/ticket-pdf";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { absoluteUrl, mailtoUrl, ticketDownloadUrl } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export type BookingActionResult =
  | {
      ok: true;
      message?: string;
      ticketUrl?: string;
      whatsappUrl?: string;
      emailUrl?: string;
    }
  | { ok: false; error: string };

const STATUSES = Object.keys(BOOKING_STATUS_COLORS) as BookingStatus[];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

async function uploadTicket(
  bookingReference: string,
  bytes: Uint8Array,
): Promise<string | null> {
  const service = createServiceClient();
  if (!service) return null;
  const path = `tickets/${bookingReference}.pdf`;
  const { error } = await service.storage
    .from("booking-assets")
    .upload(path, Buffer.from(bytes), {
      contentType: "application/pdf",
      upsert: true,
    });
  if (error) {
    console.info("[bookings] admin ticket upload:", error.message);
    return null;
  }
  return service.storage.from("booking-assets").getPublicUrl(path).data
    .publicUrl;
}

/** Prefer (id, status). Also accepts FormData for form actions. */
export async function updateBookingStatusAction(
  idOrForm: string | FormData,
  statusArg?: BookingStatus,
): Promise<BookingActionResult> {
  try {
    const { supabase, user } = await requireAdmin();

    let id: string;
    let status: BookingStatus;

    if (typeof idOrForm === "string") {
      id = idOrForm.trim();
      status = (statusArg ?? "") as BookingStatus;
    } else {
      id = String(idOrForm.get("id") ?? "").trim();
      status = String(idOrForm.get("status") ?? "").trim() as BookingStatus;
    }

    if (!id || !STATUSES.includes(status)) {
      return { ok: false, error: "Invalid booking or status" };
    }

    const { data: existing, error: loadError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (loadError || !existing) {
      return { ok: false, error: loadError?.message ?? "Booking not found" };
    }

    const booking = existing as BookingRow;
    const history: BookingHistoryEvent[] = Array.isArray(booking.history)
      ? [...booking.history]
      : [];
    history.push({
      at: new Date().toISOString(),
      event: "status_change",
      status,
      by: user.email ?? user.id,
    });

    let ticketPdfUrl = booking.ticket_pdf_url;
    let qrDataUrl: string | null = null;

    if (status === "confirmed") {
      const qrPayload = buildQrPayload({
        bookingReference: booking.booking_reference,
        customerNumber: booking.customer_number,
        venueName: booking.venue_name,
        venueId: booking.venue_id,
        customerName: booking.customer_name,
        visitDate: booking.preferred_date,
        adults: booking.adults,
        children: booking.children,
      });
      try {
        qrDataUrl = await generateQrDataUrl(qrPayload);
      } catch {
        qrDataUrl = null;
      }
      try {
        const ticketBytes = await buildLuxuryTicketPdf({
          statusLabel: "CONFIRMED",
          confirmed: true,
          customerName: booking.customer_name,
          customerNumber: booking.customer_number,
          bookingReference: booking.booking_reference,
          venueName: booking.venue_name,
          venueAddress: booking.venue_address ?? "",
          enquiryDate: new Date(booking.created_at).toLocaleDateString(
            "en-GB",
            { day: "numeric", month: "short", year: "numeric" },
          ),
          preferredDate: booking.preferred_date ?? "",
          adults: String(booking.adults),
          children: String(booking.children),
          occasion: booking.occasion ?? "",
          specialRequest: booking.special_request ?? "",
          qrDataUrl,
          verificationUrl: absoluteUrl(`/verify/${booking.customer_number}`),
        });
        const uploaded = await uploadTicket(
          booking.booking_reference,
          ticketBytes,
        );
        if (uploaded) ticketPdfUrl = uploaded;
        history.push({
          at: new Date().toISOString(),
          event: "ticket_regenerated",
          status,
          by: user.email ?? user.id,
        });
      } catch (err) {
        console.info(
          "[bookings] confirm PDF failed:",
          err instanceof Error ? err.message : err,
        );
      }

      await notifyBookingConfirmed({
        bookingReference: booking.booking_reference,
        customerNumber: booking.customer_number,
        customerName: booking.customer_name,
        email: booking.email,
        phone: booking.phone,
        venueName: booking.venue_name,
        preferredDate: booking.preferred_date,
        adults: booking.adults,
        children: booking.children,
        occasion: booking.occasion,
        status: "confirmed",
      });
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status,
        history,
        ticket_pdf_url: ticketPdfUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    revalidatePath("/admin/bookings");
    revalidatePath("/admin");

    const ticketUrl =
      ticketPdfUrl ||
      ticketDownloadUrl(booking.booking_reference, {
        placeName: booking.venue_name,
        date: booking.preferred_date ?? undefined,
        adults: booking.adults,
        children: booking.children,
        name: booking.customer_name,
        customerNumber: booking.customer_number,
        occasion: booking.occasion ?? undefined,
        address: booking.venue_address ?? undefined,
      });

    const whatsappUrl =
      status === "confirmed"
        ? confirmationWhatsAppDeepLink({
            bookingReference: booking.booking_reference,
            customerNumber: booking.customer_number,
            customerName: booking.customer_name,
            email: booking.email,
            phone: booking.phone,
            venueName: booking.venue_name,
            preferredDate: booking.preferred_date,
            adults: booking.adults,
            children: booking.children,
            occasion: booking.occasion,
            status: "confirmed",
          })
        : undefined;

    const emailUrl =
      booking.email && status === "confirmed"
        ? mailtoUrl(
            booking.email,
            `Confirmed — ${booking.venue_name} (${booking.customer_number})`,
            `Hello ${booking.customer_name},\n\nYour visit to ${booking.venue_name} is CONFIRMED.\n\nCustomer Number: ${booking.customer_number}\nReference: ${booking.booking_reference}\n\nVerify: ${absoluteUrl(`/verify/${booking.customer_number}`)}\n`,
          )
        : undefined;

    return {
      ok: true,
      message: `Status set to ${status}`,
      ticketUrl,
      whatsappUrl,
      emailUrl,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

/** Alias used by Command Center bookings table */
export const updateBookingStatus = updateBookingStatusAction;
