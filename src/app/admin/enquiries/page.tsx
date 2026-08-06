import {
  getAdminBookings,
  updateBookingStatus,
} from "@/lib/admin/command";
import { BOOKING_STATUS_COLORS, type BookingStatus } from "@/lib/bookings/codes";
import { mailtoUrl, telUrl, whatsappUrl } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const metadata = {
  title: "Command Center · Enquiries",
};

const STATUSES: Array<BookingStatus | "all"> = [
  "all",
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "unavailable",
];

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function AdminEnquiriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const q = params.q ?? "";
  const bookings = await getAdminBookings({ status, q });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Concierge
          </p>
          <h1 className="mt-1 font-display text-4xl">Enquiries</h1>
          <p className="mt-2 text-sm text-muted">
            Bookings with customer numbers, QR tickets, and status history.
          </p>
        </div>
        <Link
          href="/admin/tickets"
          className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:bg-[var(--glass)]"
        >
          Tickets view
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, number, venue…"
          className="min-w-[220px] flex-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : BOOKING_STATUS_COLORS[s].label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)]"
        >
          Filter
        </button>
      </form>

      {bookings.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--glass)] px-6 py-16 text-center">
          <p className="font-display text-2xl">No enquiries yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            When guests submit from place pages, bookings appear here. Ensure
            migration <code>003_bookings.sql</code> has been applied.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => {
            const meta = BOOKING_STATUS_COLORS[booking.status];
            return (
              <li
                key={booking.id}
                className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow)] backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/enquiries/${booking.id}`}
                        className="font-display text-xl hover:text-[var(--accent)]"
                      >
                        {booking.customerName}
                      </Link>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {booking.venueName} ·{" "}
                      <span className="text-[var(--accent)]">
                        {booking.customerNumber}
                      </span>{" "}
                      · {booking.bookingReference}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {booking.preferredDate
                        ? `Preferred ${booking.preferredDate} · `
                        : ""}
                      {booking.adults} adults
                      {booking.children ? `, ${booking.children} children` : ""}{" "}
                      ·{" "}
                      {formatDistanceToNow(new Date(booking.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {booking.phone && (
                      <>
                        <a
                          href={whatsappUrl(
                            booking.phone.replace(/\D/g, ""),
                            `Hi ${booking.customerName}, regarding your Panora enquiry ${booking.customerNumber} for ${booking.venueName}.`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--glass)]"
                        >
                          WhatsApp
                        </a>
                        <a
                          href={telUrl(booking.phone)}
                          className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--glass)]"
                        >
                          Call
                        </a>
                      </>
                    )}
                    {booking.email && (
                      <a
                        href={mailtoUrl(
                          booking.email,
                          `Panora Go — ${booking.customerNumber}`,
                          `Hello ${booking.customerName},\n\nRegarding your enquiry for ${booking.venueName} (${booking.customerNumber}).\n`,
                        )}
                        className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--glass)]"
                      >
                        Email
                      </a>
                    )}
                    {booking.ticketPdfUrl && (
                      <a
                        href={booking.ticketPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--glass)]"
                      >
                        Ticket PDF
                      </a>
                    )}
                    {booking.qrCodeUrl && (
                      <a
                        href={booking.qrCodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--glass)]"
                      >
                        QR
                      </a>
                    )}
                    <Link
                      href={`/admin/enquiries/${booking.id}`}
                      className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-foreground)]"
                    >
                      Open
                    </Link>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                  {(
                    [
                      "confirmed",
                      "unavailable",
                      "cancelled",
                      "completed",
                      "pending",
                    ] as BookingStatus[]
                  )
                    .filter((s) => s !== booking.status)
                    .map((next) => (
                      <form
                        key={next}
                        action={async () => {
                          "use server";
                          await updateBookingStatus(booking.id, next);
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-full border border-[var(--border)] px-3 py-1 text-xs capitalize hover:bg-[var(--glass)]"
                        >
                          Mark {next}
                        </button>
                      </form>
                    ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
