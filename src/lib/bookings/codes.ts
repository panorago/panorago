const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Panora Customer Number — PGO-2026-X7K4P2 */
export function generateCustomerNumber(year = new Date().getFullYear()): string {
  return `PGO-${year}-${randomSegment(6)}`;
}

/** Normalize path/query ticket codes (case, spaces, URI encoding). */
export function normalizeTicketCode(raw: string): string {
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // keep raw trim
  }
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isCustomerNumber(code: string): boolean {
  return /^PGO-\d{4}-[A-Z0-9]{4,}$/.test(normalizeTicketCode(code));
}

export function isBookingReference(code: string): boolean {
  return /^REF-\d+$/.test(normalizeTicketCode(code));
}

/**
 * Booking reference — REF-000127 style.
 * Prefer DB sequence via next_booking_reference(); this is a unique padded fallback.
 */
export function generateBookingReference(): string {
  const n = Math.floor(Math.random() * 900000) + 100000;
  return `REF-${String(n).padStart(6, "0")}`;
}

export function formatBookingReference(seq: number): string {
  return `REF-${String(Math.max(0, Math.floor(seq))).padStart(6, "0")}`;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "unavailable"
  | "cancelled"
  | "completed";

export const BOOKING_STATUS_COLORS: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-[color-mix(in_srgb,#c29b62_22%,transparent)] text-[#c29b62]",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-[color-mix(in_srgb,#22c55e_22%,transparent)] text-[#22c55e]",
  },
  unavailable: {
    label: "Unavailable",
    className: "bg-[color-mix(in_srgb,#f97316_22%,transparent)] text-[#f97316]",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-[color-mix(in_srgb,#ef4444_22%,transparent)] text-[#ef4444]",
  },
  completed: {
    label: "Completed",
    className: "bg-[color-mix(in_srgb,#3b82f6_22%,transparent)] text-[#3b82f6]",
  },
};

export type BookingHistoryEvent = {
  at: string;
  event: string;
  status?: BookingStatus | string;
  note?: string;
  by?: string;
};

export type BookingRow = {
  id: string;
  booking_reference: string;
  customer_number: string;
  customer_name: string;
  customer_first_name?: string | null;
  customer_surname?: string | null;
  email: string | null;
  phone: string | null;
  venue_id: string | null;
  venue_name: string;
  venue_address: string | null;
  preferred_date: string | null;
  adults: number;
  children: number;
  occasion: string | null;
  budget: string | null;
  special_request: string | null;
  status: BookingStatus;
  qr_code_url: string | null;
  ticket_pdf_url: string | null;
  qr_payload?: Record<string, unknown> | null;
  history?: BookingHistoryEvent[] | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
};
