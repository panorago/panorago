import { unstable_cache } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";
import type { SiteSettings } from "@/types";

const EMPTY: SiteSettings = {
  whatsapp: "",
  email: "",
  phone: "",
  phoneDisplay: "",
  heroVideoUrl: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  x: "",
  mapsApiKeyNote: "",
};

/** Public footer and concierge copy. Env vars remain the fallback. */
export async function getPublicSiteSettings(): Promise<SiteSettings> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      if (!supabase) return EMPTY;

      const { data } = await supabase
        .from("site_settings")
        .select("settings")
        .eq("id", "default")
        .maybeSingle();

      if (!data?.settings || typeof data.settings !== "object") return EMPTY;
      return { ...EMPTY, ...(data.settings as Partial<SiteSettings>) };
    },
    ["public-site-settings"],
    { revalidate: 120, tags: ["settings"] },
  )();
}
