import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

import { getPublishedPlaces } from "@/lib/data/places";
import { searchPlaceSummary, toSearchPlace } from "@/lib/search/search-document";
import { createPublicClient } from "@/lib/supabase/public";
import {
  assertSameOrigin,
  isRateLimited,
} from "@/lib/security/request-guards";

function logSearch(query: string, resultCount: number) {
  const supabase = createPublicClient();
  if (!supabase) return;
  void supabase.from("analytics_events").insert({
    event_name: "search",
    path: query.trim().toLowerCase().slice(0, 160),
    meta: { result_count: resultCount },
  });
}

function parseIds(text: string): string[] {
  const cleaned = text
    .trim()
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const candidates = [cleaned];
  const bracket = cleaned.match(/\[[\s\S]*\]/);
  if (bracket?.[0] && bracket[0] !== cleaned) candidates.push(bracket[0]);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (!Array.isArray(parsed)) continue;
      return parsed.filter((id): id is string => typeof id === "string");
    } catch {
      continue;
    }
  }
  return [];
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ matchedIds: [] }, { status: 403 });
  }

  if (await isRateLimited(request, "search", 40, 60_000)) {
    return NextResponse.json({ matchedIds: [] }, { status: 429 });
  }

  let query = "";
  try {
    const body = (await request.json()) as { query?: unknown };
    query = typeof body.query === "string" ? body.query.trim() : "";
  } catch {
    return NextResponse.json({ matchedIds: [] });
  }

  if (query.length < 2 || query.length > 160) {
    return NextResponse.json({ matchedIds: [] });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey.includes("YOUR_KEY")) {
    logSearch(query, 0);
    return NextResponse.json({ matchedIds: [] });
  }

  try {
    const places = (await getPublishedPlaces()).map(toSearchPlace);
    if (places.length === 0) return NextResponse.json({ matchedIds: [] });

    const placeSummaries = places.map(searchPlaceSummary).join("\n");
    const known = new Set(places.map((place) => place.id));
    const modelName = process.env.GEMINI_SEARCH_MODEL?.trim() || "gemini-2.5-flash";
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: modelName,
    });

    const prompt = `You are a smart search engine for Panora Go, Zimbabwe's premium tourism and lifestyle discovery platform.

A user searched for: "${query.replace(/"/g, "'")}"

Here are the available places with their details:
${placeSummaries}

Your job is to find places that match what the user is looking for — including semantic and mood-based matches, not just keyword matches.

Matching rules:
- "fire" or "BBQ" or "grill" → match braai places
- "swim" or "swimming" or "water" → match pool, lake, dam, houseboat
- "romantic" or "couples" or "love" → match date night, anniversary places
- "kids" or "children" or "family" → match child-friendly amenity
- "coffee" or "cafe" or "morning" → match coffee shops
- "view" or "sunset" or "golden hour" → match scenic lookouts
- "sleep" or "stay" or "overnight" or "accommodation" → match lodges, farm stays, houseboats
- "eat" or "food" or "dinner" or "lunch" → match restaurants, dining
- "escape" or "getaway" or "relax" → match lodges, farm stays, nature spots
- "cheap" or "affordable" or "budget" → match lower price range places
- "luxury" or "premium" or "high end" → match higher price range places
- "Kariba" or "lake" or "boat" → match houseboat
- "Vic Falls" or "falls" or "waterfall" → match Victoria Falls places
- "caves" or "limestone" or "blue pool" → match Chinhoyi Caves places

Order results by relevance — best match first.
Return ONLY a valid JSON array of matching place IDs.
Example: ["abc123", "def456"]
If nothing matches, return exactly: []
Do not include any explanation, markdown, or extra text.`;

    const result = await model.generateContent(prompt);
    const matchedIds = [...new Set(
      parseIds(result.response.text()).filter((id) => known.has(id)),
    )].slice(0, 8);

    logSearch(query, matchedIds.length);

    return NextResponse.json({ matchedIds });
  } catch (err) {
    console.error(
      "Gemini search error:",
      err instanceof Error ? err.message : "unknown",
    );
    return NextResponse.json({ matchedIds: [] });
  }
}
