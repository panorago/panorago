import { getPublishedPlaces } from "@/lib/data/places";
import { NextResponse } from "next/server";

export const revalidate = 120;

export async function GET() {
  const places = await getPublishedPlaces();
  return NextResponse.json(places, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}
