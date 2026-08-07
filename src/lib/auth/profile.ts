import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ExplorerPreferences = {
  vibes?: string[];
  onboarded?: boolean;
  collectionsComing?: boolean;
  [key: string]: unknown;
};

export type ExplorerProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  provider: string | null;
  role: string;
  explorerPoints: number;
  passportLevel: string;
  preferences: ExplorerPreferences;
  location: string | null;
  joinedAt: string | null;
  lastLogin: string | null;
};

function providerFromUser(user: User): string {
  const fromApp = user.app_metadata?.provider;
  if (typeof fromApp === "string" && fromApp) return fromApp;
  const identities = user.identities;
  if (Array.isArray(identities) && identities[0]?.provider) {
    return String(identities[0].provider);
  }
  return "email";
}

function displayNameFromUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const candidates = [
    meta.full_name,
    meta.name,
    meta.display_name,
    typeof user.email === "string" ? user.email.split("@")[0] : null,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

function avatarFromUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const url = meta.avatar_url ?? meta.picture;
  return typeof url === "string" && url ? url : null;
}

/**
 * Upsert explorer profile on first login / every session refresh.
 * Preserves admin/editor/viewer/suspended roles; only defaults new rows to user.
 */
export async function upsertExplorerProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<{ ok: true; profile: ExplorerProfile | null } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const provider = providerFromUser(user);
  const displayName = displayNameFromUser(user);
  const avatarUrl = avatarFromUser(user);
  const email = user.email ?? null;

  const { data: existing } = await supabase
    .from("profiles")
    .select(
      "id, email, display_name, avatar_url, provider, role, explorer_points, passport_level, preferences, location, joined_at, last_login",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("profiles")
      .update({
        email: email ?? existing.email,
        display_name: existing.display_name ?? displayName,
        avatar_url: existing.avatar_url ?? avatarUrl,
        provider: existing.provider ?? provider,
        last_login: now,
      })
      .eq("id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    return {
      ok: true,
      profile: mapProfileRow({ ...existing, last_login: now }),
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        role: "user",
        email,
        display_name: displayName,
        avatar_url: avatarUrl,
        provider,
        joined_at: now,
        last_login: now,
        explorer_points: 0,
        passport_level: "newcomer",
        preferences: {},
      },
      { onConflict: "id" },
    )
    .select(
      "id, email, display_name, avatar_url, provider, role, explorer_points, passport_level, preferences, location, joined_at, last_login",
    )
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, profile: data ? mapProfileRow(data) : null };
}

type ProfileRow = {
  id: string;
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  provider?: string | null;
  role?: string | null;
  explorer_points?: number | null;
  passport_level?: string | null;
  preferences?: unknown;
  location?: string | null;
  joined_at?: string | null;
  last_login?: string | null;
};

export function mapProfileRow(row: ProfileRow): ExplorerProfile {
  const prefs =
    row.preferences && typeof row.preferences === "object"
      ? (row.preferences as ExplorerPreferences)
      : {};
  return {
    id: row.id,
    email: row.email ?? null,
    displayName: row.display_name ?? null,
    avatarUrl: row.avatar_url ?? null,
    provider: row.provider ?? null,
    role: row.role ?? "user",
    explorerPoints: row.explorer_points ?? 0,
    passportLevel: row.passport_level ?? "newcomer",
    preferences: prefs,
    location: row.location ?? null,
    joinedAt: row.joined_at ?? null,
    lastLogin: row.last_login ?? null,
  };
}

export async function fetchExplorerProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ExplorerProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, email, display_name, avatar_url, provider, role, explorer_points, passport_level, preferences, location, joined_at, last_login",
    )
    .eq("id", userId)
    .maybeSingle();
  return data ? mapProfileRow(data) : null;
}
