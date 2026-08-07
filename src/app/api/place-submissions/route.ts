import { createClient } from "@/lib/supabase/server";
import {
  assertSameOrigin,
  isRateLimited,
} from "@/lib/security/request-guards";
import { NextResponse } from "next/server";
import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .nullable()
  .or(z.literal(""));

const schema = z.object({
  submitter_name: z.string().trim().min(1).max(200),
  submitter_email: z
    .string()
    .trim()
    .email()
    .optional()
    .nullable()
    .or(z.literal("")),
  submitter_phone: z.string().trim().max(80).optional().nullable(),
  place_name: z.string().trim().min(1).max(240),
  location: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
  category: z.string().trim().max(80).optional().nullable(),
  story: z.string().trim().max(20000),
  website: z.string().trim().max(500).optional().nullable(),
  whatsapp: z.string().trim().max(80).optional().nullable(),
  phone: z.string().trim().max(80).optional().nullable(),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .nullable()
    .or(z.literal("")),
  instagram: z.string().trim().max(240).optional().nullable(),
  facebook: z.string().trim().max(240).optional().nullable(),
  google_maps_url: z.string().trim().max(500).optional().nullable(),
  hero_image: optionalUrl,
  gallery_urls: z.array(z.string().trim().max(500)).max(40).optional().nullable(),
  price_guide: z.string().trim().max(200).optional().nullable(),
  average_spend: z.string().trim().max(200).optional().nullable(),
  opening_hours: z.string().trim().max(500).optional().nullable(),
  best_time: z.string().trim().max(240).optional().nullable(),
  dress_vibe: z.string().trim().max(240).optional().nullable(),
  panora_notes: z.string().trim().max(8000).optional().nullable(),
  amenities: z.record(z.string(), z.unknown()).optional().nullable(),
  notes: z.string().trim().max(8000).optional().nullable(),
});

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  if (await isRateLimited(request, "place-submissions", 8, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — please wait a minute." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const payload = {
    phone: d.phone || null,
    email: d.email || null,
    instagram: d.instagram || null,
    facebook: d.facebook || null,
    google_maps_url: d.google_maps_url || null,
    gallery_urls: d.gallery_urls ?? [],
    price_guide: d.price_guide || null,
    average_spend: d.average_spend || null,
    opening_hours: d.opening_hours || null,
    best_time: d.best_time || null,
    dress_vibe: d.dress_vibe || null,
    panora_notes: d.panora_notes || null,
    amenities: d.amenities ?? {},
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("place_submissions")
      .insert({
        submitter_name: d.submitter_name,
        submitter_email: d.submitter_email || null,
        submitter_phone: d.submitter_phone || null,
        place_name: d.place_name,
        location: d.location || "",
        city: d.city || "Harare",
        country: d.country || "Zimbabwe",
        category: d.category || "dining",
        story: d.story,
        website: d.website || null,
        whatsapp: d.whatsapp || null,
        hero_image: d.hero_image || null,
        notes: d.notes || null,
        payload,
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.info("[place-submissions]", error.message);
      return NextResponse.json(
        {
          error:
            "Could not save submission. The place_submissions table may not exist yet — ask an admin to run migration 004.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, id: data?.id }, { status: 201 });
  } catch (err) {
    console.info(
      "[place-submissions]",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "Service unavailable. Please try again later." },
      { status: 503 },
    );
  }
}
