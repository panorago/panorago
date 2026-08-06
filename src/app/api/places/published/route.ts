import { getPublishedPlaces } from "@/lib/data/places";
import { NextResponse } from "next/server";

export async function GET() {
  const places = await getPublishedPlaces();
  return NextResponse.json(places);
}
