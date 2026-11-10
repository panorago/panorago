"use client";

import { uploadPlaceMedia, preparePlaceMediaUpload } from "@/lib/admin/upload-place-media";
import { compressImageFile } from "@/lib/media/compress-image";
import { createClient } from "@/lib/supabase/client";

export type PlaceFileUploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const SERVER_ACTION_LIMIT = 3_500_000;

function friendlyUploadError(message: string) {
  if (/body exceeded|1 mb|413|too large/i.test(message)) {
    return "That file is too large to send with the form. Try a smaller photo, or paste a video link.";
  }
  return message || "Upload failed.";
}

async function putWithToken(
  bucket: string,
  path: string,
  token: string,
  file: File,
) {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type || undefined,
    });
  return error?.message ?? null;
}

async function uploadWithSlot(
  file: File,
  slot: {
    ok: true;
    bucket: string;
    path: string;
    token: string;
    publicUrl: string;
  },
): Promise<PlaceFileUploadResult> {
  const failure = await putWithToken(slot.bucket, slot.path, slot.token, file);
  if (failure) return { ok: false, error: failure };
  return { ok: true, url: slot.publicUrl };
}

/** Admin add/edit place. Prefers a direct storage upload, then a compressed fallback. */
export async function uploadAdminPlaceFile(
  file: File,
  kind: string,
): Promise<PlaceFileUploadResult> {
  const prepared = file.type.startsWith("image/")
    ? await compressImageFile(file)
    : file;

  let slotError = "Could not start upload.";
  try {
    const slot = await preparePlaceMediaUpload({
      filename: prepared.name,
      contentType: prepared.type || "application/octet-stream",
      kind,
      size: prepared.size,
    });
    if (slot.ok) return await uploadWithSlot(prepared, slot);
    slotError = slot.error;
  } catch (error) {
    slotError = error instanceof Error ? error.message : slotError;
  }

  if (prepared.size > SERVER_ACTION_LIMIT) {
    return { ok: false, error: friendlyUploadError(slotError) };
  }

  const data = new FormData();
  data.set("file", prepared);
  data.set("kind", kind);
  try {
    return await uploadPlaceMedia(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return { ok: false, error: friendlyUploadError(message) };
  }
}

/** Public Add Your Place. The file goes to storage; the form only keeps the URL. */
export async function uploadPublicPlaceFile(
  file: File,
  kind: string,
): Promise<PlaceFileUploadResult> {
  const prepared = file.type.startsWith("image/")
    ? await compressImageFile(file)
    : file;

  if (prepared.size > 40 * 1024 * 1024) {
    return { ok: false, error: "File must be under 40MB." };
  }

  try {
    const res = await fetch("/api/place-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: prepared.name,
        contentType: prepared.type || "application/octet-stream",
        kind,
        size: prepared.size,
      }),
    });
    const slot = (await res.json()) as {
      ok?: boolean;
      error?: string;
      bucket?: string;
      path?: string;
      token?: string;
      publicUrl?: string;
    };
    if (
      !res.ok ||
      !slot.bucket ||
      !slot.path ||
      !slot.token ||
      !slot.publicUrl
    ) {
      return {
        ok: false,
        error: slot.error ?? "Could not start upload.",
      };
    }
    return await uploadWithSlot(prepared, {
      ok: true,
      bucket: slot.bucket,
      path: slot.path,
      token: slot.token,
      publicUrl: slot.publicUrl,
    });
  } catch {
    return { ok: false, error: "Network error. Please retry the upload." };
  }
}
