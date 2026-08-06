import { createClient } from "@/lib/supabase/server";
import { buildLuxuryTicketPdf } from "@/lib/bookings/ticket-pdf";
import { buildQrPayload, generateQrDataUrl } from "@/lib/bookings/qr";
import { createServiceClient } from "@/lib/supabase/service";
import { absoluteUrl } from "@/lib/utils";
import { NextResponse } from "next/server";

function dash(value: string | null | undefined) {
  const v = value?.trim();
  return v && v.length > 0 ? v : "—";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await context.params;
  const code = decodeURIComponent(rawCode).trim().toUpperCase();
  const { searchParams } = new URL(request.url);

  let customerName = dash(searchParams.get("name"));
  let customerNumber = dash(searchParams.get("customer_number"));
  let place = dash(searchParams.get("place"));
  let address = dash(searchParams.get("address"));
  let date = dash(searchParams.get("date"));
  let adults = dash(searchParams.get("adults"));
  let children = dash(searchParams.get("children"));
  let phone = dash(searchParams.get("phone"));
  let occasion = dash(searchParams.get("occasion"));
  let specialRequest = dash(searchParams.get("special_request"));
  let statusLabel = "ENQUIRY RECEIVED";
  let confirmed = false;
  let bookingReference = code;

  try {
    const service = createServiceClient();
    const supabase = service ?? (await createClient());
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .or(`booking_reference.eq.${code},customer_number.eq.${code}`)
      .maybeSingle();

    if (booking) {
      bookingReference = booking.booking_reference as string;
      customerNumber = dash(booking.customer_number as string);
      customerName = dash(booking.customer_name as string);
      place = dash(booking.venue_name as string);
      address = dash(booking.venue_address as string | null);
      date = dash(booking.preferred_date as string | null);
      adults = dash(String(booking.adults));
      children = dash(String(booking.children));
      phone = dash(booking.phone as string | null);
      occasion = dash(booking.occasion as string | null);
      specialRequest = dash(booking.special_request as string | null);
      const status = booking.status as string;
      confirmed = status === "confirmed";
      statusLabel =
        status === "confirmed"
          ? "CONFIRMED"
          : status === "pending"
            ? "ENQUIRY RECEIVED"
            : status.toUpperCase();
    } else {
      const { data } = await supabase
        .from("enquiries")
        .select(
          "code, place_name, preferred_date, guests, phone, special_request, payload",
        )
        .eq("code", code)
        .maybeSingle();

      if (data) {
        const payload =
          data.payload && typeof data.payload === "object"
            ? (data.payload as Record<string, unknown>)
            : {};
        place = dash(
          (data.place_name as string | null) || searchParams.get("place"),
        );
        date = dash(
          (data.preferred_date as string | null) || searchParams.get("date"),
        );
        phone = dash((data.phone as string | null) || searchParams.get("phone"));
        specialRequest = dash(
          (data.special_request as string | null) ||
            searchParams.get("special_request"),
        );
        if (payload.adults != null) adults = String(payload.adults);
        if (payload.children != null) children = String(payload.children);
        if (typeof payload.customer_number === "string") {
          customerNumber = payload.customer_number;
        }
        if (
          typeof payload.first_name === "string" ||
          typeof payload.surname === "string"
        ) {
          customerName = dash(
            `${payload.first_name ?? ""} ${payload.surname ?? ""}`.trim(),
          );
        }
        if (typeof payload.occasion === "string") occasion = payload.occasion;
      }
    }
  } catch {
    // Query-string fallback
  }

  const resolvedCustomerNumber =
    customerNumber === "—" ? bookingReference : customerNumber;
  const verificationUrl = absoluteUrl(`/verify/${resolvedCustomerNumber}`);

  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await generateQrDataUrl(
      buildQrPayload({
        bookingReference,
        customerNumber: resolvedCustomerNumber,
        venueName: place === "—" ? "Panora Go" : place,
        visitDate: date === "—" ? null : date,
        adults: Number(adults) || 0,
        children: Number(children) || 0,
        customerName: customerName === "—" ? "Guest" : customerName,
      }),
    );
  } catch {
    qrDataUrl = null;
  }

  const bytes = await buildLuxuryTicketPdf({
    statusLabel,
    confirmed,
    customerName,
    customerNumber: resolvedCustomerNumber,
    bookingReference,
    venueName: place,
    venueAddress: address,
    enquiryDate: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    preferredDate: date,
    adults,
    children,
    occasion,
    specialRequest:
      specialRequest === "—" && phone !== "—"
        ? `Phone: ${phone}`
        : specialRequest,
    qrDataUrl,
    verificationUrl,
  });

  const filename = `panora-go-${code.replace(/[^A-Z0-9-]/gi, "")}.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
