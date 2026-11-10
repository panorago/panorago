import { PlaceForm } from "@/components/admin/place-form";
import { PlacePublishBar } from "@/components/admin/place-publish-bar";
import { getAdminPlace, getAdminSections, updatePlace } from "@/lib/admin/actions";
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
  const [fromDb, sections] = await Promise.all([
    getAdminPlace(id),
    getAdminSections(),
  ]);
  const place = fromDb;
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
      </div>
      {fromDb ? (
        <PlacePublishBar
          id={place.id}
          slug={place.slug}
          published={place.published}
          placeName={place.name}
        />
      ) : null}
      <PlaceForm
        place={place}
        action={save}
        submitLabel="Save changes"
        sectionChoices={sections.map((section) => ({
          key: section.key,
          title: section.title,
        }))}
      />
    </div>
  );
}
