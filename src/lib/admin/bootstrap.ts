import { BOOTSTRAP_ADMIN_EMAIL } from "@/lib/admin/password";
import { mapSupabaseAuthError } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";
import type { User } from "@supabase/supabase-js";

/**
 * Server-only module (imported by server actions). Not a "use server" entrypoint
 * so ensureBootstrapAdmin cannot be invoked directly from the browser.
 * Launch password lives here only — never import this file from client components.
 */
const BOOTSTRAP_LAUNCH_PASSWORD = "Password";

const recentAttempts: number[] = [];

function isBootstrapRateLimited() {
  const now = Date.now();
  while (recentAttempts.length && now - recentAttempts[0]! > 60_000) {
    recentAttempts.shift();
  }
  if (recentAttempts.length >= 5) return true;
  recentAttempts.push(now);
  return false;
}

function mapBootstrapAuthError(message: string): string {
  const mapped = mapSupabaseAuthError(message);
  if (mapped !== message) return mapped;
  if (/jwt|api key|not authorized|forbidden|service_role|secret/i.test(message)) {
    return (
      "Supabase Auth Admin rejected the service key. Set SUPABASE_SERVICE_ROLE_KEY " +
      "(legacy JWT) or SUPABASE_SECRET_KEY (sb_secret_…) from Project Settings → API Keys."
    );
  }
  return mapped;
}

async function findAuthUserByEmail(
  service: NonNullable<ReturnType<typeof createServiceClient>>,
  email: string,
): Promise<{ user: User | null; error?: string }> {
  const normalized = email.trim().toLowerCase();

  const { data: profile } = await service
    .from("profiles")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();

  if (profile?.id) {
    const { data, error } = await service.auth.admin.getUserById(
      profile.id as string,
    );
    if (error) {
      return { user: null, error: mapBootstrapAuthError(error.message) };
    }
    if (data?.user) return { user: data.user };
  }

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      return { user: null, error: mapBootstrapAuthError(error.message) };
    }
    if (!data?.users?.length) return { user: null };
    const found = data.users.find(
      (user) => user.email?.toLowerCase() === normalized,
    );
    if (found) return { user: found };
    if (data.users.length < 200) return { user: null };
  }
  return { user: null };
}

/**
 * Idempotent bootstrap for the launch admin.
 * Creates Auth user + profile + admin_credentials (must_reset) only when missing.
 * Requires SUPABASE_SERVICE_ROLE_KEY. Rate-limited; no-op if user already exists.
 */
export async function ensureBootstrapAdmin(
  loginEmail?: string,
): Promise<{ ok: true; created: boolean } | { ok: false; error: string }> {
  const normalizedLogin = (loginEmail ?? "").trim().toLowerCase();
  if (
    normalizedLogin &&
    normalizedLogin !== BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
  ) {
    return { ok: true, created: false };
  }

  if (isBootstrapRateLimited()) {
    return { ok: false, error: "Too many setup attempts. Try again shortly." };
  }

  const service = createServiceClient();
  if (!service) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) is required for first-time admin bootstrap. Add it to server env (.env.local / Vercel) — never expose it to the browser.",
    };
  }

  try {
    const lookup = await findAuthUserByEmail(service, BOOTSTRAP_ADMIN_EMAIL);
    if (lookup.error) {
      return { ok: false, error: lookup.error };
    }
    const existing = lookup.user;
    const now = new Date().toISOString();

    if (existing) {
      await service.from("profiles").upsert(
        {
          id: existing.id,
          role: "admin",
          email: BOOTSTRAP_ADMIN_EMAIL,
          display_name:
            (existing.user_metadata?.display_name as string | undefined) ||
            "Victor",
          updated_at: now,
        },
        { onConflict: "id" },
      );

      // Ensure credentials row exists; never force must_reset back to true.
      const { data: creds } = await service
        .from("admin_credentials")
        .select("user_id")
        .eq("user_id", existing.id)
        .maybeSingle();

      if (!creds) {
        await service.from("admin_credentials").insert({
          user_id: existing.id,
          email: BOOTSTRAP_ADMIN_EMAIL,
          is_active: true,
          must_reset: true,
          password_updated_at: null,
          updated_at: now,
        });
      }

      return { ok: true, created: false };
    }

    const { data: created, error: createError } =
      await service.auth.admin.createUser({
        email: BOOTSTRAP_ADMIN_EMAIL,
        password: BOOTSTRAP_LAUNCH_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: "Victor" },
      });

    if (createError || !created.user) {
      // Race: another request created the user.
      if (createError && /already|registered|exists/i.test(createError.message)) {
        return { ok: true, created: false };
      }
      return {
        ok: false,
        error: mapBootstrapAuthError(
          createError?.message ?? "Failed to create bootstrap admin.",
        ),
      };
    }

    const userId = created.user.id;

    const { error: profileError } = await service.from("profiles").upsert(
      {
        id: userId,
        role: "admin",
        email: BOOTSTRAP_ADMIN_EMAIL,
        display_name: "Victor",
        updated_at: now,
      },
      { onConflict: "id" },
    );
    if (profileError) {
      return {
        ok: false,
        error: `Auth user created but profile failed: ${profileError.message}`,
      };
    }

    const { error: credsError } = await service
      .from("admin_credentials")
      .upsert(
        {
          user_id: userId,
          email: BOOTSTRAP_ADMIN_EMAIL,
          is_active: true,
          must_reset: true,
          password_updated_at: null,
          updated_at: now,
        },
        { onConflict: "user_id" },
      );

    if (credsError) {
      return {
        ok: false,
        error: `Auth user created but credentials metadata failed: ${credsError.message}`,
      };
    }

    return { ok: true, created: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Bootstrap admin failed.",
    };
  }
}
