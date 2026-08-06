import { createBooking } from "@/lib/bookings/create-booking";
import { createClient } from "@/lib/supabase/server";
import {
  assertSameOrigin,
  isDuplicateClientToken,
  isRateLimited,
} from "@/lib/security/request-guards";
import { NextResponse } from "next/server";
import { z } from "zod";

const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Business",
  "Family",
  "Holiday",
  "Weekend Escape",
  "Other",
] as const;

const enquirySchema = z.object({
  place_id: z.string().uuid().optional().nullable(),
  place_name: z.string().trim().min(1).max(160),
  venue_address: z.string().trim().max(240).optional().nullable(),
  first_name: z.string().trim().min(1).max(80),
  surname: z.string().trim().min(1).max(80),
  preferred_date: z.string().trim().max(80).optional().nullable(),
  adults: z.number().int().min(0).max(99).default(2),
  children: z.number().int().min(0).max(99).default(0),
  phone: z.string().trim().min(6).max(40),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .nullable()
    .or(z.literal("")),
  budget: z.string().trim().max(80).optional().nullable(),
  special_request: z.string().trim().max(2000).optional().nullable(),
  occasion: z.enum(OCCASIONS).optional().nullable(),
  channel: z
    .enum(["whatsapp", "email", "call", "web"])
    .optional()
    .default("web"),
  /** Idempotency / anti-double-submit token from client */
  client_token: z.string().trim().max(64).optional().nullable(),
});

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  if (await isRateLimited(request, "enquiries", 15, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — please wait a minute." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (await isDuplicateClientToken(parsed.data.client_token)) {
    return NextResponse.json(
      { error: "Duplicate submission — please wait a moment." },
      { status: 429 },
    );
  }

  const booking = await createBooking({
    firstName: parsed.data.first_name,
    surname: parsed.data.surname,
    email: parsed.data.email || null,
    phone: parsed.data.phone,
    venueId: parsed.data.place_id ?? null,
    venueName: parsed.data.place_name,
    venueAddress: parsed.data.venue_address ?? null,
    preferredDate: parsed.data.preferred_date ?? null,
    adults: parsed.data.adults,
    children: parsed.data.children,
    occasion: parsed.data.occasion ?? null,
    budget: parsed.data.budget ?? null,
    specialRequest: parsed.data.special_request ?? null,
  });

  // Mirror into legacy enquiries table when available
  try {
    const supabase = await createClient();
    await supabase.from("enquiries").insert({
      code: booking.bookingReference,
      place_id: parsed.data.place_id ?? null,
      place_name: parsed.data.place_name,
      preferred_date: parsed.data.preferred_date ?? null,
      guests: `${parsed.data.adults} adults, ${parsed.data.children} children`,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      budget: parsed.data.budget ?? null,
      special_request: parsed.data.special_request ?? null,
      channel: parsed.data.channel,
      status: "new",
      payload: {
        ...parsed.data,
        customer_number: booking.customerNumber,
        booking_reference: booking.bookingReference,
      },
    });
  } catch (err) {
    console.info(
      "[enquiries] legacy mirror skipped:",
      err instanceof Error ? err.message : err,
    );
  }

  return NextResponse.json(
    {
      ok: true,
      code: booking.bookingReference,
      booking_reference: booking.bookingReference,
      customer_number: booking.customerNumber,
      id: booking.id,
      stored: booking.stored,
      qr_data_url: booking.qrDataUrl,
      ticket_pdf_base64: booking.ticketPdfBase64,
    },
    { status: 201 },
  );
}
