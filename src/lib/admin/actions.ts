"use server";

import {
  mapPlaceRow,
  mapStoryRow,
  type PlaceRow,
  type StoryRow,
} from "@/lib/data/places";
import { createClient } from "@/lib/supabase/server";
import type {
  HomepageSection,
  HomepageSectionKey,
  MoodTag,
  Place,
  PlaceAmenityFlags,
  PlaceCategory,
  PlaceContact,
  PlaceHighlights,
} from "@/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import slugify from "slugify";

export type ActionResult =
  | { ok: true; message?: string; id?: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  // If profiles table is missing, allow authenticated users (dev / pre-migration).
  // Once profiles exist, require role = admin.
  if (profile && profile.role !== "admin") {
    throw new Error("Forbidden");
  }

  return { supabase, user, profile };
}

function asString(value: FormDataEntryValue | null, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asBool(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseLines(raw: string): string[] {
  return raw
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function placePayloadFromForm(formData: FormData) {
  const name = asString(formData.get("name"));
  const slugInput = asString(formData.get("slug"));
  const slug =
    slugInput ||
    slugify(name, { lower: true, strict: true, trim: true });

  const mood = parseLines(asString(formData.get("mood"))) as MoodTag[];
  const gallery = parseLines(asString(formData.get("gallery")));
  const homepageSections = parseLines(
    asString(formData.get("homepageSections")),
  ) as HomepageSectionKey[];

  const highlights: PlaceHighlights = {
    goldenHour: asString(formData.get("goldenHour")) || undefined,
    bestTime: asString(formData.get("bestTime")) || undefined,
    dressVibe: asString(formData.get("dressVibe")) || undefined,
    noiseLevel: asString(formData.get("noiseLevel")) || undefined,
    averageSpend: asString(formData.get("averageSpend")) || undefined,
    openingHours: asString(formData.get("openingHours")) || undefined,
    perfectFor: parseLines(asString(formData.get("perfectFor"))),
    paymentMethods: parseLines(asString(formData.get("paymentMethods"))),
  };

  const amenities: PlaceAmenityFlags = {
    power: asBool(formData.get("power")),
    solar: asBool(formData.get("solar")),
    borehole: asBool(formData.get("borehole")),
    wifi: asBool(formData.get("wifi")),
    starlink: asBool(formData.get("starlink")),
    petFriendly: asBool(formData.get("petFriendly")),
    kidFriendly: asBool(formData.get("kidFriendly")),
    wheelchairAccess: asBool(formData.get("wheelchairAccess")),
    parking: asBool(formData.get("parking")),
    security: asBool(formData.get("security")),
    swimming: asBool(formData.get("swimming")),
    fireplace: asBool(formData.get("fireplace")),
    outdoorSeating: asBool(formData.get("outdoorSeating")),
    music: asBool(formData.get("music")),
    photography: asBool(formData.get("photography")),
    phoneSignal:
      (asString(formData.get("phoneSignal")) as PlaceAmenityFlags["phoneSignal"]) ||
      undefined,
    roadCondition:
      (asString(
        formData.get("roadCondition"),
      ) as PlaceAmenityFlags["roadCondition"]) || undefined,
  };

  const contact: PlaceContact = {
    whatsapp: asString(formData.get("whatsapp")) || null,
    phone: asString(formData.get("phone")) || null,
    email: asString(formData.get("email")) || null,
    website: asString(formData.get("website")) || null,
    instagram: asString(formData.get("instagram")) || null,
    facebook: asString(formData.get("facebook")) || null,
    tiktok: asString(formData.get("tiktok")) || null,
    googleMapsUrl: asString(formData.get("googleMapsUrl")) || null,
  };

  const latRaw = asString(formData.get("latitude"));
  const lngRaw = asString(formData.get("longitude"));
  const distanceRaw = asString(formData.get("distanceKm"));

  return {
    slug,
    name,
    location: asString(formData.get("location")),
    city: asString(formData.get("city")),
    country: asString(formData.get("country")) || "Zimbabwe",
    latitude: latRaw ? Number(latRaw) : null,
    longitude: lngRaw ? Number(lngRaw) : null,
    category: asString(formData.get("category"), "dining") as PlaceCategory,
    mood,
    story: asString(formData.get("story")),
    panora_notes: asString(formData.get("panoraNotes")),
    highlights,
    amenities,
    contact,
    price_guide: asString(formData.get("priceGuide")) || "Enquire",
    distance_km: distanceRaw ? Number(distanceRaw) : null,
    verified: asBool(formData.get("verified")),
    published: asBool(formData.get("published")),
    featured: asBool(formData.get("featured")),
    archived: asBool(formData.get("archived")),
    paid_tier: (asString(formData.get("paidTier"), "basic") || "basic") as
      | "basic"
      | "silver"
      | "gold"
      | "platinum",
    hero_image: asString(formData.get("heroImage")),
    gallery,
    meta_title: asString(formData.get("metaTitle")) || null,
    meta_description: asString(formData.get("metaDescription")) || null,
    homepage_sections: homepageSections,
    video_url: asString(formData.get("videoUrl")) || null,
    updated_at: new Date().toISOString(),
  };
}

export async function loginAdmin(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = asString(formData.get("email"));
  const password = asString(formData.get("password"));

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Login failed.",
    };
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  redirect("/admin/login");
}

export async function getAdminPlaces(): Promise<Place[]> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error || !data) return [];
    return (data as PlaceRow[]).map(mapPlaceRow);
  } catch {
    return [];
  }
}

export async function getAdminPlace(id: string): Promise<Place | null> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapPlaceRow(data as PlaceRow);
  } catch {
    return null;
  }
}

export async function createPlace(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const payload = placePayloadFromForm(formData);

    if (!payload.name || !payload.story || !payload.hero_image) {
      return {
        ok: false,
        error: "Name, story, and hero image are required.",
      };
    }

    const { data, error } = await supabase
      .from("places")
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    revalidatePath("/discover");
    revalidatePath("/admin");
    revalidatePath("/admin/places");

    return { ok: true, id: data?.id as string | undefined, message: "Place created." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create place.",
    };
  }
}

export async function updatePlace(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const payload = placePayloadFromForm(formData);

    const { error } = await supabase.from("places").update(payload).eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    revalidatePath("/discover");
    revalidatePath(`/panoras/${payload.slug}`);
    revalidatePath("/admin/places");
    revalidatePath(`/admin/places/${id}`);

    return { ok: true, message: "Place updated." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update place.",
    };
  }
}

export async function setPlacePublished(
  id: string,
  published: boolean,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("places")
      .update({ published, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/discover");
    revalidatePath("/admin/places");
    return {
      ok: true,
      message: published ? "Place published." : "Place unpublished.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

export async function deletePlace(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("places").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/discover");
    revalidatePath("/admin/places");
    return { ok: true, message: "Place deleted." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Delete failed.",
    };
  }
}

export async function getAdminStories(): Promise<
  (ReturnType<typeof mapStoryRow> & { placeName?: string })[]
> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("experience_stories")
      .select("*, places(name)")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => {
      const story = mapStoryRow(row as StoryRow);
      const places = (row as { places?: { name?: string } | null }).places;
      return {
        ...story,
        placeName: places?.name,
      };
    });
  } catch {
    return [];
  }
}

export async function setStoryPublished(
  id: string,
  published: boolean,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("experience_stories")
      .update({ published })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/stories");
    return {
      ok: true,
      message: published ? "Story published." : "Story unpublished.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

export async function deleteStory(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("experience_stories")
      .delete()
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/stories");
    return { ok: true, message: "Story deleted." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Delete failed.",
    };
  }
}

export async function getAdminSections(): Promise<HomepageSection[]> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("homepage_sections")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id as string,
      key: row.key as HomepageSectionKey,
      title: row.title as string,
      subtitle: row.subtitle as string,
      sortOrder: row.sort_order as number,
      enabled: Boolean(row.enabled),
      placeIds: Array.isArray(row.place_ids)
        ? (row.place_ids as string[])
        : [],
    }));
  } catch {
    return [];
  }
}

export async function updateSection(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const id = asString(formData.get("id"));
    if (!id) return { ok: false, error: "Missing section id." };

    const placeIds = parseLines(asString(formData.get("placeIds")));

    const { error } = await supabase
      .from("homepage_sections")
      .update({
        title: asString(formData.get("title")),
        subtitle: asString(formData.get("subtitle")),
        sort_order: Number(asString(formData.get("sortOrder")) || "0"),
        enabled: asBool(formData.get("enabled")),
        place_ids: placeIds,
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/admin/sections");
    return { ok: true, message: "Section updated." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

/** Helper for forms that need JSON blob editing */
export async function updatePlaceJson(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const highlights = parseJson<PlaceHighlights>(
      asString(formData.get("highlightsJson"), "{}"),
      {},
    );
    const amenities = parseJson<PlaceAmenityFlags>(
      asString(formData.get("amenitiesJson"), "{}"),
      {},
    );
    const contact = parseJson<PlaceContact>(
      asString(formData.get("contactJson"), "{}"),
      {},
    );

    const { error } = await supabase
      .from("places")
      .update({
        highlights,
        amenities,
        contact,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/places/${id}`);
    return { ok: true, message: "JSON fields updated." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

const CSV_CATEGORIES = new Set<PlaceCategory>([
  "dining",
  "escape",
  "nightlife",
  "wellness",
  "culture",
  "outdoors",
  "coffee",
  "weekend",
]);

export type CsvPlaceImportRow = {
  name: string;
  slug: string;
  location: string;
  city: string;
  category: string;
  story: string;
  panora_notes: string;
  latitude: string;
  longitude: string;
  price_guide: string;
  hero_image: string;
};

/** Bulk-insert places from CSV as unpublished drafts (admin only). */
export async function importPlacesCsv(
  rows: CsvPlaceImportRow[],
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: false, error: "No rows to import." };
    }

    const now = new Date().toISOString();
    const payloads: Record<string, unknown>[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = (row.name ?? "").trim();
      const story = (row.story ?? "").trim();
      const heroImage = (row.hero_image ?? "").trim();

      if (!name || !story || !heroImage) {
        return {
          ok: false,
          error: `Row ${i + 1}: name, story, and hero_image are required.`,
        };
      }

      const categoryRaw = (row.category ?? "dining").trim().toLowerCase();
      if (!CSV_CATEGORIES.has(categoryRaw as PlaceCategory)) {
        return {
          ok: false,
          error: `Row ${i + 1}: invalid category "${row.category}".`,
        };
      }

      const slugInput = (row.slug ?? "").trim();
      const slug =
        slugInput ||
        slugify(name, { lower: true, strict: true, trim: true });

      const latRaw = (row.latitude ?? "").trim();
      const lngRaw = (row.longitude ?? "").trim();

      payloads.push({
        slug,
        name,
        location: (row.location ?? "").trim() || "Chinhoyi",
        city: (row.city ?? "").trim() || "Chinhoyi",
        country: "Zimbabwe",
        latitude: latRaw ? Number(latRaw) : null,
        longitude: lngRaw ? Number(lngRaw) : null,
        category: categoryRaw as PlaceCategory,
        mood: [] as MoodTag[],
        story,
        panora_notes: (row.panora_notes ?? "").trim(),
        highlights: {},
        amenities: {},
        contact: {},
        price_guide: (row.price_guide ?? "").trim() || "Enquire",
        distance_km: null,
        verified: false,
        published: false,
        hero_image: heroImage,
        gallery: [] as string[],
        meta_title: null,
        meta_description: null,
        homepage_sections: [] as HomepageSectionKey[],
        verifications: [] as string[],
        created_at: now,
        updated_at: now,
      });
    }

    const { error } = await supabase.from("places").insert(payloads);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/places");
    revalidatePath("/discover");
    revalidatePath("/");

    return {
      ok: true,
      message: `Imported ${payloads.length} place${payloads.length === 1 ? "" : "s"} as unpublished drafts.`,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not import CSV places.",
    };
  }
}
