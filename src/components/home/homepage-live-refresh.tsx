"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Refetch the homepage when an admin changes sections or places. */
export function HomepageLiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 400);
    };

    const channel = supabase
      .channel("homepage-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "homepage_sections" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "places" },
        refresh,
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
