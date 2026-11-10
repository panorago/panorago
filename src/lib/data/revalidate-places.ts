import { revalidatePath, updateTag } from "next/cache";

/** Bust public place data cache + key public routes after admin mutations. */
export function revalidatePublicPlaces(slug?: string) {
  updateTag("places");
  revalidatePath("/");
  revalidatePath("/discover");
  if (slug) {
    updateTag(`place:${slug}`);
    revalidatePath(`/panoras/${slug}`);
    revalidatePath(`/p/${slug}`);
  }
}

/** Guest stories are cached per place. Bust that cache after moderation. */
export function revalidatePublicStories(placeId: string, slug?: string) {
  updateTag(`stories:${placeId}`);
  revalidatePublicPlaces(slug);
}

/** Footer contacts and social links read from site settings. */
export function revalidatePublicSettings() {
  updateTag("settings");
  revalidatePath("/", "layout");
}
