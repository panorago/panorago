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
