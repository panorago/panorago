import { createClient } from "@/lib/supabase/server";
import {
  assertSameOrigin,
  isRateLimited,
} from "@/lib/security/request-guards";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  submitter_name: z.string().trim().min(1).max(120),
  submitter_email: z.string().trim().email().optional().nullable().or(z.literal("")),
  submitter_phone: z.string().trim().max(40).optional().nullable(),
  place_name: z.string().trim().min(1).max(160),
  location: z.string().trim().max(240).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  category: z.string().trim().max(40).optional().nullable(),
  story: z.string().trim().max(8000),
  website: z.string().trim().max(240).optional().nullable(),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  hero_image: z.string().trim().url().optional().nullable().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().nullable(),
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

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("place_submissions")
      .insert({
        submitter_name: parsed.data.submitter_name,
        submitter_email: parsed.data.submitter_email || null,
        submitter_phone: parsed.data.submitter_phone || null,
        place_name: parsed.data.place_name,
        location: parsed.data.location || "",
        city: parsed.data.city || "Harare",
        country: parsed.data.country || "Zimbabwe",
        category: parsed.data.category || "dining",
        story: parsed.data.story,
        website: parsed.data.website || null,
        whatsapp: parsed.data.whatsapp || null,
        hero_image: parsed.data.hero_image || null,
        notes: parsed.data.notes || null,
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
