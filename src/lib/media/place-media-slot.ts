import { createServiceClient } from "@/lib/supabase/service";

const BUCKETS = ["place-images", "media"] as const;
const KINDS = new Set(["hero", "gallery", "menu", "video"]);
const MAX_BYTES = 40 * 1024 * 1024;

export type PlaceMediaSlot =
  | {
      ok: true;
      bucket: string;
      path: string;
      token: string;
      publicUrl: string;
    }
  | { ok: false; error: string };

/**
 * A short-lived Supabase upload token. The browser sends the file straight
 * to storage, so a phone photo never has to fit inside a server action.
 */
export async function createPlaceMediaSlot(input: {
  filename: string;
  contentType: string;
  kind: string;
  size: number;
  folder: "places" | "submissions";
}): Promise<PlaceMediaSlot> {
  const kind = input.kind.replace(/[^\w-]+/g, "");
  if (!KINDS.has(kind)) return { ok: false, error: "Unknown media type." };

  const type = input.contentType || "application/octet-stream";
  const isVideo = kind === "video";
  if (isVideo && !type.startsWith("video/")) {
    return { ok: false, error: "Video uploads need a video file." };
  }
  if (!isVideo && !type.startsWith("image/")) {
    return { ok: false, error: "That file is not an image." };
  }
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { ok: false, error: "Choose a file to upload." };
  }
  if (input.size > MAX_BYTES) {
    return { ok: false, error: "File must be under 40MB." };
  }

  const service = createServiceClient();
  if (!service) {
    return { ok: false, error: "Storage is not configured on the server." };
  }

  const safeName =
    input.filename.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "upload";
  const path = `${input.folder}/${kind}/${Date.now()}-${safeName}`;
  let lastError = "Could not prepare upload.";

  for (const bucket of BUCKETS) {
    const { data, error } = await service.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    if (error || !data?.token) {
      lastError = error?.message ?? lastError;
      continue;
    }
    const publicUrl = service.storage
      .from(bucket)
      .getPublicUrl(data.path || path).data.publicUrl;
    return {
      ok: true,
      bucket,
      path: data.path || path,
      token: data.token,
      publicUrl,
    };
  }

  return { ok: false, error: lastError };
}
