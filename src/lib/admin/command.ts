"use server";

import type { BookingStatus } from "@/lib/bookings/codes";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  AdminProfile,
  AuditLogEntry,
  Booking,
  BookingHistoryEntry,
  MediaAsset,
  PaidTier,
  PlaceSubmission,
  ProfileRole,
  SecretCollection,
  SiteSettings,
} from "@/types";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

export type ActionResult =
  | { ok: true; message?: string; id?: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error("Forbidden");
  if (!profile || profile.role !== "admin") {
    throw new Error("Forbidden");
  }

  return { supabase, user, profile };
}

async function writeAudit(
  action: string,
  entityType: string,
  entityId?: string | null,
  meta: Record<string, unknown> = {},
) {
  try {
    const { supabase, user } = await requireAdmin();
    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      meta,
    });
  } catch {
    // audit is best-effort
  }
}

function mapBooking(row: Record<string, unknown>): Booking {
  const historyRaw = row.history;
  const history: BookingHistoryEntry[] = Array.isArray(historyRaw)
    ? (historyRaw as BookingHistoryEntry[])
    : [];

  return {
    id: String(row.id),
    bookingReference: String(row.booking_reference),
    customerNumber: String(row.customer_number),
    customerName: String(row.customer_name),
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    venueId: (row.venue_id as string | null) ?? null,
    venueName: String(row.venue_name),
    venueAddress: (row.venue_address as string | null) ?? null,
    preferredDate: (row.preferred_date as string | null) ?? null,
    adults: Number(row.adults ?? 1),
    children: Number(row.children ?? 0),
    occasion: (row.occasion as string | null) ?? null,
    budget: (row.budget as string | null) ?? null,
    specialRequest: (row.special_request as string | null) ?? null,
    status: row.status as BookingStatus,
    qrCodeUrl: (row.qr_code_url as string | null) ?? null,
    ticketPdfUrl: (row.ticket_pdf_url as string | null) ?? null,
    history,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getAdminBookings(opts?: {
  status?: string;
  q?: string;
  limit?: number;
}): Promise<Booking[]> {
  try {
    const { supabase } = await requireAdmin();
    let query = supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 200);

    if (opts?.status && opts.status !== "all") {
      query = query.eq("status", opts.status);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    let rows = (data as Record<string, unknown>[]).map(mapBooking);
    const q = opts?.q?.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (b) =>
          b.customerName.toLowerCase().includes(q) ||
          b.customerNumber.toLowerCase().includes(q) ||
          b.bookingReference.toLowerCase().includes(q) ||
          b.venueName.toLowerCase().includes(q) ||
          (b.email ?? "").toLowerCase().includes(q) ||
          (b.phone ?? "").includes(q),
      );
    }
    return rows;
  } catch {
    return [];
  }
}

export async function getAdminBooking(id: string): Promise<Booking | null> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapBooking(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  note?: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    const existing = await getAdminBooking(id);
    if (!existing) return { ok: false, error: "Booking not found." };

    const at = new Date().toISOString();
    const history: BookingHistoryEntry[] = [
      ...existing.history,
      {
        at,
        event: `status_${status}`,
        status,
        note: note || undefined,
        actorId: user.id,
      },
    ];

    let qrCodeUrl = existing.qrCodeUrl;
    let ticketPdfUrl = existing.ticketPdfUrl;

    if (status === "confirmed") {
      const { regenerateConfirmedTicketAssets } = await import(
        "@/lib/bookings/regenerate-assets"
      );
      const { notifyBookingConfirmed } = await import(
        "@/lib/bookings/notifications"
      );
      const assets = await regenerateConfirmedTicketAssets({
        bookingReference: existing.bookingReference,
        customerNumber: existing.customerNumber,
        customerName: existing.customerName,
        venueName: existing.venueName,
        venueAddress: existing.venueAddress,
        venueId: existing.venueId,
        preferredDate: existing.preferredDate,
        adults: existing.adults,
        children: existing.children,
        occasion: existing.occasion,
        specialRequest: existing.specialRequest,
        createdAt: existing.createdAt,
      });
      if (assets.qrCodeUrl) qrCodeUrl = assets.qrCodeUrl;
      if (assets.ticketPdfUrl) ticketPdfUrl = assets.ticketPdfUrl;
      await notifyBookingConfirmed({
        bookingReference: existing.bookingReference,
        customerNumber: existing.customerNumber,
        customerName: existing.customerName,
        email: existing.email,
        phone: existing.phone,
        venueName: existing.venueName,
        preferredDate: existing.preferredDate,
        adults: existing.adults,
        children: existing.children,
        occasion: existing.occasion,
        status: "confirmed",
      });
    }

    const { error } = await supabase
      .from("bookings")
      .update({
        status,
        history,
        qr_code_url: qrCodeUrl,
        ticket_pdf_url: ticketPdfUrl,
        updated_at: at,
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await writeAudit("booking_status", "booking", id, { status, note });
    revalidatePath("/admin/enquiries");
    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/enquiries/${id}`);
    return { ok: true, message: `Booking marked ${status}.` };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

export async function getDashboardStats() {
  const empty = {
    placesTotal: 0,
    placesPublished: 0,
    placesVerified: 0,
    placesFeatured: 0,
    storiesTotal: 0,
    storiesPending: 0,
    bookingsToday: 0,
    bookingsByStatus: {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      unavailable: 0,
    } as Record<BookingStatus, number>,
    newestPlace: null as { id: string; name: string; slug: string } | null,
    recentActivity: [] as {
      id: string;
      label: string;
      at: string;
      href?: string;
    }[],
  };

  try {
    const { supabase } = await requireAdmin();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [placesRes, storiesRes, bookingsRes, auditRes] = await Promise.all([
      supabase
        .from("places")
        .select("id, name, slug, published, verified, featured, archived, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase.from("experience_stories").select("id, published, created_at"),
      supabase
        .from("bookings")
        .select("id, status, customer_name, venue_name, created_at, booking_reference")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("audit_log")
        .select("id, action, entity_type, entity_id, created_at, meta")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const places = placesRes.data ?? [];
    const stories = storiesRes.data ?? [];
    const bookings = bookingsRes.data ?? [];
    const audits = auditRes.data ?? [];

    const activePlaces = places.filter((p) => !p.archived);
    const bookingsByStatus = { ...empty.bookingsByStatus };
    for (const b of bookings) {
      const s = b.status as BookingStatus;
      if (s in bookingsByStatus) bookingsByStatus[s] += 1;
    }

    const newest = activePlaces[0];
    const recentActivity = [
      ...bookings.slice(0, 8).map((b) => ({
        id: `b-${b.id}`,
        label: `Enquiry ${b.booking_reference} · ${b.customer_name} · ${b.venue_name}`,
        at: b.created_at as string,
        href: `/admin/enquiries/${b.id}`,
      })),
      ...audits.slice(0, 8).map((a) => ({
        id: `a-${a.id}`,
        label: `${a.action} · ${a.entity_type}${a.entity_id ? ` · ${a.entity_id}` : ""}`,
        at: a.created_at as string,
        href: undefined as string | undefined,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12);

    return {
      placesTotal: activePlaces.length,
      placesPublished: activePlaces.filter((p) => p.published).length,
      placesVerified: activePlaces.filter((p) => p.verified).length,
      placesFeatured: activePlaces.filter((p) => p.featured).length,
      storiesTotal: stories.length,
      storiesPending: stories.filter((s) => !s.published).length,
      bookingsToday: bookings.filter(
        (b) => new Date(b.created_at as string) >= todayStart,
      ).length,
      bookingsByStatus,
      newestPlace: newest
        ? { id: newest.id as string, name: newest.name as string, slug: newest.slug as string }
        : null,
      recentActivity,
    };
  } catch {
    return empty;
  }
}

export async function globalAdminSearch(q: string) {
  const query = q.trim();
  if (!query) {
    return { places: [], bookings: [], stories: [] };
  }

  try {
    const { supabase } = await requireAdmin();
    const like = `%${query}%`;

    const [places, bookings, stories] = await Promise.all([
      supabase
        .from("places")
        .select("id, name, slug, city, published")
        .or(`name.ilike.${like},city.ilike.${like},slug.ilike.${like}`)
        .limit(8),
      supabase
        .from("bookings")
        .select("id, booking_reference, customer_number, customer_name, venue_name, status")
        .or(
          `customer_name.ilike.${like},customer_number.ilike.${like},booking_reference.ilike.${like},venue_name.ilike.${like}`,
        )
        .limit(8),
      supabase
        .from("experience_stories")
        .select("id, author_name, body, published")
        .or(`author_name.ilike.${like},body.ilike.${like}`)
        .limit(8),
    ]);

    return {
      places: places.data ?? [],
      bookings: bookings.data ?? [],
      stories: stories.data ?? [],
    };
  } catch {
    return { places: [], bookings: [], stories: [] };
  }
}

export async function setPlaceFlags(
  id: string,
  flags: Partial<{
    published: boolean;
    featured: boolean;
    archived: boolean;
    verified: boolean;
    paidTier: PaidTier;
  }>,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (flags.published != null) payload.published = flags.published;
    if (flags.featured != null) payload.featured = flags.featured;
    if (flags.archived != null) payload.archived = flags.archived;
    if (flags.verified != null) payload.verified = flags.verified;
    if (flags.paidTier != null) {
      payload.paid_tier = flags.paidTier;
      if (flags.paidTier === "gold" || flags.paidTier === "platinum") {
        payload.featured = true;
      }
    }

    const { error } = await supabase.from("places").update(payload).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await writeAudit("place_flags", "place", id, flags);
    revalidatePath("/admin/places");
    revalidatePath("/");
    revalidatePath("/discover");
    return { ok: true, message: "Place updated." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

export async function duplicatePlace(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return { ok: false, error: "Place not found." };

    const row = data as Record<string, unknown>;
    const { id: _omit, ...rest } = row;
    void _omit;
    const now = new Date().toISOString();
    const baseSlug = String(row.slug);
    const { data: inserted, error: insertError } = await supabase
      .from("places")
      .insert({
        ...rest,
        slug: `${baseSlug}-copy-${Date.now().toString(36)}`,
        name: `${row.name} (Copy)`,
        published: false,
        featured: false,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .maybeSingle();

    if (insertError) return { ok: false, error: insertError.message };
    revalidatePath("/admin/places");
    return {
      ok: true,
      id: inserted?.id as string | undefined,
      message: "Place duplicated as draft.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Duplicate failed.",
    };
  }
}

export async function setStoryFlags(
  id: string,
  flags: Partial<{ published: boolean; pinned: boolean; reported: boolean }>,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("experience_stories")
      .update(flags)
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/stories");
    return { ok: true, message: "Story updated." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

export async function getAdminCollections(): Promise<SecretCollection[]> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("secret_collections")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      key: row.key as string,
      title: row.title as string,
      subtitle: (row.subtitle as string) ?? "",
      sortOrder: Number(row.sort_order ?? 0),
      enabled: Boolean(row.enabled),
      placeIds: Array.isArray(row.place_ids) ? (row.place_ids as string[]) : [],
    }));
  } catch {
    return [];
  }
}

export async function upsertCollection(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const id = String(formData.get("id") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const keyInput = String(formData.get("key") ?? "").trim();
    const key =
      keyInput ||
      slugify(title, { lower: true, strict: true, trim: true });
    const placeIds = String(formData.get("placeIds") ?? "")
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      key,
      title,
      subtitle: String(formData.get("subtitle") ?? "").trim(),
      sort_order: Number(String(formData.get("sortOrder") ?? "0") || 0),
      enabled:
        formData.get("enabled") === "on" ||
        formData.get("enabled") === "true" ||
        formData.get("enabled") === "1",
      place_ids: placeIds,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { error } = await supabase
        .from("secret_collections")
        .update(payload)
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("secret_collections").insert(payload);
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath("/admin/collections");
    return { ok: true, message: "Collection saved." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed.",
    };
  }
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("secret_collections")
      .delete()
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/collections");
    return { ok: true, message: "Collection deleted." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Delete failed.",
    };
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const defaults: SiteSettings = {
    whatsapp: process.env.NEXT_PUBLIC_PANORA_WHATSAPP ?? "",
    email: process.env.NEXT_PUBLIC_PANORA_EMAIL ?? "",
    phone: process.env.NEXT_PUBLIC_PANORA_PHONE ?? "",
    phoneDisplay: process.env.NEXT_PUBLIC_PANORA_PHONE_DISPLAY ?? "",
    heroVideoUrl: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    mapsApiKeyNote:
      "Browser Maps key lives in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY only — never put service keys in the client.",
  };

  try {
    const { supabase } = await requireAdmin();
    const { data } = await supabase
      .from("site_settings")
      .select("settings")
      .eq("id", "default")
      .maybeSingle();
    if (!data?.settings || typeof data.settings !== "object") return defaults;
    return { ...defaults, ...(data.settings as Partial<SiteSettings>) };
  } catch {
    return defaults;
  }
}

export async function saveSiteSettings(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    const settings: SiteSettings = {
      whatsapp: String(formData.get("whatsapp") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      phoneDisplay: String(formData.get("phoneDisplay") ?? "").trim(),
      heroVideoUrl: String(formData.get("heroVideoUrl") ?? "").trim(),
      instagram: String(formData.get("instagram") ?? "").trim(),
      facebook: String(formData.get("facebook") ?? "").trim(),
      tiktok: String(formData.get("tiktok") ?? "").trim(),
      mapsApiKeyNote: String(formData.get("mapsApiKeyNote") ?? "").trim(),
    };

    const { error } = await supabase.from("site_settings").upsert({
      id: "default",
      settings,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    });

    if (error) return { ok: false, error: error.message };
    await writeAudit("settings_update", "site_settings", "default");
    revalidatePath("/admin/settings");
    return { ok: true, message: "Settings saved." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed.",
    };
  }
}

export async function getAdminProfiles(): Promise<AdminProfile[]> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, display_name, email, suspended_at")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      email: (row.email as string) || "",
      role: row.role as ProfileRole,
      displayName: (row.display_name as string | null) ?? null,
      suspendedAt: (row.suspended_at as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}

export async function setProfileRole(
  id: string,
  role: ProfileRole,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const payload: Record<string, unknown> = {
      role,
      updated_at: new Date().toISOString(),
    };
    if (role === "suspended") {
      payload.suspended_at = new Date().toISOString();
    } else {
      payload.suspended_at = null;
    }
    const { error } = await supabase.from("profiles").update(payload).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await writeAudit("profile_role", "profile", id, { role });
    revalidatePath("/admin/users");
    return { ok: true, message: "Role updated." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

export async function getPlaceSubmissions(): Promise<PlaceSubmission[]> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("place_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      status: row.status as PlaceSubmission["status"],
      submitterName: row.submitter_name as string,
      submitterEmail: (row.submitter_email as string | null) ?? null,
      submitterPhone: (row.submitter_phone as string | null) ?? null,
      placeName: row.place_name as string,
      location: (row.location as string) ?? "",
      city: (row.city as string) ?? "",
      country: (row.country as string) ?? "Zimbabwe",
      category: (row.category as string) ?? "dining",
      story: (row.story as string) ?? "",
      website: (row.website as string | null) ?? null,
      whatsapp: (row.whatsapp as string | null) ?? null,
      latitude: (row.latitude as number | null) ?? null,
      longitude: (row.longitude as number | null) ?? null,
      heroImage: (row.hero_image as string | null) ?? null,
      notes: (row.notes as string | null) ?? null,
      createdPlaceId: (row.created_place_id as string | null) ?? null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));
  } catch {
    return [];
  }
}

export async function approvePlaceSubmission(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    const { data: sub, error } = await supabase
      .from("place_submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !sub) return { ok: false, error: "Submission not found." };

    const name = String(sub.place_name);
    const slug = slugify(name, { lower: true, strict: true, trim: true });
    const now = new Date().toISOString();

    const { data: place, error: placeError } = await supabase
      .from("places")
      .insert({
        slug: `${slug}-${Date.now().toString(36)}`,
        name,
        location: sub.location || sub.city || "Zimbabwe",
        city: sub.city || "Harare",
        country: sub.country || "Zimbabwe",
        latitude: sub.latitude,
        longitude: sub.longitude,
        category: sub.category || "dining",
        mood: [],
        story: sub.story || `${name} — submitted via Add Your Place.`,
        panora_notes: sub.notes || "Draft from public submission — review before publish.",
        highlights: {},
        amenities: {},
        contact: {
          website: sub.website,
          whatsapp: sub.whatsapp,
          email: sub.submitter_email,
          phone: sub.submitter_phone,
        },
        price_guide: "Enquire",
        verified: false,
        published: false,
        featured: false,
        archived: false,
        paid_tier: "basic",
        hero_image:
          sub.hero_image ||
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
        gallery: [],
        homepage_sections: [],
        verifications: [],
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .maybeSingle();

    if (placeError) return { ok: false, error: placeError.message };

    await supabase
      .from("place_submissions")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: now,
        created_place_id: place?.id,
        updated_at: now,
      })
      .eq("id", id);

    await writeAudit("submission_approve", "place_submission", id, {
      placeId: place?.id,
    });
    revalidatePath("/admin/submissions");
    revalidatePath("/admin/places");
    return {
      ok: true,
      id: place?.id as string | undefined,
      message: "Approved — place draft created.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Approve failed.",
    };
  }
}

export async function rejectPlaceSubmission(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    const { error } = await supabase
      .from("place_submissions")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/submissions");
    return { ok: true, message: "Submission rejected." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Reject failed.",
    };
  }
}

export async function getMediaAssets(): Promise<MediaAsset[]> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      bucket: row.bucket as string,
      path: row.path as string,
      publicUrl: (row.public_url as string | null) ?? null,
      filename: row.filename as string,
      contentType: (row.content_type as string | null) ?? null,
      sizeBytes: (row.size_bytes as number | null) ?? null,
      alt: (row.alt as string) ?? "",
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      createdAt: row.created_at as string,
    }));
  } catch {
    return [];
  }
}

export async function getAnalyticsSummary() {
  try {
    const { supabase } = await requireAdmin();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data, error } = await supabase
      .from("analytics_events")
      .select("event_name, created_at, path")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    if (error || !data) {
      return { available: false, total: 0, byName: {} as Record<string, number> };
    }

    const byName: Record<string, number> = {};
    for (const row of data) {
      const name = String(row.event_name);
      byName[name] = (byName[name] ?? 0) + 1;
    }
    return { available: true, total: data.length, byName };
  } catch {
    return { available: false, total: 0, byName: {} as Record<string, number> };
  }
}

export async function getRecentAuditLog(): Promise<AuditLogEntry[]> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      actorId: (row.actor_id as string | null) ?? null,
      action: row.action as string,
      entityType: row.entity_type as string,
      entityId: (row.entity_id as string | null) ?? null,
      meta: (row.meta as Record<string, unknown>) ?? {},
      createdAt: row.created_at as string,
    }));
  } catch {
    return [];
  }
}

export async function uploadMediaAsset(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose a file to upload." };
    }
    if (file.size > 12 * 1024 * 1024) {
      return { ok: false, error: "File must be under 12MB." };
    }

    const alt = String(formData.get("alt") ?? "").trim();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `library/${Date.now()}-${safeName}`;
    const service = createServiceClient();
    const client = service ?? supabase;

    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: upError } = await client.storage
      .from("media")
      .upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (upError) return { ok: false, error: upError.message };

    const publicUrl = client.storage.from("media").getPublicUrl(path).data
      .publicUrl;

    const { data, error } = await supabase
      .from("media_assets")
      .insert({
        bucket: "media",
        path,
        public_url: publicUrl,
        filename: file.name,
        content_type: file.type || null,
        size_bytes: file.size,
        alt,
        tags: [],
        uploaded_by: user.id,
      })
      .select("id")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };

    await writeAudit("media_upload", "media", data?.id as string | undefined, {
      path,
    });
    revalidatePath("/admin/media");
    return { ok: true, message: "Uploaded.", id: data?.id as string };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed.",
    };
  }
}

export async function deleteMediaAsset(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { data: row } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!row) return { ok: false, error: "Not found." };

    const service = createServiceClient();
    if (service) {
      await service.storage
        .from(String(row.bucket))
        .remove([String(row.path)]);
    }

    const { error } = await supabase.from("media_assets").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    await writeAudit("media_delete", "media", id, {});
    revalidatePath("/admin/media");
    return { ok: true, message: "Deleted." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Delete failed.",
    };
  }
}

export async function reorderHomepageSections(
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    for (let i = 0; i < orderedIds.length; i += 1) {
      const id = orderedIds[i]!;
      const { error } = await supabase
        .from("homepage_sections")
        .update({ sort_order: i })
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
    }
    await writeAudit("homepage_reorder", "homepage_sections", null, {
      orderedIds,
    });
    revalidatePath("/admin/homepage");
    revalidatePath("/");
    return { ok: true, message: "Order saved." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Reorder failed.",
    };
  }
}
