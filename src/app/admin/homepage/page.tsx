import { HomepageSectionBoard } from "@/components/admin/homepage-section-board";
import { HomepageSectionForm } from "@/components/admin/homepage-section-form";
import { CreateSectionForm } from "@/components/admin/section-manager-forms";
import { getAdminPlaces, getAdminSections } from "@/lib/admin/actions";
import Link from "next/link";

export const metadata = {
  title: "Command Center · Homepage",
};

export default async function AdminHomepagePage() {
  const [sections, places] = await Promise.all([
    getAdminSections(),
    getAdminPlaces(),
  ]);
  const ordered = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const placeOptions = places.map((place) => ({
    id: place.id,
    name: place.name,
    city: place.city,
    slug: place.slug,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Builder
          </p>
          <h1 className="mt-1 font-display text-4xl">Homepage</h1>
          <p className="mt-2 text-sm text-muted">
            Add, rename, enable, reorder, or remove sections. Changes show on the public homepage.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:bg-[var(--glass)]"
        >
          Preview site →
        </Link>
      </div>

      <CreateSectionForm />

      {ordered.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-4 py-3 text-sm text-muted">
          No <code>homepage_sections</code> rows yet. Legacy editor also lives
          at{" "}
          <Link href="/admin/sections" className="text-[var(--accent)]">
            /admin/sections
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-8">
          <HomepageSectionBoard initialSections={ordered} />

          <div className="space-y-6">
            {ordered.map((section) => (
              <HomepageSectionForm
                key={section.id}
                section={section}
                places={placeOptions}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
