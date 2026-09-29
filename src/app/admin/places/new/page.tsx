import { PlaceForm } from "@/components/admin/place-form";
import { createPlace, getAdminSections } from "@/lib/admin/actions";

export const metadata = {
  title: "Admin · Add place",
};

export default async function AdminNewPlacePage() {
  const sections = await getAdminSections();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Add place</h1>
        <p className="mt-1 text-sm text-muted">
          Create a new listing in Supabase. Unpublished places stay in draft.
        </p>
      </div>
      <PlaceForm
        action={createPlace}
        submitLabel="Create place"
        sectionChoices={sections.map((section) => ({
          key: section.key,
          title: section.title,
        }))}
      />
    </div>
  );
}
