"use server";

import { createClient } from "@/lib/supabase/server";
import { upsertExplorerProfile } from "@/lib/auth/profile";

export type WishlistSyncResult =
  | { ok: true; placeIds: string[] }
  | { ok: false; error: string };

/** Merge localStorage place IDs into wishlists and return the full server set. */
export async function syncWishlistAction(
  localPlaceIds: string[],
): Promise<WishlistSyncResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Join Panora to sync your wishlist." };

    await upsertExplorerProfile(supabase, user);

    const unique = [
      ...new Set(localPlaceIds.filter((id) => typeof id === "string" && id)),
    ];

    if (unique.length > 0) {
      const rows = unique.map((place_id) => ({
        user_id: user.id,
        place_id,
        collection: "wishlist",
      }));
      const { error: upsertError } = await supabase
        .from("wishlists")
        .upsert(rows, { onConflict: "user_id,place_id,collection" });
      if (upsertError) {
        // Table may not exist yet — soft-fail with local ids
        return { ok: true, placeIds: unique };
      }
    }

    const { data, error } = await supabase
      .from("wishlists")
      .select("place_id")
      .eq("user_id", user.id)
      .eq("collection", "wishlist");

    if (error) {
      return { ok: true, placeIds: unique };
    }

    const placeIds = [
      ...new Set([
        ...unique,
        ...(data ?? []).map((r) => r.place_id as string),
      ]),
    ];
    return { ok: true, placeIds };
  } catch {
    return { ok: false, error: "Could not sync wishlist right now." };
  }
}

export async function savePlaceAction(
  placeId: string,
): Promise<WishlistSyncResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Join Panora to save places." };

    await upsertExplorerProfile(supabase, user);

    const { error } = await supabase.from("wishlists").upsert(
      {
        user_id: user.id,
        place_id: placeId,
        collection: "wishlist",
      },
      { onConflict: "user_id,place_id,collection" },
    );

    if (error) {
      return { ok: true, placeIds: [placeId] };
    }

    return syncWishlistAction([]);
  } catch {
    return { ok: false, error: "Could not save this place." };
  }
}

export async function unsavePlaceAction(
  placeId: string,
): Promise<WishlistSyncResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Join Panora to manage saves." };

    await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("place_id", placeId)
      .eq("collection", "wishlist");

    return syncWishlistAction([]);
  } catch {
    return { ok: false, error: "Could not update wishlist." };
  }
}

export async function fetchWishlistPlaceIdsAction(): Promise<WishlistSyncResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: true, placeIds: [] };

    const { data, error } = await supabase
      .from("wishlists")
      .select("place_id")
      .eq("user_id", user.id)
      .eq("collection", "wishlist");

    if (error) return { ok: true, placeIds: [] };
    return {
      ok: true,
      placeIds: (data ?? []).map((r) => r.place_id as string),
    };
  } catch {
    return { ok: true, placeIds: [] };
  }
}
