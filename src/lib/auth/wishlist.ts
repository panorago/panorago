"use server";

import { createClient } from "@/lib/supabase/server";
import { upsertExplorerProfile } from "@/lib/auth/profile";

export type WishlistSyncResult =
  | { ok: true; placeIds: string[] }
  | { ok: false; error: string };

function isMissingRelationError(message: string) {
  return /does not exist|relation|schema cache/i.test(message);
}

function uniquePlaceIds(ids: string[]) {
  return [...new Set(ids.filter((id) => typeof id === "string" && id))];
}

/** Merge localStorage place IDs into wishlists and return the full server∪local set. */
export async function syncWishlistAction(
  localPlaceIds: string[],
): Promise<WishlistSyncResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Join Panora to sync your wishlist." };

    const profileResult = await upsertExplorerProfile(supabase, user);
    if (!profileResult.ok) {
      return { ok: false, error: profileResult.error };
    }

    const unique = uniquePlaceIds(localPlaceIds);

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
        // Soft-fail only when the table has not been migrated yet.
        if (isMissingRelationError(upsertError.message)) {
          return { ok: true, placeIds: unique };
        }
        return { ok: false, error: upsertError.message };
      }
    }

    const { data, error } = await supabase
      .from("wishlists")
      .select("place_id")
      .eq("user_id", user.id)
      .eq("collection", "wishlist");

    if (error) {
      if (isMissingRelationError(error.message)) {
        return { ok: true, placeIds: unique };
      }
      return { ok: false, error: error.message };
    }

    return {
      ok: true,
      placeIds: uniquePlaceIds([
        ...unique,
        ...(data ?? []).map((r) => r.place_id as string),
      ]),
    };
  } catch {
    return { ok: false, error: "Could not sync wishlist right now." };
  }
}

export async function savePlaceAction(
  placeId: string,
): Promise<WishlistSyncResult> {
  if (!placeId) return { ok: false, error: "Missing place." };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Join Panora to save places." };

    const profileResult = await upsertExplorerProfile(supabase, user);
    if (!profileResult.ok) {
      return { ok: false, error: profileResult.error };
    }

    const { error } = await supabase.from("wishlists").upsert(
      {
        user_id: user.id,
        place_id: placeId,
        collection: "wishlist",
      },
      { onConflict: "user_id,place_id,collection" },
    );

    if (error) {
      if (isMissingRelationError(error.message)) {
        return { ok: true, placeIds: [placeId] };
      }
      return { ok: false, error: error.message };
    }

    // Return DB∪this place — callers should pass full local list via syncWishlistAction.
    return syncWishlistAction([placeId]);
  } catch {
    return { ok: false, error: "Could not save this place." };
  }
}

export async function unsavePlaceAction(
  placeId: string,
): Promise<WishlistSyncResult> {
  if (!placeId) return { ok: false, error: "Missing place." };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Join Panora to manage saves." };

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("place_id", placeId)
      .eq("collection", "wishlist");

    if (error && !isMissingRelationError(error.message)) {
      return { ok: false, error: error.message };
    }

    const { data, error: fetchError } = await supabase
      .from("wishlists")
      .select("place_id")
      .eq("user_id", user.id)
      .eq("collection", "wishlist");

    if (fetchError) {
      if (isMissingRelationError(fetchError.message)) {
        return { ok: true, placeIds: [] };
      }
      return { ok: false, error: fetchError.message };
    }

    return {
      ok: true,
      placeIds: uniquePlaceIds((data ?? []).map((r) => r.place_id as string)),
    };
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

    if (error) {
      if (isMissingRelationError(error.message)) {
        return { ok: true, placeIds: [] };
      }
      return { ok: false, error: error.message };
    }
    return {
      ok: true,
      placeIds: uniquePlaceIds((data ?? []).map((r) => r.place_id as string)),
    };
  } catch {
    return { ok: true, placeIds: [] };
  }
}
