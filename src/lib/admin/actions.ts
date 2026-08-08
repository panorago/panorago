"use server";

import { ensureBootstrapAdmin } from "@/lib/admin/bootstrap";
import { BOOTSTRAP_ADMIN_EMAIL, validateAdminPassword } from "@/lib/admin/password";
import {
  mapPlaceRow,
  mapStoryRow,
  type PlaceRow,
  type StoryRow,
} from "@/lib/data/places";
import { mapSupabaseAuthError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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
import { revalidatePublicPlaces } from "@/lib/data/revalidate-places";
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

  const service = createServiceClient();
  return { supabase: service ?? supabase, user, profile };
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

/** Label|Price per line or semicolon. Also accepts "Label: Price". */
function parsePricingItems(raw: string): { label: string; price: string }[] {
  return raw
    .split(/[\n;]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const pipe = line.indexOf("|");
      if (pipe > 0) {
        return {
          label: line.slice(0, pipe).trim(),
          price: line.slice(pipe + 1).trim(),
        };
      }
      const colon = line.indexOf(":");
      if (colon > 0) {
        return {
          label: line.slice(0, colon).trim(),
          price: line.slice(colon + 1).trim(),
        };
      }
      return { label: line, price: "" };
    })
    .filter((item) => item.label && item.price);
}

function placePayloadFromForm(formData: FormData) {
  const name = asString(formData.get("name"));
  const slugInput = asString(formData.get("slug"));
  const slug =
    slugInput ||
    slugify(name, { lower: true, strict: true, trim: true });

  const mood = parseLines(asString(formData.get("mood"))) as MoodTag[];
  const gallery = parseLines(asString(formData.get("gallery")));
  const menuImageUrls = parseLines(asString(formData.get("menuImageUrls")));
  const pricingItems = parsePricingItems(
    asString(formData.get("pricingItems")),
  );
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
    pricingItems: pricingItems.length > 0 ? pricingItems : undefined,
  };

  const otherAmenities = parseLines(asString(formData.get("otherAmenities")));
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
    ...(otherAmenities.length > 0 ? { other: otherAmenities } : {}),
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
    menu_image_urls: menuImageUrls,
    pricing_items: pricingItems,
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

  const isBootstrapEmail =
    email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
  let bootstrapError: string | null = null;

  try {
    // First-time bootstrap: create launch admin if missing (service role + rate limit).
    if (isBootstrapEmail) {
      const boot = await ensureBootstrapAdmin(email);
      if (!boot.ok) {
        bootstrapError = boot.error;
        console.info("[admin] bootstrap:", boot.error);
      }
    }

    const supabase = await createClient();
    const { data: signedIn, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      const authMessage = mapSupabaseAuthError(error.message);
      const looksMissingUser = /invalid login credentials|invalid_credentials/i.test(
        error.message,
      );
      const looksPath = /invalid path|requested path is invalid|path specified/i.test(
        error.message,
      );

      // Prefer actionable bootstrap / env errors over a bare auth failure.
      if (isBootstrapEmail && bootstrapError) {
        if (
          /SERVICE_ROLE|SECRET_KEY|service key|bootstrap/i.test(bootstrapError)
        ) {
          return { ok: false, error: bootstrapError };
        }
        if (looksPath || looksMissingUser) {
          return {
            ok: false,
            error: `${bootstrapError}${looksMissingUser ? " Sign-in also failed — the launch admin may not exist yet." : ""}`,
          };
        }
      }

      if (isBootstrapEmail && looksMissingUser && !bootstrapError) {
        return {
          ok: false,
          error:
            "Invalid login credentials. For first-time setup, confirm SUPABASE_SERVICE_ROLE_KEY is set and try again with the launch password, or create the user in the Supabase Auth dashboard (see docs/COMMAND_CENTER.md).",
        };
      }

      return { ok: false, error: authMessage };
    }

    const userId = signedIn.user?.id;
    if (userId) {
      const { data: creds } = await supabase
        .from("admin_credentials")
        .select("must_reset")
        .eq("user_id", userId)
        .maybeSingle();
      if (creds?.must_reset) {
        redirect("/admin/change-password");
      }
    }
  } catch (error) {
    // Next.js redirect() throws; rethrow so navigation works.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "Login failed.";
    return { ok: false, error: mapSupabaseAuthError(message) };
  }

  redirect("/admin");
}

export async function changeOwnPassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = asString(formData.get("password"));
  const confirm = asString(formData.get("confirm"));

  const policyError = validateAdminPassword(password);
  if (policyError) return { ok: false, error: policyError };
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, email")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || profile.role !== "admin") {
      return { ok: false, error: "Forbidden" };
    }

    const { error: authError } = await supabase.auth.updateUser({
      password,
    });
    if (authError) return { ok: false, error: authError.message };

    const now = new Date().toISOString();
    const { error: metaError } = await supabase.from("admin_credentials").upsert(
      {
        user_id: user.id,
        email: (profile.email as string) || user.email || "",
        is_active: true,
        must_reset: false,
        password_updated_at: now,
        password_set_by: user.id,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );
    if (metaError) {
      return {
        ok: false,
        error: `Password updated, but credentials metadata failed: ${metaError.message}`,
      };
    }

    revalidatePath("/admin");
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Password change failed.",
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

    revalidatePublicPlaces(payload.slug);
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

    revalidatePublicPlaces(payload.slug);
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
    revalidatePublicPlaces();
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
    revalidatePublicPlaces();
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
  country?: string;
  category: string;
  story: string;
  panora_notes: string;
  latitude: string;
  longitude: string;
  price_guide: string;
  average_spend?: string;
  hero_image: string;
  gallery?: string;
  menu_image_urls?: string;
  video_url?: string;
  pricing_items?: string;
  mood?: string;
  golden_hour?: string;
  best_time?: string;
  dress_vibe?: string;
  noise_level?: string;
  opening_hours?: string;
  perfect_for?: string;
  payment_methods?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  google_maps_url?: string;
  homepage_sections?: string;
  meta_title?: string;
  meta_description?: string;
  distance_km?: string;
};

function splitPipeUrls(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitCsvList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[|;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

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
      const distanceRaw = (row.distance_km ?? "").trim();
      const pricingItems = parsePricingItems(row.pricing_items ?? "");
      const averageSpend = (row.average_spend ?? "").trim();

      const highlights: PlaceHighlights = {
        goldenHour: (row.golden_hour ?? "").trim() || undefined,
        bestTime: (row.best_time ?? "").trim() || undefined,
        dressVibe: (row.dress_vibe ?? "").trim() || undefined,
        noiseLevel: (row.noise_level ?? "").trim() || undefined,
        openingHours: (row.opening_hours ?? "").trim() || undefined,
        averageSpend: averageSpend || undefined,
        perfectFor: splitCsvList(row.perfect_for),
        paymentMethods: splitCsvList(row.payment_methods),
        pricingItems: pricingItems.length > 0 ? pricingItems : undefined,
      };

      const contact: PlaceContact = {
        whatsapp: (row.whatsapp ?? "").trim() || null,
        phone: (row.phone ?? "").trim() || null,
        email: (row.email ?? "").trim() || null,
        website: (row.website ?? "").trim() || null,
        instagram: (row.instagram ?? "").trim() || null,
        facebook: (row.facebook ?? "").trim() || null,
        tiktok: (row.tiktok ?? "").trim() || null,
        googleMapsUrl: (row.google_maps_url ?? "").trim() || null,
      };

      payloads.push({
        slug,
        name,
        location: (row.location ?? "").trim() || "Chinhoyi",
        city: (row.city ?? "").trim() || "Chinhoyi",
        country: (row.country ?? "").trim() || "Zimbabwe",
        latitude: latRaw ? Number(latRaw) : null,
        longitude: lngRaw ? Number(lngRaw) : null,
        category: categoryRaw as PlaceCategory,
        mood: splitCsvList(row.mood) as MoodTag[],
        story,
        panora_notes: (row.panora_notes ?? "").trim(),
        highlights,
        amenities: {},
        contact,
        price_guide: (row.price_guide ?? "").trim() || "Enquire",
        distance_km: distanceRaw ? Number(distanceRaw) : null,
        verified: false,
        published: false,
        hero_image: heroImage,
        gallery: splitPipeUrls(row.gallery),
        menu_image_urls: splitPipeUrls(row.menu_image_urls),
        pricing_items: pricingItems,
        video_url: (row.video_url ?? "").trim() || null,
        meta_title: (row.meta_title ?? "").trim() || null,
        meta_description: (row.meta_description ?? "").trim() || null,
        homepage_sections: splitCsvList(
          row.homepage_sections,
        ) as HomepageSectionKey[],
        verifications: [] as string[],
        created_at: now,
        updated_at: now,
      });
    }

    const { error } = await supabase.from("places").insert(payloads);
    if (error) return { ok: false, error: error.message };

    revalidatePublicPlaces();
    revalidatePath("/admin/places");

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
