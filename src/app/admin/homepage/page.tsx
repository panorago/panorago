import { getAdminSections, updateSection } from "@/lib/admin/actions";
import Link from "next/link";

export const metadata = {
  title: "Command Center · Homepage",
};

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export default async function AdminHomepagePage() {
  const sections = await getAdminSections();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Builder
          </p>
          <h1 className="mt-1 font-display text-4xl">Homepage</h1>
          <p className="mt-2 text-sm text-muted">
            Enable, disable, and reorder homepage section keys.
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

      {sections.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-4 py-3 text-sm text-muted">
          No <code>homepage_sections</code> rows yet. Legacy editor also lives
          at{" "}
          <Link href="/admin/sections" className="text-[var(--accent)]">
            /admin/sections
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
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
                  <span className="text-xs text-muted">Place IDs</span>
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
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)]"
              >
                Save section
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
