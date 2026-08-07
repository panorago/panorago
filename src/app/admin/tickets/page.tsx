import { BookingsTable } from "@/components/admin/bookings-table";
import type { BookingRow } from "@/lib/bookings/codes";
import { getAdminBookings } from "@/lib/admin/command";
import Link from "next/link";

export const metadata = {
  title: "Command Center · Tickets",
};

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const q = params.q ?? "";
  const bookings = await getAdminBookings({
    status: status === "all" ? "all" : status,
    q: q || undefined,
  });

  const rows: BookingRow[] = bookings.map((b) => ({
    id: b.id,
    booking_reference: b.bookingReference,
    customer_number: b.customerNumber,
    customer_name: b.customerName,
    email: b.email,
    phone: b.phone,
    venue_id: b.venueId,
    venue_name: b.venueName,
    venue_address: b.venueAddress,
    preferred_date: b.preferredDate,
    adults: b.adults,
    children: b.children,
    occasion: b.occasion,
    budget: b.budget,
    special_request: b.specialRequest,
    status: b.status,
    qr_code_url: b.qrCodeUrl,
    ticket_pdf_url: b.ticketPdfUrl,
    history: b.history,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Concierge
          </p>
          <h1 className="mt-1 font-display text-4xl">Tickets</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Download, regenerate, and track Panora tickets. Change status
            inline — updates sync live across the Command Center.
            Showing {bookings.length} booking
            {bookings.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          href="/admin/enquiries"
          className="text-sm text-[var(--accent)] hover:opacity-80"
        >
          All enquiries →
        </Link>
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search guest, venue, reference…"
          className="min-w-[14rem] flex-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="unavailable">Unavailable</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <button
          type="submit"
          className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:bg-[var(--glass)]"
        >
          Filter
        </button>
      </form>

      <BookingsTable bookings={rows} />
    </div>
  );
}
