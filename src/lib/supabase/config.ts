/**
 * Shared Supabase env helpers.
 * Normalizes project URL so clients never hit doubled /auth/v1 paths
 * (which Kong/GoTrue report as "Invalid path specified in request URL").
 */

const SERVICE_SUFFIXES = [
  "/auth/v1",
  "/rest/v1",
  "/realtime/v1",
  "/storage/v1",
  "/functions/v1",
] as const;

/** Strip whitespace, trailing slash, and accidental service path suffixes. */
export function normalizeSupabaseUrl(raw: string | undefined | null): string {
  let value = (raw ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!value) return "";

  // Drop trailing slashes first so suffix checks are stable.
  value = value.replace(/\/+$/, "");

  for (const suffix of SERVICE_SUFFIXES) {
    if (value.toLowerCase().endsWith(suffix)) {
      value = value.slice(0, -suffix.length).replace(/\/+$/, "");
      break;
    }
  }

  return value;
}

export function getSupabaseUrl(): string {
  return normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

export function getSupabaseServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    ""
  )
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

export function assertSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be an absolute http(s) URL (e.g. https://xxxx.supabase.co).",
    );
  }
  return { url, anonKey };
}

/** Human-friendly mapping for Auth / gateway path errors. */
export function mapSupabaseAuthError(message: string): string {
  const trimmed = message.trim();
  if (/invalid path|requested path is invalid|path specified/i.test(trimmed)) {
    return (
      "Supabase Auth rejected the request URL. Set NEXT_PUBLIC_SUPABASE_URL to your project URL " +
      "only (https://xxxx.supabase.co — no trailing slash, no /auth/v1). " +
      "In Supabase → Authentication → URL Configuration, set Site URL to your app origin " +
      "(e.g. http://localhost:3000 or https://your-domain) and allowlist the same origin under Redirect URLs."
    );
  }
  return trimmed;
}
