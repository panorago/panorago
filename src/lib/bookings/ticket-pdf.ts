import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const NAVY = rgb(10 / 255, 25 / 255, 47 / 255);
const GOLD = rgb(194 / 255, 155 / 255, 98 / 255);
const WHITE = rgb(1, 1, 1);
const MUTED = rgb(0.42, 0.45, 0.5);
const LIGHT = rgb(0.97, 0.95, 0.91);

export type TicketPdfInput = {
  statusLabel: string;
  customerName: string;
  customerNumber: string;
  bookingReference: string;
  venueName: string;
  venueAddress: string;
  enquiryDate: string;
  preferredDate: string;
  adults: string;
  children: string;
  occasion: string;
  specialRequest: string;
  qrDataUrl?: string | null;
  confirmed?: boolean;
  supportWhatsApp?: string;
  supportPhone?: string;
  supportEmail?: string;
  verificationUrl?: string;
};

/** Helvetica/WinAnsi-safe text — pdf-lib throws on em dashes, bullets, etc. */
function winAnsi(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFKD")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2022\u00B7\u2023\u2043]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function dash(value: string | null | undefined) {
  const v = winAnsi(value).trim();
  return v.length > 0 ? v : "-";
}

function supportLine(fields: TicketPdfInput) {
  const wa = winAnsi(
    fields.supportWhatsApp ||
      process.env.NEXT_PUBLIC_PANORA_WHATSAPP ||
      "263715708327",
  );
  const phone = winAnsi(
    fields.supportPhone ||
      process.env.NEXT_PUBLIC_PANORA_PHONE_DISPLAY ||
      "+263 71 553 5982",
  );
  const email = winAnsi(
    fields.supportEmail ||
      process.env.NEXT_PUBLIC_PANORA_EMAIL ||
      "info@panora.co.zw",
  );
  return `WhatsApp ${wa}  |  Phone ${phone}  |  ${email}  |  panora.co.zw`;
}

async function drawWrapped(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  opts: {
    x: number;
    y: number;
    size: number;
    font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
    color: ReturnType<typeof rgb>;
    maxWidth: number;
    lineHeight?: number;
  },
): Promise<number> {
  const safe = winAnsi(text) || "-";
  const words = safe.split(/\s+/);
  let line = "";
  let y = opts.y;
  const lh = opts.lineHeight ?? opts.size + 4;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (opts.font.widthOfTextAtSize(next, opts.size) > opts.maxWidth) {
      if (line) {
        page.drawText(line, {
          x: opts.x,
          y,
          size: opts.size,
          font: opts.font,
          color: opts.color,
        });
        y -= lh;
      }
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    page.drawText(line, {
      x: opts.x,
      y,
      size: opts.size,
      font: opts.font,
      color: opts.color,
    });
    y -= lh;
  }
  return y;
}

export async function buildLuxuryTicketPdf(
  fields: TicketPdfInput,
  retries = 2,
): Promise<Uint8Array> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await buildOnce(fields);
    } catch (err) {
      lastError = err;
      console.info(
        "[ticket-pdf] attempt failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  throw lastError instanceof Error ? lastError : new Error("PDF failed");
}

async function buildOnce(fields: TicketPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([460, 740]);
  const { width, height } = page.getSize();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const status = winAnsi(fields.statusLabel).toUpperCase() || "ENQUIRY RECEIVED";
  const customerNumber = dash(fields.customerNumber);
  const bookingReference = dash(fields.bookingReference);

  page.drawRectangle({ x: 0, y: 0, width, height, color: WHITE });

  page.drawRectangle({
    x: 0,
    y: height - 108,
    width,
    height: 108,
    color: NAVY,
  });
  page.drawText("PANORA GO", {
    x: 36,
    y: height - 42,
    size: 24,
    font: bold,
    color: GOLD,
  });
  page.drawText("Discover - Connect - Belong", {
    x: 36,
    y: height - 64,
    size: 10,
    font: regular,
    color: WHITE,
  });
  page.drawText(status, {
    x: 36,
    y: height - 88,
    size: 12,
    font: bold,
    color: GOLD,
  });

  for (let x = 28; x < width - 28; x += 10) {
    page.drawRectangle({
      x,
      y: height - 118,
      width: 5,
      height: 1.5,
      color: GOLD,
    });
  }

  page.drawRectangle({
    x: 28,
    y: height - 178,
    width: width - 56,
    height: 48,
    color: LIGHT,
    borderColor: GOLD,
    borderWidth: 1,
  });
  page.drawText("CUSTOMER NUMBER", {
    x: 40,
    y: height - 148,
    size: 8,
    font: bold,
    color: GOLD,
  });
  page.drawText(customerNumber, {
    x: 40,
    y: height - 166,
    size: Math.min(16, customerNumber.length > 14 ? 12 : 16),
    font: bold,
    color: NAVY,
  });
  page.drawText("BOOKING REF", {
    x: width - 150,
    y: height - 148,
    size: 8,
    font: bold,
    color: GOLD,
  });
  page.drawText(bookingReference, {
    x: width - 150,
    y: height - 166,
    size: 11,
    font: bold,
    color: NAVY,
  });

  const rows: { label: string; value: string }[] = [
    { label: "Guest", value: dash(fields.customerName) },
    { label: "Venue", value: dash(fields.venueName) },
    { label: "Address", value: dash(fields.venueAddress) },
    { label: "Enquiry date", value: dash(fields.enquiryDate) },
    { label: "Preferred visit", value: dash(fields.preferredDate) },
    { label: "Adults", value: dash(fields.adults) },
    { label: "Children", value: dash(fields.children) },
    { label: "Occasion", value: dash(fields.occasion) },
    { label: "Special request", value: dash(fields.specialRequest) },
  ];

  let y = height - 208;
  for (const row of rows) {
    if (y < 160) break;
    page.drawText(row.label.toUpperCase(), {
      x: 36,
      y,
      size: 7,
      font: bold,
      color: GOLD,
    });
    y -= 13;
    y = await drawWrapped(page, row.value, {
      x: 36,
      y,
      size: 10,
      font: regular,
      color: NAVY,
      maxWidth: width - 180,
      lineHeight: 13,
    });
    y -= 6;
  }

  if (fields.qrDataUrl?.startsWith("data:image/")) {
    try {
      const comma = fields.qrDataUrl.indexOf(",");
      const b64 = comma >= 0 ? fields.qrDataUrl.slice(comma + 1) : "";
      if (b64) {
        const bytes = Buffer.from(b64, "base64");
        const png = fields.qrDataUrl.startsWith("data:image/png")
          ? await pdf.embedPng(bytes)
          : await pdf.embedJpg(bytes);
        page.drawImage(png, {
          x: width - 132,
          y: Math.max(y - 20, 200),
          width: 88,
          height: 88,
        });
        page.drawText("Scan on arrival", {
          x: width - 130,
          y: Math.max(y - 32, 188),
          size: 7,
          font: regular,
          color: MUTED,
        });
      }
    } catch {
      // QR optional — ticket text + verification URL remain
    }
  }

  const message = fields.confirmed
    ? [
        "Your booking is confirmed.",
        "Present this boarding pass or your Customer Number on arrival.",
        "Reference your Panora Customer Number whenever contacting us.",
        "We look forward to helping you create unforgettable memories.",
      ]
    : [
        "Thank you for choosing Panora Go.",
        "Your enquiry has been received successfully.",
        "Our Concierge Team is currently contacting the venue to confirm availability.",
        "We will contact you shortly using your preferred contact method.",
        "Reference your Panora Customer Number whenever contacting us.",
        "We look forward to helping you create unforgettable memories.",
      ];

  const boxTop = Math.min(Math.max(y - 8, 200), 240);
  const boxBottom = 78;
  const boxHeight = Math.max(40, boxTop - boxBottom);

  page.drawRectangle({
    x: 28,
    y: boxBottom,
    width: width - 56,
    height: boxHeight,
    color: LIGHT,
    borderColor: GOLD,
    borderWidth: 0.75,
  });

  let my = boxTop - 14;
  for (const line of message) {
    if (my < boxBottom + 12) break;
    my = await drawWrapped(page, line, {
      x: 40,
      y: my,
      size: 8,
      font: regular,
      color: NAVY,
      maxWidth: width - 80,
      lineHeight: 11,
    });
    my -= 2;
  }

  await drawWrapped(page, supportLine(fields), {
    x: 28,
    y: 52,
    size: 6.5,
    font: regular,
    color: MUTED,
    maxWidth: width - 56,
    lineHeight: 9,
  });

  if (fields.verificationUrl) {
    await drawWrapped(page, fields.verificationUrl, {
      x: 28,
      y: 34,
      size: 6.5,
      font: regular,
      color: GOLD,
      maxWidth: width - 56,
      lineHeight: 9,
    });
  }

  return pdf.save();
}
