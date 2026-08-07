"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type UploadPlaceMediaResult =
  | { ok: true; url: string; path: string; bucket: string }
  | { ok: false; error: string };

const MAX_BYTES = 24 * 1024 * 1024;
const ALLOWED_PREFIXES = ["image/", "video/"] as const;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && profile.role !== "admin") {
    throw new Error("Forbidden");
  }

  return { supabase, user };
}

/**
 * Upload a hero / gallery / menu / video file for a place.
 * Tries `place-images` first, then falls back to `media`.
 */
export async function uploadPlaceMedia(
  formData: FormData,
): Promise<UploadPlaceMediaResult> {
  try {
    const { supabase } = await requireAdmin();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose a file to upload." };
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, error: "File must be under 24MB." };
    }
    const type = file.type || "application/octet-stream";
    if (!ALLOWED_PREFIXES.some((p) => type.startsWith(p))) {
      return { ok: false, error: "Only image or video files are allowed." };
    }

    const kind = String(formData.get("kind") ?? "gallery").replace(
      /[^\w-]+/g,
      "",
    );
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `places/${kind}/${Date.now()}-${safeName}`;

    const service = createServiceClient();
    const client = service ?? supabase;

    const bytes = Buffer.from(await file.arrayBuffer());
    const buckets = ["place-images", "media"] as const;
    let lastError = "Upload failed.";

    for (const bucket of buckets) {
      const { error } = await client.storage.from(bucket).upload(path, bytes, {
        contentType: type,
        upsert: false,
      });
      if (!error) {
        const publicUrl = client.storage.from(bucket).getPublicUrl(path).data
          .publicUrl;
        return { ok: true, url: publicUrl, path, bucket };
      }
      lastError = error.message;
    }

    return { ok: false, error: lastError };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed.",
    };
  }
}
