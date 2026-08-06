import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const enquirySchema = z.object({
  place_id: z.string().uuid().optional().nullable(),
  place_name: z.string().trim().max(160).optional().nullable(),
  preferred_date: z.string().trim().max(80).optional().nullable(),
  guests: z.string().trim().max(80).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  budget: z.string().trim().max(80).optional().nullable(),
  special_request: z.string().trim().max(2000).optional().nullable(),
  channel: z
    .enum(["whatsapp", "email", "call", "web"])
    .optional()
    .default("web"),
});

function generateEnquiryCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `PGO-${suffix}`;
}

export async function POST(request: Request) {
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

  const code = generateEnquiryCode();
  const payload = {
    code,
    place_id: parsed.data.place_id ?? null,
    place_name: parsed.data.place_name ?? null,
    preferred_date: parsed.data.preferred_date ?? null,
    guests: parsed.data.guests ?? null,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email || null,
    budget: parsed.data.budget ?? null,
    special_request: parsed.data.special_request ?? null,
    channel: parsed.data.channel,
    status: "new",
    payload: parsed.data,
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("enquiries")
      .insert(payload)
      .select("id, code, created_at")
      .maybeSingle();

    if (!error && data) {
      return NextResponse.json(
        {
          ok: true,
          code: data.code as string,
          id: data.id as string,
          stored: true,
        },
        { status: 201 },
      );
    }

    console.info("[enquiries] Supabase insert skipped/failed:", error?.message);
  } catch (err) {
    console.info(
      "[enquiries] Supabase unavailable, returning local code:",
      err instanceof Error ? err.message : err,
    );
  }

  console.info("[enquiries] Generated enquiry", code, payload);

  return NextResponse.json(
    {
      ok: true,
      code,
      stored: false,
    },
    { status: 201 },
  );
}
