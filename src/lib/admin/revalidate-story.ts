import {
  revalidatePublicPlaces,
  revalidatePublicStories,
} from "@/lib/data/revalidate-places";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Look up the place behind a story, then bust the public place page. */
export async function revalidateStoryById(
  supabase: SupabaseClient,
  storyId: string,
) {
  const { data } = await supabase
    .from("experience_stories")
    .select("place_id, places(slug)")
    .eq("id", storyId)
    .maybeSingle();

  const row = data as {
    place_id?: string;
    places?: { slug?: string } | { slug?: string }[] | null;
  } | null;

  const placeId = row?.place_id ? String(row.place_id) : "";
  const places = row?.places;
  const slug = Array.isArray(places) ? places[0]?.slug : places?.slug;

  if (placeId) revalidatePublicStories(placeId, slug);
  else revalidatePublicPlaces(slug);
}
