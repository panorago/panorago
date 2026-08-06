import { BookingsTable } from "@/components/admin/bookings-table";
import { listBookingsForAdmin } from "@/lib/bookings/verify";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookings — Panora Admin",
};

export default async function AdminBookingsPage() {
  const bookings = await listBookingsForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Concierge
        </p>
        <h1 className="mt-1 font-display text-3xl">Bookings</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Manage enquiry status. Confirming regenerates the luxury PDF ticket
          and prepares WhatsApp / email templates for the guest.
        </p>
      </div>
      <BookingsTable bookings={bookings} />
    </div>
  );
}
