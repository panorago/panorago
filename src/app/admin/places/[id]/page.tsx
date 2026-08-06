import { PlaceForm } from "@/components/admin/place-form";
import { getAdminPlace, updatePlace } from "@/lib/admin/actions";
import { SEED_PLACES } from "@/data/seed-places";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Admin · Edit place",
};

export default async function AdminEditPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fromDb = await getAdminPlace(id);
  const place = fromDb ?? SEED_PLACES.find((p) => p.id === id) ?? null;
  if (!place) notFound();

  async function save(formData: FormData) {
    "use server";
    return updatePlace(id, formData);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Edit {place.name}</h1>
        <p className="mt-1 text-sm text-muted">
          Update story, Panora notes, highlights, amenities, gallery, contact,
          verification, and homepage sections.
        </p>
        {!fromDb && (
          <p className="mt-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-4 py-3 text-sm text-muted">
            Showing seed data. Saving requires a live Supabase row with this id.
          </p>
        )}
      </div>
      <PlaceForm place={place} action={save} submitLabel="Save changes" />
    </div>
  );
}
