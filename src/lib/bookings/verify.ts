import {
  isBookingReference,
  isCustomerNumber,
  normalizeTicketCode,
  type BookingRow,
  type BookingStatus,
} from "@/lib/bookings/codes";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

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

export type VerifyHints = {
  guest?: string | null;
  venue?: string | null;
  date?: string | null;
  ref?: string | null;
  status?: string | null;
};

export async function getBookingForVerify(
  customerNumber: string,
): Promise<PublicBookingView | null> {
  const code = normalizeTicketCode(customerNumber);
  if (!code) return null;

  const service = createServiceClient();
  const client = service ?? (await createClient());

  try {
    const { data, error } = await client.rpc(
      "get_booking_by_customer_number",
      { p_customer_number: code },
    );

    if (!error && Array.isArray(data) && data.length > 0) {
      return mapPublic(data[0] as Record<string, unknown>);
    }

    // Direct select fallback (service role bypasses RLS; anon cannot read bookings)
    if (service) {
      let query = service.from("bookings").select("*");
      if (isCustomerNumber(code)) {
        query = query.ilike("customer_number", code);
      } else if (isBookingReference(code)) {
        query = query.ilike("booking_reference", code);
      } else {
        query = query.or(
          `customer_number.ilike.${code},booking_reference.ilike.${code}`,
        );
      }

      const { data: booking } = await query.maybeSingle();
      if (booking) return mapPublic(booking as Record<string, unknown>);
    }
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
  const code = normalizeTicketCode(customerNumber);
  if (!code) return null;

  const client = createServiceClient() ?? (await createClient());
  try {
    const { data, error } = await client.rpc("mark_booking_verified", {
      p_customer_number: code,
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
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    console.info("[bookings] admin list: unauthorized");
    return [];
  }

  const { data: profile } = await session
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && profile.role !== "admin") {
    console.info("[bookings] admin list: forbidden");
    return [];
  }

  const supabase = createServiceClient() ?? session;
  const pageSize = 1000;
  const hardCap = 5000;
  const all: BookingRow[] = [];
  let from = 0;

  while (all.length < hardCap) {
    const to = Math.min(from + pageSize - 1, hardCap - 1);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.info("[bookings] admin list:", error.message);
      break;
    }
    if (!data?.length) break;
    all.push(...(data as BookingRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}
