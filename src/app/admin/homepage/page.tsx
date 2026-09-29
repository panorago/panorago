import { CollectionPlacePicker } from "@/components/admin/collection-place-picker";
import { HomepageSectionBoard } from "@/components/admin/homepage-section-board";
import {
  CreateSectionForm,
  DeleteSectionButton,
} from "@/components/admin/section-manager-forms";
import { getAdminPlaces, getAdminSections, updateSection } from "@/lib/admin/actions";
import Link from "next/link";

export const metadata = {
  title: "Command Center · Homepage",
};

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

const SECTION_TYPES = [
  "grid",
  "featured",
  "hero",
  "list",
  "cta",
  "testimonial",
  "about",
] as const;

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
              <form
                key={section.id}
                action={async (formData) => {
                  "use server";
                  await updateSection(formData);
                }}
                className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow)]"
              >
                <input type="hidden" name="id" value={section.id} />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                    {section.key}
                    {section.sectionType ? ` · ${section.sectionType}` : ""}
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="enabled"
                      defaultChecked={section.enabled}
                    />
                    Enabled
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs text-muted">Title</span>
                    <input
                      name="title"
                      defaultValue={section.title}
                      className={field}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs text-muted">Sort order</span>
                    <input
                      name="sortOrder"
                      type="number"
                      defaultValue={section.sortOrder}
                      className={field}
                    />
                  </label>
                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-xs text-muted">Subtitle</span>
                    <input
                      name="subtitle"
                      defaultValue={section.subtitle}
                      className={field}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs text-muted">Type</span>
                    <select
                      name="sectionType"
                      defaultValue={section.sectionType ?? "grid"}
                      className={field}
                    >
                      {SECTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="md:col-span-2">
                    <CollectionPlacePicker
                      places={placeOptions}
                      initialSelectedIds={section.placeIds}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)]"
                  >
                    Save section
                  </button>
                  <DeleteSectionButton id={section.id} title={section.title} />
                </div>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
