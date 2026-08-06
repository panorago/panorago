import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { BookingRow, BookingStatus } from "@/lib/bookings/codes";

export type PublicBookingView = {
  bookingReference: string;
  customerNumber: string;
  customerName: string;
  venueName: string;
  venueAddress: string | null;
  preferredDate: string | null;
  adults: number;
  children: number;
  occasion: string | null;
  status: BookingStatus;
  createdAt: string;
  verifiedAt: string | null;
};

export async function getBookingForVerify(
  customerNumber: string,
): Promise<PublicBookingView | null> {
  const code = customerNumber.trim();
  if (!code) return null;

  const service = createServiceClient();
  const client = service ?? (await createClient());

  try {
    const { data, error } = await client.rpc(
      "get_booking_by_customer_number",
      { p_customer_number: code },
    );

    if (!error && Array.isArray(data) && data.length > 0) {
      const row = data[0] as Record<string, unknown>;
      return mapPublic(row);
    }

    // Direct select fallback (admin / service role)
    const { data: booking } = await client
      .from("bookings")
      .select("*")
      .ilike("customer_number", code)
      .maybeSingle();

    if (booking) return mapPublic(booking as Record<string, unknown>);
  } catch (err) {
    console.info(
      "[bookings] verify lookup failed:",
      err instanceof Error ? err.message : err,
    );
  }

  return null;
}

export async function markVerified(
  customerNumber: string,
): Promise<string | null> {
  const client = createServiceClient() ?? (await createClient());
  try {
    const { data, error } = await client.rpc("mark_booking_verified", {
      p_customer_number: customerNumber.trim(),
    });
    if (!error && data) return String(data);
  } catch {
    // ignore
  }
  return null;
}

function mapPublic(row: Record<string, unknown>): PublicBookingView {
  return {
    bookingReference: String(row.booking_reference ?? ""),
    customerNumber: String(row.customer_number ?? ""),
    customerName: String(row.customer_name ?? "Guest"),
    venueName: String(row.venue_name ?? ""),
    venueAddress: (row.venue_address as string | null) ?? null,
    preferredDate: (row.preferred_date as string | null) ?? null,
    adults: Number(row.adults) || 0,
    children: Number(row.children) || 0,
    occasion: (row.occasion as string | null) ?? null,
    status: (row.status as BookingStatus) || "pending",
    createdAt: String(row.created_at ?? new Date().toISOString()),
    verifiedAt: (row.verified_at as string | null) ?? null,
  };
}

export async function listBookingsForAdmin(): Promise<BookingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    console.info("[bookings] admin list:", error?.message);
    return [];
  }
  return data as BookingRow[];
}
