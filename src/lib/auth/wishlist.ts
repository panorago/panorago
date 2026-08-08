"use server";

import { createClient } from "@/lib/supabase/server";
import { upsertExplorerProfile } from "@/lib/auth/profile";

export type WishlistSyncResult =
  | { ok: true; placeIds: string[]; skipped?: string[] }
  | { ok: false; error: string; placeIds?: string[] };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPlaceUuid(id: string) {
  return UUID_RE.test(id);
}

function isMissingRelationError(message: string) {
  return /does not exist|relation|schema cache/i.test(message);
}

/** FK / invalid uuid — keep local save; do not treat as user-facing failure. */
function isSoftPlaceIdError(message: string) {
  return /foreign key|violates foreign key|invalid input syntax for type uuid|22P02|23503/i.test(
    message,
  );
}

function uniquePlaceIds(ids: string[]) {
  return [...new Set(ids.filter((id) => typeof id === "string" && id.trim()))];
}

function logWishlist(message: string, detail?: unknown) {
  if (detail !== undefined) {
    console.warn(`[wishlist] ${message}`, detail);
  } else {
    console.warn(`[wishlist] ${message}`);
  }
}

async function fetchRemotePlaceIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ ok: true; placeIds: string[] } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("wishlists")
    .select("place_id")
    .eq("user_id", userId)
    .eq("collection", "wishlist");

  if (error) {
    if (isMissingRelationError(error.message)) {
      return { ok: true, placeIds: [] };
    }
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    placeIds: uniquePlaceIds((data ?? []).map((r) => String(r.place_id))),
  };
}

/**
 * Upsert one place. Soft-skips non-UUID / FK failures so batch sync never
 * aborts the whole wishlist.
 */
async function upsertOneWishlistRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  placeId: string,
): Promise<"ok" | "skipped" | "auth" | "hard"> {
  if (!isPlaceUuid(placeId)) {
    logWishlist("skip non-UUID place_id (local-only)", placeId);
    return "skipped";
  }

  const { error } = await supabase.from("wishlists").upsert(
    {
      user_id: userId,
      place_id: placeId,
      collection: "wishlist",
    },
    { onConflict: "user_id,place_id,collection" },
  );

  if (!error) return "ok";

  if (isMissingRelationError(error.message)) {
    logWishlist("wishlists table missing — local-only mode");
    return "skipped";
  }

  if (isSoftPlaceIdError(error.message)) {
    logWishlist("soft skip upsert (FK/uuid)", {
      placeId,
      error: error.message,
    });
    return "skipped";
  }

  if (/JWT|auth|not authenticated|row-level security|42501|401|403/i.test(error.message)) {
    logWishlist("auth/RLS upsert failure", error.message);
    return "auth";
  }

  logWishlist("hard upsert failure", { placeId, error: error.message });
  return "hard";
}

/** Merge localStorage place IDs into wishlists and return local ∪ remote. */
export async function syncWishlistAction(
  localPlaceIds: string[],
): Promise<WishlistSyncResult> {
  const localUnique = uniquePlaceIds(localPlaceIds);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        ok: false,
        error: "Join Panora to sync your wishlist.",
        placeIds: localUnique,
      };
    }

    const profileResult = await upsertExplorerProfile(supabase, user);
    if (!profileResult.ok) {
      logWishlist("profile upsert failed", profileResult.error);
      return {
        ok: false,
        error: profileResult.error,
        placeIds: localUnique,
      };
    }

    const skipped: string[] = [];
    let authBlocked = false;
    let hardError: string | null = null;

    for (const placeId of localUnique) {
      const result = await upsertOneWishlistRow(supabase, user.id, placeId);
      if (result === "skipped") skipped.push(placeId);
      if (result === "auth") authBlocked = true;
      if (result === "hard") {
        // Retry once for transient failures on real UUIDs
        const retry = await upsertOneWishlistRow(supabase, user.id, placeId);
        if (retry === "ok") continue;
        if (retry === "skipped") {
          skipped.push(placeId);
          continue;
        }
        if (retry === "auth") {
          authBlocked = true;
          continue;
        }
        hardError = `Could not sync place ${placeId}`;
      }
    }

    if (authBlocked) {
      return {
        ok: false,
        error: "Join Panora to sync your wishlist.",
        placeIds: localUnique,
      };
    }

    const remote = await fetchRemotePlaceIds(supabase, user.id);
    if (!remote.ok) {
      if (isSoftPlaceIdError(remote.error) || isMissingRelationError(remote.error)) {
        return { ok: true, placeIds: localUnique, skipped };
      }
      logWishlist("fetch remote failed — keeping local union", remote.error);
      // Still succeed for UX: local list is source of truth on device
      return { ok: true, placeIds: localUnique, skipped };
    }

    const merged = uniquePlaceIds([...localUnique, ...remote.placeIds]);

    if (hardError) {
      logWishlist(hardError, { skipped, mergedCount: merged.length });
      // Do not fail the explorer UX — local + whatever synced remains
      return { ok: true, placeIds: merged, skipped };
    }

    return { ok: true, placeIds: merged, skipped };
  } catch (err) {
    logWishlist("syncWishlistAction exception", err);
    return {
      ok: true,
      placeIds: localUnique,
      skipped: localUnique,
    };
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
    if (!user) {
      return { ok: false, error: "Join Panora to save places.", placeIds: [placeId] };
    }

    const profileResult = await upsertExplorerProfile(supabase, user);
    if (!profileResult.ok) {
      return {
        ok: false,
        error: profileResult.error,
        placeIds: [placeId],
      };
    }

    const result = await upsertOneWishlistRow(supabase, user.id, placeId);
    if (result === "auth") {
      return {
        ok: false,
        error: "Join Panora to save places.",
        placeIds: [placeId],
      };
    }

    // skipped (non-UUID / FK) or ok — always return union including this place
    return syncWishlistAction([placeId]);
  } catch (err) {
    logWishlist("savePlaceAction exception", err);
    return { ok: true, placeIds: [placeId] };
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
    if (!user) {
      return { ok: false, error: "Join Panora to manage saves." };
    }

    if (isPlaceUuid(placeId)) {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("place_id", placeId)
        .eq("collection", "wishlist");

      if (error && !isMissingRelationError(error.message)) {
        if (isSoftPlaceIdError(error.message)) {
          logWishlist("soft skip delete", { placeId, error: error.message });
        } else if (/JWT|auth|row-level security|42501|401|403/i.test(error.message)) {
          return { ok: false, error: "Join Panora to manage saves." };
        } else {
          logWishlist("delete failed", error.message);
          return { ok: false, error: error.message };
        }
      }
    }

    const remote = await fetchRemotePlaceIds(supabase, user.id);
    if (!remote.ok) {
      // Local unsave already applied by caller — don't force a wipe
      return { ok: true, placeIds: [] };
    }

    return {
      ok: true,
      placeIds: remote.placeIds.filter((id) => id !== placeId),
    };
  } catch (err) {
    logWishlist("unsavePlaceAction exception", err);
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

    const remote = await fetchRemotePlaceIds(supabase, user.id);
    if (!remote.ok) {
      if (isMissingRelationError(remote.error)) {
        return { ok: true, placeIds: [] };
      }
      logWishlist("fetchWishlistPlaceIdsAction failed", remote.error);
      return { ok: false, error: remote.error, placeIds: [] };
    }
    return { ok: true, placeIds: remote.placeIds };
  } catch (err) {
    logWishlist("fetchWishlistPlaceIdsAction exception", err);
    return { ok: true, placeIds: [] };
  }
}
