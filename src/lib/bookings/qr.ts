import QRCode from "qrcode";
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
}): QrPayload {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const visitDate = input.visitDate ?? input.date ?? null;
  return {
    bookingReference: input.bookingReference,
    customerNumber: input.customerNumber,
    venue: input.venueName,
    visitDate,
    date: visitDate,
    adults: input.adults,
    children: input.children,
    timestamp,
    verificationUrl: absoluteUrl(`/verify/${input.customerNumber}`),
    venueId: input.venueId ?? null,
    customerName: input.customerName,
  };
}

/**
 * Encode the bare verification URL so phone cameras open /verify/…
 * Metadata remains in qr_payload / DB for tickets and admin.
 */
export async function generateQrDataUrl(
  payload: QrPayload,
  retries = 2,
): Promise<string> {
  const text = payload.verificationUrl;
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
