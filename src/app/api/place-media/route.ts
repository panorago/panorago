import { createPlaceMediaSlot } from "@/lib/media/place-media-slot";
import {
  assertSameOrigin,
  isRateLimited,
} from "@/lib/security/request-guards";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  filename: z.string().trim().min(1).max(180),
  contentType: z.string().trim().min(1).max(120),
  kind: z.enum(["hero", "gallery", "menu", "video"]),
  size: z.number().finite().positive(),
});

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  if (await isRateLimited(request, "place-media", 16, 60_000)) {
    return NextResponse.json(
      { error: "Too many uploads — please wait a minute." },
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
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const slot = await createPlaceMediaSlot({
    ...parsed.data,
    folder: "submissions",
  });
  if (!slot.ok) {
    return NextResponse.json({ error: slot.error }, { status: 503 });
  }

  return NextResponse.json(slot);
}
