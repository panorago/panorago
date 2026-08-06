import { getAdminSections, updateSection } from "@/lib/admin/actions";
import { SEED_SECTIONS } from "@/data/seed-places";

export const metadata = {
  title: "Admin · Sections",
};

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export default async function AdminSectionsPage() {
  const fetched = await getAdminSections();
  const sections = fetched.length > 0 ? fetched : SEED_SECTIONS;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Homepage sections</h1>
        <p className="mt-1 text-sm text-muted">
          Titles, order, enabled state, and curated place ids.
        </p>
      </div>

      {fetched.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-4 py-3 text-sm text-muted">
          Showing seed sections — persist changes once `homepage_sections`
          exists in Supabase.
        </p>
      )}

      <div className="space-y-6">
        {sections.map((section) => (
          <form
            key={section.id}
            action={async (formData) => {
              "use server";
              await updateSection(formData);
            }}
            className="space-y-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] p-5"
          >
            <input type="hidden" name="id" value={section.id} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                {section.key}
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
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs text-muted">
                  Place IDs (comma or newline)
                </span>
                <textarea
                  name="placeIds"
                  rows={3}
                  defaultValue={section.placeIds.join("\n")}
                  className={field}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={fetched.length === 0}
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50"
            >
              Save section
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
