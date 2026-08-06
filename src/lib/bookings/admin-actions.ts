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
import {
  bookingRowToRegenInput,
  regenerateConfirmedTicketAssets,
} from "@/lib/bookings/regenerate-assets";
import { createClient } from "@/lib/supabase/server";
import { buildVerificationUrl } from "@/lib/bookings/qr";
import { mailtoUrl, ticketDownloadUrl } from "@/lib/utils";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    throw new Error("Forbidden");
  }

  return { supabase, user };
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
    let qrCodeUrl = booking.qr_code_url;

    if (status === "confirmed") {
      const assets = await regenerateConfirmedTicketAssets(
        bookingRowToRegenInput(booking),
      );
      if (assets.ticketPdfUrl) ticketPdfUrl = assets.ticketPdfUrl;
      if (assets.qrCodeUrl) qrCodeUrl = assets.qrCodeUrl;
      history.push({
        at: new Date().toISOString(),
        event: "ticket_regenerated",
        status,
        by: user.email ?? user.id,
      });

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
        qr_code_url: qrCodeUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/enquiries");
    revalidatePath("/admin/tickets");
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
            `Hello ${booking.customer_name},\n\nYour visit to ${booking.venue_name} is CONFIRMED.\n\nCustomer Number: ${booking.customer_number}\nReference: ${booking.booking_reference}\n\nVerify: ${buildVerificationUrl({
              customerNumber: booking.customer_number,
              bookingReference: booking.booking_reference,
              venueName: booking.venue_name,
              customerName: booking.customer_name,
              visitDate: booking.preferred_date,
              status: "confirmed",
            })}\n`,
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
