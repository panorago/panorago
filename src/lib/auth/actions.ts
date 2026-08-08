"use server";

import { validateExplorerPassword } from "@/lib/auth/password";
import {
  fetchExplorerProfile,
  mapProfileRow,
  upsertExplorerProfile,
  type ExplorerPreferences,
  type ExplorerProfile,
} from "@/lib/auth/profile";
import { mapSupabaseAuthError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { resolveSiteOrigin } from "@/lib/utils";

export type AuthActionResult =
  | { ok: true; message?: string; needsEmailConfirm?: boolean }
  | { ok: false; error: string };

function siteOrigin() {
  return resolveSiteOrigin();
}

function safeNextPath(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/explorer";
  return raw;
}

export async function ensureExplorerSessionAction(): Promise<
  | { ok: true; userId: string; profile: ExplorerProfile | null }
  | { ok: false; error: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "signed_out" };

    const upserted = await upsertExplorerProfile(supabase, user);
    if (!upserted.ok) {
      return { ok: true, userId: user.id, profile: null };
    }
    return { ok: true, userId: user.id, profile: upserted.profile };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Session unavailable",
    };
  }
}

export async function getExplorerProfileAction(): Promise<ExplorerProfile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return fetchExplorerProfile(supabase, user.id);
  } catch {
    return null;
  }
}

export async function signUpWithEmailAction(input: {
  email: string;
  password: string;
  displayName?: string;
  nextPath?: string;
}): Promise<AuthActionResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email." };
  }
  const pwError = validateExplorerPassword(password);
  if (pwError) return { ok: false, error: pwError };
  const next = safeNextPath(input.nextPath);

  try {
    const supabase = await createClient();
    const origin = siteOrigin();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: {
          full_name: input.displayName?.trim() || undefined,
          display_name: input.displayName?.trim() || undefined,
        },
      },
    });

    if (error) {
      return { ok: false, error: mapSupabaseAuthError(error.message) };
    }

    if (data.user && data.session) {
      await upsertExplorerProfile(supabase, data.user);
      return { ok: true, message: "Welcome to Panora." };
    }

    return {
      ok: true,
      needsEmailConfirm: true,
      message: "Check your email to continue exploring.",
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not join right now.",
    };
  }
}

export async function signInWithEmailAction(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    return { ok: false, error: "Email and password are required." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (error) {
      return { ok: false, error: mapSupabaseAuthError(error.message) };
    }
    if (data.user) {
      await upsertExplorerProfile(supabase, data.user);
    }
    return { ok: true, message: "Welcome back." };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not sign in.",
    };
  }
}

export async function sendMagicLinkAction(
  emailRaw: string,
  nextPath?: string,
): Promise<AuthActionResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email." };
  }
  const next = safeNextPath(nextPath);
  try {
    const supabase = await createClient();
    const origin = siteOrigin();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      return { ok: false, error: mapSupabaseAuthError(error.message) };
    }
    return {
      ok: true,
      message: "Magic link sent — check your inbox to continue.",
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not send magic link.",
    };
  }
}

export async function sendPasswordResetAction(
  emailRaw: string,
  nextPath?: string,
): Promise<AuthActionResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email." };
  }
  const base = safeNextPath(nextPath);
  const resetNext =
    base.includes("?") ? `${base}&reset=1` : `${base}?reset=1`;
  try {
    const supabase = await createClient();
    const origin = siteOrigin();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(resetNext)}`,
    });
    if (error) {
      return { ok: false, error: mapSupabaseAuthError(error.message) };
    }
    return {
      ok: true,
      message: "If that email is with us, a reset link is on its way.",
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not send reset email.",
    };
  }
}

export async function signOutExplorerAction(): Promise<AuthActionResult> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not sign out." };
  }
}

export async function saveExplorerPreferencesAction(
  vibes: string[],
): Promise<AuthActionResult & { profile?: ExplorerProfile }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Join Panora to save preferences." };

    const existing = await fetchExplorerProfile(supabase, user.id);
    const preferences: ExplorerPreferences = {
      ...(existing?.preferences ?? {}),
      vibes: vibes.slice(0, 12),
      onboarded: true,
    };

    const { data, error } = await supabase
      .from("profiles")
      .update({ preferences })
      .eq("id", user.id)
      .select(
        "id, email, display_name, avatar_url, provider, role, explorer_points, passport_level, preferences, location, joined_at, last_login",
      )
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }

    return {
      ok: true,
      message: "Preferences saved.",
      profile: data ? mapProfileRow(data) : undefined,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not save preferences.",
    };
  }
}

/** Client-safe Google OAuth redirect URL builder (actual OAuth starts in browser). */
export async function getGoogleOAuthRedirectAction(nextPath: string): Promise<
  | { ok: true; url: string }
  | { ok: false; error: string }
> {
  try {
    const supabase = await createClient();
    const origin = siteOrigin();
    const next = nextPath.startsWith("/") ? nextPath : "/";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) {
      return {
        ok: false,
        error: mapSupabaseAuthError(error?.message ?? "Google sign-in unavailable."),
      };
    }
    return { ok: true, url: data.url };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Google sign-in unavailable.",
    };
  }
}
