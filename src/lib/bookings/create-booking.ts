import {
  generateBookingReference,
  generateCustomerNumber,
  type BookingStatus,
} from "@/lib/bookings/codes";
import { notifyEnquiryCreated } from "@/lib/bookings/notifications";
import {
  buildQrPayload,
  dataUrlToBuffer,
  generateQrDataUrl,
} from "@/lib/bookings/qr";
import { buildLuxuryTicketPdf } from "@/lib/bookings/ticket-pdf";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type CreateBookingInput = {
  firstName: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
  venueId?: string | null;
  venueName: string;
  venueAddress?: string | null;
  preferredDate?: string | null;
  adults: number;
  children: number;
  occasion?: string | null;
  budget?: string | null;
  specialRequest?: string | null;
};

export type CreateBookingResult = {
  ok: true;
  id?: string;
  bookingReference: string;
  customerNumber: string;
  qrDataUrl: string | null;
  ticketPdfBase64: string | null;
  stored: boolean;
  emailSent?: boolean;
};

async function resolveBookingReference(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("next_booking_reference");
    if (!error && typeof data === "string" && data.startsWith("REF-")) {
      return data;
    }
  } catch {
    // fall through
  }

  const service = createServiceClient();
  if (service) {
    try {
      const { data, error } = await service.rpc("next_booking_reference");
      if (!error && typeof data === "string" && data.startsWith("REF-")) {
        return data;
      }
    } catch {
      // fall through
    }
  }

  return generateBookingReference();
}

async function uploadAsset(
  path: string,
  bytes: Buffer,
  contentType: string,
): Promise<string | null> {
  const service = createServiceClient();
  if (!service) return null;
  const { error } = await service.storage
    .from("booking-assets")
    .upload(path, bytes, { contentType, upsert: true });
  if (error) {
    console.info("[bookings] storage upload failed:", error.message);
    return null;
  }
  const { data } = service.storage.from("booking-assets").getPublicUrl(path);
  return data.publicUrl;
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const firstName = input.firstName.trim();
  const surname = input.surname.trim();
  const customerName = `${firstName} ${surname}`.trim();
  const customerNumber = generateCustomerNumber();
  const timestamp = new Date().toISOString();

  let bookingReference = generateBookingReference();
  try {
    const supabase = await createClient();
    bookingReference = await resolveBookingReference(supabase);
  } catch (err) {
    console.info(
      "[bookings] supabase client unavailable for REF sequence:",
      err instanceof Error ? err.message : err,
    );
  }

  const qrPayload = buildQrPayload({
    bookingReference,
    customerNumber,
    venueName: input.venueName,
    venueId: input.venueId ?? null,
    customerName,
    visitDate: input.preferredDate ?? null,
    adults: input.adults,
    children: input.children,
    timestamp,
    status: "pending",
  });
  const verificationUrl = qrPayload.verificationUrl;

  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await generateQrDataUrl(qrPayload);
  } catch (err) {
    console.info(
      "[bookings] QR failed:",
      err instanceof Error ? err.message : err,
    );
  }

  let ticketPdfBase64: string | null = null;
  let ticketBytes: Uint8Array | null = null;
  try {
    ticketBytes = await buildLuxuryTicketPdf({
      statusLabel: "ENQUIRY RECEIVED",
      customerName,
      customerNumber,
      bookingReference,
      venueName: input.venueName,
      venueAddress: input.venueAddress ?? "",
      enquiryDate: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      preferredDate: input.preferredDate ?? "",
      adults: String(input.adults),
      children: String(input.children),
      occasion: input.occasion ?? "",
      specialRequest: input.specialRequest ?? "",
      qrDataUrl,
      verificationUrl,
    });
    ticketPdfBase64 = Buffer.from(ticketBytes).toString("base64");
  } catch (err) {
    console.info(
      "[bookings] PDF failed:",
      err instanceof Error ? err.message : err,
    );
  }

  let qrCodeUrl: string | null = null;
  let ticketPdfUrl: string | null = null;
  if (qrDataUrl) {
    try {
      qrCodeUrl = await uploadAsset(
        `qr/${bookingReference}.png`,
        dataUrlToBuffer(qrDataUrl),
        "image/png",
      );
    } catch (err) {
      console.info(
        "[bookings] QR upload failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  if (ticketBytes) {
    try {
      ticketPdfUrl = await uploadAsset(
        `tickets/${bookingReference}.pdf`,
        Buffer.from(ticketBytes),
        "application/pdf",
      );
    } catch (err) {
      console.info(
        "[bookings] PDF upload failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  const row = {
    booking_reference: bookingReference,
    customer_number: customerNumber,
    customer_name: customerName,
    customer_first_name: firstName,
    customer_surname: surname,
    email: input.email || null,
    phone: input.phone || null,
    venue_id: input.venueId ?? null,
    venue_name: input.venueName,
    venue_address: input.venueAddress ?? null,
    preferred_date: input.preferredDate ?? null,
    adults: input.adults,
    children: input.children,
    occasion: input.occasion ?? null,
    budget: input.budget ?? null,
    special_request: input.specialRequest ?? null,
    status: "pending" as BookingStatus,
    qr_code_url: qrCodeUrl,
    ticket_pdf_url: ticketPdfUrl,
    qr_payload: qrPayload,
    history: [
      {
        at: timestamp,
        event: "created",
        status: "pending",
      },
    ],
  };

  let stored = false;
  let id: string | undefined;

  try {
    const service = createServiceClient();
    let writer = service;
    if (!writer) {
      try {
        writer = await createClient();
      } catch {
        writer = null;
      }
    }

    if (writer) {
      const { data, error } = await writer
        .from("bookings")
        .insert(row)
        .select("id")
        .maybeSingle();
      if (!error && data) {
        stored = true;
        id = data.id as string;
      } else {
        const legacy = { ...row } as Record<string, unknown>;
        delete legacy.customer_first_name;
        delete legacy.customer_surname;
        const retry = await writer
          .from("bookings")
          .insert(legacy)
          .select("id")
          .maybeSingle();
        if (!retry.error && retry.data) {
          stored = true;
          id = retry.data.id as string;
        } else {
          console.info(
            "[bookings] insert skipped:",
            error?.message ?? retry.error?.message,
          );
        }
      }
    }
  } catch (err) {
    console.info(
      "[bookings] supabase unavailable:",
      err instanceof Error ? err.message : err,
    );
  }

  const notify = await notifyEnquiryCreated({
    bookingReference,
    customerNumber,
    customerName,
    email: input.email,
    phone: input.phone,
    venueName: input.venueName,
    preferredDate: input.preferredDate,
    adults: input.adults,
    children: input.children,
    occasion: input.occasion,
    status: "pending",
  });

  return {
    ok: true,
    id,
    bookingReference,
    customerNumber,
    qrDataUrl,
    ticketPdfBase64,
    stored,
    emailSent: notify.emailSent,
  };
}
