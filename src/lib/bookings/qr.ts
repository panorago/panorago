import QRCode from "qrcode";
import { isCustomerNumber, normalizeTicketCode } from "@/lib/bookings/codes";
import { absoluteUrl } from "@/lib/utils";

export type QrPayload = {
  bookingReference: string;
  customerNumber: string;
  venue: string;
  visitDate: string | null;
  adults: number;
  children: number;
  timestamp: string;
  verificationUrl: string;
  venueId?: string | null;
  customerName?: string;
  date?: string | null;
};

/**
 * Absolute /verify/{PGO-…} URL phones can open.
 * Compact query hints keep offline/seed UX useful when the booking row is missing.
 */
export function buildVerificationUrl(input: {
  customerNumber: string;
  bookingReference?: string;
  venueName?: string;
  customerName?: string;
  visitDate?: string | null;
  status?: string;
  origin?: string | null;
}): string {
  const customerNumber = normalizeTicketCode(input.customerNumber);
  const path = `/verify/${encodeURIComponent(customerNumber)}`;
  const url = new URL(absoluteUrl(path, input.origin));

  if (input.bookingReference) {
    url.searchParams.set("ref", normalizeTicketCode(input.bookingReference));
  }
  if (input.venueName?.trim()) {
    url.searchParams.set("venue", input.venueName.trim().slice(0, 80));
  }
  if (input.customerName?.trim()) {
    url.searchParams.set("guest", input.customerName.trim().slice(0, 80));
  }
  if (input.visitDate?.trim()) {
    url.searchParams.set("date", input.visitDate.trim().slice(0, 40));
  }
  if (input.status?.trim()) {
    url.searchParams.set("status", input.status.trim().toLowerCase().slice(0, 24));
  }

  return url.toString();
}

export function buildQrPayload(input: {
  bookingReference: string;
  customerNumber: string;
  venueName: string;
  venueId?: string | null;
  customerName?: string;
  visitDate?: string | null;
  date?: string | null;
  adults: number;
  children: number;
  timestamp?: string;
  status?: string;
  origin?: string | null;
}): QrPayload {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const visitDate = input.visitDate ?? input.date ?? null;
  const customerNumber = normalizeTicketCode(input.customerNumber);
  const bookingReference = normalizeTicketCode(input.bookingReference);

  return {
    bookingReference,
    customerNumber,
    venue: input.venueName,
    visitDate,
    date: visitDate,
    adults: input.adults,
    children: input.children,
    timestamp,
    verificationUrl: buildVerificationUrl({
      customerNumber,
      bookingReference,
      venueName: input.venueName,
      customerName: input.customerName,
      visitDate,
      status: input.status,
      origin: input.origin,
    }),
    venueId: input.venueId ?? null,
    customerName: input.customerName,
  };
}

/**
 * Encode the absolute verification URL so phone cameras open /verify/…
 * Metadata remains in qr_payload / DB for tickets and admin.
 */
export async function generateQrDataUrl(
  payload: QrPayload,
  retries = 2,
): Promise<string> {
  const text =
    payload.verificationUrl ||
    (isCustomerNumber(payload.customerNumber)
      ? buildVerificationUrl({
          customerNumber: payload.customerNumber,
          bookingReference: payload.bookingReference,
          venueName: payload.venue,
          customerName: payload.customerName,
          visitDate: payload.visitDate,
        })
      : absoluteUrl(`/verify/${encodeURIComponent(payload.customerNumber)}`));

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await QRCode.toDataURL(text, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 320,
        color: {
          dark: "#0A192F",
          light: "#FFFFFF",
        },
      });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("QR generation failed");
}

export function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Invalid data URL");
  return Buffer.from(base64, "base64");
}
