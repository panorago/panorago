import { HomepageSectionForm } from "@/components/admin/homepage-section-form";
import { getAdminPlaces, getAdminSections } from "@/lib/admin/actions";

export const metadata = {
  title: "Admin · Sections",
};

export default async function AdminSectionsPage() {
  const [sections, places] = await Promise.all([
    getAdminSections(),
    getAdminPlaces(),
  ]);
  const placeOptions = places.map((place) => ({
    id: place.id,
    name: place.name,
    city: place.city,
    slug: place.slug,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Homepage sections</h1>
        <p className="mt-1 text-sm text-muted">
          Titles, order, and the places shown in each section.
        </p>
      </div>

      {sections.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-4 py-3 text-sm text-muted">
          No homepage sections yet. Add one from the Homepage builder.
        </p>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <HomepageSectionForm
              key={section.id}
              section={section}
              places={placeOptions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
