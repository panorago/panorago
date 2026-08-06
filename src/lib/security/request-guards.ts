import { createServiceClient } from "@/lib/supabase/service";
import { createHash } from "crypto";

const memoryTokens = new Map<string, number>();
const memoryHits = new Map<string, { count: number; resetAt: number }>();

function pruneMemory(now: number) {
  for (const [key, ts] of memoryTokens) {
    if (now - ts > 120_000) memoryTokens.delete(key);
  }
  for (const [key, hit] of memoryHits) {
    if (now > hit.resetAt) memoryHits.delete(key);
  }
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 48);
}

/**
 * Durable-ish anti-dupe: try Supabase `submission_tokens`, fall back to memory.
 * Returns true when this submission should be rejected as a duplicate.
 */
export async function isDuplicateClientToken(
  token: string | null | undefined,
): Promise<boolean> {
  if (!token) return false;
  const now = Date.now();
  pruneMemory(now);
  const key = hashToken(token);

  if (memoryTokens.has(key)) return true;
  memoryTokens.set(key, now);

  const service = createServiceClient();
  if (!service) return false;

  try {
    const { error } = await service.from("submission_tokens").insert({
      token_hash: key,
      expires_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    });
    if (error) {
      // Unique violation → duplicate
      if (
        error.code === "23505" ||
        /duplicate|unique/i.test(error.message ?? "")
      ) {
        return true;
      }
      console.info("[security] token insert:", error.message);
    }
  } catch (err) {
    console.info(
      "[security] token store unavailable:",
      err instanceof Error ? err.message : err,
    );
  }

  return false;
}

/**
 * Simple sliding window rate limit (per IP + route).
 * Uses memory + optional DB table `rate_limits`.
 */
export async function isRateLimited(
  request: Request,
  route: string,
  limit = 20,
  windowMs = 60_000,
): Promise<boolean> {
  const now = Date.now();
  pruneMemory(now);
  const ip = clientIp(request);
  const bucket = `${route}:${ip}`;

  const hit = memoryHits.get(bucket);
  if (!hit || now > hit.resetAt) {
    memoryHits.set(bucket, { count: 1, resetAt: now + windowMs });
  } else {
    hit.count += 1;
    if (hit.count > limit) return true;
  }

  const service = createServiceClient();
  if (!service) return false;

  try {
    const windowStart = new Date(now - windowMs).toISOString();
    const { count, error } = await service
      .from("rate_limit_hits")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .gte("created_at", windowStart);

    if (!error && typeof count === "number" && count >= limit) {
      return true;
    }

    await service.from("rate_limit_hits").insert({ bucket });
  } catch {
    // best-effort
  }

  return false;
}

/** Soft CSRF: require same-origin or allowed site URL for mutating API routes. */
export function assertSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (!origin && !referer) {
    // Non-browser clients (server tests) — allow
    return true;
  }

  const allowed = new Set<string>();
  if (site) {
    try {
      allowed.add(new URL(site).origin);
    } catch {
      /* ignore */
    }
  }
  try {
    allowed.add(new URL(request.url).origin);
  } catch {
    /* ignore */
  }

  if (origin && [...allowed].some((a) => origin === a)) return true;
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if ([...allowed].some((a) => refOrigin === a)) return true;
    } catch {
      return false;
    }
  }
  return false;
}
