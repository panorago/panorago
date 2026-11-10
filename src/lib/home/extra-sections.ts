import type { HomepageSection } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const EXTRA_SECTION_PREFIX = "extra:";
const SETTINGS_KEY = "extraHomepageSections";

export type StoredExtraSection = {
  key: string;
  title: string;
  subtitle: string;
  sortOrder: number;
  enabled: boolean;
  placeIds: string[];
  sectionType?: string;
  cardLimit?: number;
  vibeFilter?: string | null;
};

export function extraSectionId(key: string) {
  return `${EXTRA_SECTION_PREFIX}${key}`;
}

export function isExtraSectionId(id: string) {
  return id.startsWith(EXTRA_SECTION_PREFIX);
}

export function extraSectionKey(id: string) {
  return id.slice(EXTRA_SECTION_PREFIX.length);
}

export function toHomepageSection(row: StoredExtraSection): HomepageSection {
  return {
    id: extraSectionId(row.key),
    key: row.key,
    title: row.title,
    subtitle: row.subtitle ?? "",
    sortOrder: Number(row.sortOrder ?? 0),
    enabled: row.enabled !== false,
    placeIds: Array.isArray(row.placeIds) ? row.placeIds : [],
    sectionType: row.sectionType ?? "grid",
    cardLimit:
      typeof row.cardLimit === "number" ? row.cardLimit : undefined,
    vibeFilter: row.vibeFilter ?? null,
  };
}

function isStored(value: unknown): value is StoredExtraSection {
  if (!value || typeof value !== "object") return false;
  const row = value as StoredExtraSection;
  return typeof row.key === "string" && typeof row.title === "string";
}

export async function readExtraSections(
  supabase: SupabaseClient,
): Promise<StoredExtraSection[]> {
  const { data } = await supabase
    .from("site_settings")
    .select("settings")
    .eq("id", "default")
    .maybeSingle();

  const settings = data?.settings;
  if (!settings || typeof settings !== "object") return [];
  const raw = (settings as Record<string, unknown>)[SETTINGS_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.filter(isStored);
}

export async function saveExtraSections(
  supabase: SupabaseClient,
  userId: string | null,
  sections: StoredExtraSection[],
): Promise<{ error?: string }> {
  const { data } = await supabase
    .from("site_settings")
    .select("settings")
    .eq("id", "default")
    .maybeSingle();

  const current =
    data?.settings && typeof data.settings === "object"
      ? (data.settings as Record<string, unknown>)
      : {};

  const { error } = await supabase.from("site_settings").upsert({
    id: "default",
    settings: { ...current, [SETTINGS_KEY]: sections },
    updated_at: new Date().toISOString(),
    updated_by: userId,
  });

  return error ? { error: error.message } : {};
}

export function mergeHomepageSections(
  primary: HomepageSection[],
  extras: HomepageSection[],
): HomepageSection[] {
  const keys = new Set(primary.map((section) => section.key));
  return [...primary, ...extras.filter((section) => !keys.has(section.key))].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}
