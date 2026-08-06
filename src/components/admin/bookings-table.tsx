"use client";

import {
  BOOKING_STATUS_COLORS,
  type BookingRow,
  type BookingStatus,
} from "@/lib/bookings/codes";
import { updateBookingStatusAction } from "@/lib/bookings/admin-actions";
import { mailtoUrl, ticketDownloadUrl, whatsappUrl } from "@/lib/utils";
import { Download, Mail, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "unavailable",
  "cancelled",
  "completed",
];

function confirmationWhatsApp(booking: BookingRow) {
  return [
    `Hello ${booking.customer_name}`,
    "",
    "Great news!",
    "",
    "Your enquiry for",
    booking.venue_name,
    "has been confirmed.",
    "",
    "Reference Number",
    booking.booking_reference,
    "",
    "Please present the attached Panora Ticket upon arrival.",
    "",
    "Thank you for discovering Zimbabwe with Panora Go.",
  ].join("\n");
}

export function BookingsTable({ bookings }: { bookings: BookingRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const panoraWhatsapp =
    process.env.NEXT_PUBLIC_PANORA_WHATSAPP ?? "263715708327";

  function onStatusChange(id: string, status: BookingStatus) {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("status", status);
      const result = await updateBookingStatusAction(formData);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] p-8 text-center text-sm text-muted">
        No bookings yet. New enquiries appear here after guests submit the
        form. Run migration{" "}
        <code className="text-[var(--accent)]">003_bookings.sql</code> in
        Supabase if the table is missing.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--background-elevated)] text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-3 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">Venue</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Party</th>
              <th className="px-3 py-3 font-medium">Occasion</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Reference</th>
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {bookings.map((booking) => {
              const colors = BOOKING_STATUS_COLORS[booking.status];
              const ticketHref = ticketDownloadUrl(booking.booking_reference, {
                placeName: booking.venue_name,
                date: booking.preferred_date ?? undefined,
                adults: booking.adults,
                children: booking.children,
                phone: booking.phone ?? undefined,
                specialRequest: booking.special_request ?? undefined,
                name: booking.customer_name,
                customerNumber: booking.customer_number,
                occasion: booking.occasion ?? undefined,
                address: booking.venue_address ?? undefined,
              });

              return (
                <tr key={booking.id} className="bg-[var(--background)]">
                  <td className="px-3 py-3 align-top">
                    <p className="font-medium">{booking.customer_name}</p>
                    <p className="text-xs text-muted">
                      {booking.customer_number}
                    </p>
                    <p className="text-xs text-muted">{booking.phone}</p>
                  </td>
                  <td className="px-3 py-3 align-top">{booking.venue_name}</td>
                  <td className="px-3 py-3 align-top">
                    {booking.preferred_date || "—"}
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    {booking.adults}A / {booking.children}C
                  </td>
                  <td className="px-3 py-3 align-top">
                    {booking.occasion || "—"}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <select
                      disabled={pending}
                      value={booking.status}
                      onChange={(e) =>
                        onStatusChange(
                          booking.id,
                          e.target.value as BookingStatus,
                        )
                      }
                      className={`rounded-full px-2 py-1 text-xs font-semibold outline-none ${colors.className}`}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {BOOKING_STATUS_COLORS[status].label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 align-top font-mono text-xs">
                    {booking.booking_reference}
                    {booking.qr_code_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={booking.qr_code_url}
                        alt=""
                        className="mt-2 h-12 w-12 rounded border border-[var(--border)] bg-white"
                      />
                    ) : null}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col gap-1.5">
                      <a
                        href={ticketHref}
                        className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                        download
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </a>
                      {booking.phone ? (
                        <a
                          href={whatsappUrl(
                            booking.phone.replace(/^\+/, "") || panoraWhatsapp,
                            confirmationWhatsApp(booking),
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      ) : null}
                      {booking.email ? (
                        <a
                          href={mailtoUrl(
                            booking.email,
                            "Your Panora Go Enquiry Has Been Confirmed",
                            [
                              `Hello ${booking.customer_name},`,
                              "",
                              `Great news — your enquiry for ${booking.venue_name} has been updated.`,
                              "",
                              `Reference: ${booking.booking_reference}`,
                              `Customer Number: ${booking.customer_number}`,
                              "",
                              "Download your ticket from the link our team shared, or reply to this email.",
                              "",
                              "Discover. Connect. Belong.",
                              "Panora Go",
                            ].join("\n"),
                          )}
                          className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
