import { getPlaceBySlug } from "@/lib/data/places";
import { NextResponse } from "next/server";
import { z } from "zod";

const paramsSchema = z.object({
  slug: z.string().min(1),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid slug", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const place = await getPlaceBySlug(parsed.data.slug);
  if (!place) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  return NextResponse.json({ place });
}
