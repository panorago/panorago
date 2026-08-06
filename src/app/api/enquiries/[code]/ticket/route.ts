import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { NextResponse } from "next/server";

type TicketFields = {
  code: string;
  place: string;
  date: string;
  adults: string;
  children: string;
  phone: string;
  specialRequest: string;
};

const NAVY = rgb(10 / 255, 25 / 255, 47 / 255);
const GOLD = rgb(194 / 255, 155 / 255, 98 / 255);
const WHITE = rgb(1, 1, 1);
const MUTED = rgb(0.45, 0.48, 0.52);

function dash(value: string | null | undefined) {
  const v = value?.trim();
  return v && v.length > 0 ? v : "—";
}

async function buildTicketPdf(fields: TicketFields): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([420, 620]);
  const { width, height } = page.getSize();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: WHITE,
  });

  page.drawRectangle({
    x: 0,
    y: height - 88,
    width,
    height: 88,
    color: NAVY,
  });

  page.drawText("PANORA GO", {
    x: 36,
    y: height - 42,
    size: 22,
    font: bold,
    color: GOLD,
  });

  page.drawText("Enquiry ticket", {
    x: 36,
    y: height - 66,
    size: 11,
    font: regular,
    color: WHITE,
  });

  page.drawRectangle({
    x: 28,
    y: height - 160,
    width: width - 56,
    height: 52,
    color: rgb(0.97, 0.94, 0.88),
    borderColor: GOLD,
    borderWidth: 1,
  });

  page.drawText("Reference", {
    x: 40,
    y: height - 128,
    size: 9,
    font: regular,
    color: MUTED,
  });

  page.drawText(fields.code, {
    x: 40,
    y: height - 148,
    size: 20,
    font: bold,
    color: NAVY,
  });

  const rows: { label: string; value: string }[] = [
    { label: "Place", value: fields.place },
    { label: "Date", value: fields.date },
    { label: "Adults", value: fields.adults },
    { label: "Children", value: fields.children },
    { label: "Phone", value: fields.phone },
    { label: "Special request", value: fields.specialRequest },
  ];

  let y = height - 200;
  for (const row of rows) {
    page.drawText(row.label.toUpperCase(), {
      x: 36,
      y,
      size: 8,
      font: bold,
      color: GOLD,
    });
    y -= 16;

    const maxWidth = width - 72;
    const words = row.value.split(/\s+/);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (regular.widthOfTextAtSize(next, 11) > maxWidth) {
        page.drawText(line, { x: 36, y, size: 11, font: regular, color: NAVY });
        y -= 15;
        line = word;
      } else {
        line = next;
      }
    }
    if (line) {
      page.drawText(line, { x: 36, y, size: 11, font: regular, color: NAVY });
      y -= 15;
    }
    y -= 14;
  }

  page.drawText("We'll be in touch shortly · panora.co.zw", {
    x: 36,
    y: 36,
    size: 9,
    font: regular,
    color: MUTED,
  });

  return pdf.save();
}

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await context.params;
  const code = decodeURIComponent(rawCode).trim().toUpperCase();
  const { searchParams } = new URL(request.url);

  let fields: TicketFields = {
    code,
    place: dash(searchParams.get("place")),
    date: dash(searchParams.get("date")),
    adults: dash(searchParams.get("adults")),
    children: dash(searchParams.get("children")),
    phone: dash(searchParams.get("phone")),
    specialRequest: dash(searchParams.get("special_request")),
  };

  try {
    const supabase = await createClient();
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
      const adults =
        payload.adults != null
          ? String(payload.adults)
          : searchParams.get("adults");
      const children =
        payload.children != null
          ? String(payload.children)
          : searchParams.get("children");

      fields = {
        code: (data.code as string) || code,
        place: dash(
          (data.place_name as string | null) || searchParams.get("place"),
        ),
        date: dash(
          (data.preferred_date as string | null) || searchParams.get("date"),
        ),
        adults: dash(adults),
        children: dash(children),
        phone: dash((data.phone as string | null) || searchParams.get("phone")),
        specialRequest: dash(
          (data.special_request as string | null) ||
            searchParams.get("special_request"),
        ),
      };
    }
  } catch {
    // Query-string fallback is enough when Supabase is unavailable.
  }

  const bytes = await buildTicketPdf(fields);
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
