import { getAdminBooking, updateBookingStatus } from "@/lib/admin/command";
import { BOOKING_STATUS_COLORS, type BookingStatus } from "@/lib/bookings/codes";
import { mailtoUrl, telUrl, whatsappUrl } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const booking = await getAdminBooking(id);
  return {
    title: booking
      ? `Enquiry · ${booking.customerNumber}`
      : "Enquiry · Command Center",
  };
}

export default async function AdminEnquiryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const booking = await getAdminBooking(id);
  if (!booking) notFound();

  const meta = BOOKING_STATUS_COLORS[booking.status];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/admin/enquiries"
          className="text-sm text-muted hover:text-[var(--accent)]"
        >
          ← Enquiries
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl">{booking.customerName}</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${meta.className}`}
          >
            {meta.label}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          Customer number{" "}
          <span className="font-semibold text-[var(--accent)]">
            {booking.customerNumber}
          </span>{" "}
          · Ref {booking.bookingReference}
        </p>
      </div>

      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow)] sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Venue</p>
          <p className="mt-1 font-medium">{booking.venueName}</p>
          {booking.venueAddress && (
            <p className="text-sm text-muted">{booking.venueAddress}</p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Preferred date
          </p>
          <p className="mt-1 font-medium">{booking.preferredDate || "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Party</p>
          <p className="mt-1 font-medium">
            {booking.adults} adults · {booking.children} children
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Occasion
          </p>
          <p className="mt-1 font-medium">{booking.occasion || "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Budget</p>
          <p className="mt-1 font-medium">{booking.budget || "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Submitted
          </p>
          <p className="mt-1 font-medium">
            {format(new Date(booking.createdAt), "dd MMM yyyy · HH:mm")}
          </p>
        </div>
        {booking.specialRequest && (
          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Special request
            </p>
            <p className="mt-1 text-sm leading-relaxed">{booking.specialRequest}</p>
          </div>
        )}
      </section>

      <section className="flex flex-wrap gap-2">
        {booking.phone && (
          <>
            <a
              href={whatsappUrl(
                booking.phone.replace(/\D/g, ""),
                `Hi ${booking.customerName}, regarding your Panora enquiry ${booking.customerNumber} for ${booking.venueName}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:bg-[var(--glass)]"
            >
              WhatsApp
            </a>
            <a
              href={telUrl(booking.phone)}
              className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:bg-[var(--glass)]"
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
            className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:bg-[var(--glass)]"
          >
            Email
          </a>
        )}
        {booking.ticketPdfUrl && (
          <a
            href={booking.ticketPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)]"
          >
            Download ticket
          </a>
        )}
        {booking.qrCodeUrl && (
          <a
            href={booking.qrCodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:bg-[var(--glass)]"
          >
            View QR
          </a>
        )}
      </section>

      {booking.qrCodeUrl && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-4 sm:max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={booking.qrCodeUrl}
            alt={`QR for ${booking.customerNumber}`}
            className="h-auto w-full"
          />
        </div>
      )}

      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-6">
        <h2 className="font-display text-2xl">Update status</h2>
        <p className="mt-1 text-sm text-muted">
          Confirm regenerates QR + ticket PDF when storage is configured.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              "pending",
              "confirmed",
              "unavailable",
              "cancelled",
              "completed",
            ] as BookingStatus[]
          ).map((status) => (
            <form
              key={status}
              action={async () => {
                "use server";
                await updateBookingStatus(id, status);
              }}
            >
              <button
                type="submit"
                disabled={booking.status === status}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm capitalize hover:bg-[var(--glass)] disabled:opacity-40"
              >
                {status}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-6">
        <h2 className="font-display text-2xl">History</h2>
        {booking.history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No history entries.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {[...booking.history].reverse().map((entry, i) => (
              <li
                key={`${entry.at}-${i}`}
                className="border-l-2 border-[var(--accent)]/40 pl-4"
              >
                <p className="text-sm font-medium">{entry.event}</p>
                <p className="text-xs text-muted">
                  {format(new Date(entry.at), "dd MMM yyyy · HH:mm")}
                  {entry.status ? ` · ${entry.status}` : ""}
                  {entry.note ? ` · ${entry.note}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
