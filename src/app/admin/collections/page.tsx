import { CollectionPlacePicker } from "@/components/admin/collection-place-picker";
import { getAdminPlaces } from "@/lib/admin/actions";
import {
  deleteCollection,
  getAdminCollections,
  upsertCollection,
} from "@/lib/admin/command";

export const metadata = {
  title: "Command Center · Collections",
};

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export default async function AdminCollectionsPage() {
  const [collections, places] = await Promise.all([
    getAdminCollections(),
    getAdminPlaces(),
  ]);

  const placeOptions = places.map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    slug: p.slug,
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Curation
        </p>
        <h1 className="mt-1 font-display text-4xl">Collections</h1>
        <p className="mt-2 text-sm text-muted">
          Secret collections and curated lists. Tick places from the list below
          — reorder with sort order values.
        </p>
      </div>

      {collections.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-4 py-3 text-sm text-muted">
          No collections yet — create one below after running migration{" "}
          <code>005_command_center.sql</code>.
        </p>
      )}

      <div className="space-y-6">
        {collections.map((collection) => (
          <form
            key={collection.id}
            action={async (formData) => {
              "use server";
              await upsertCollection(formData);
            }}
            className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow)]"
          >
            <input type="hidden" name="id" value={collection.id} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                {collection.key}
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={collection.enabled}
                />
                Enabled
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs text-muted">Title</span>
                <input
                  name="title"
                  defaultValue={collection.title}
                  className={field}
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs text-muted">Sort order</span>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={collection.sortOrder}
                  className={field}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs text-muted">Subtitle</span>
                <input
                  name="subtitle"
                  defaultValue={collection.subtitle}
                  className={field}
                />
              </label>
              <div className="md:col-span-2">
                <CollectionPlacePicker
                  places={placeOptions}
                  initialSelectedIds={collection.placeIds}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)]"
              >
                Save
              </button>
              <button
                formAction={async () => {
                  "use server";
                  await deleteCollection(collection.id);
                }}
                className="rounded-full border border-[var(--danger)]/40 px-4 py-2 text-sm text-[var(--danger)]"
              >
                Delete
              </button>
            </div>
          </form>
        ))}
      </div>

      <form
        action={async (formData) => {
          "use server";
          await upsertCollection(formData);
        }}
        className="space-y-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--glass)] p-5"
      >
        <h2 className="font-display text-2xl">New collection</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs text-muted">Title</span>
            <input name="title" required className={field} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-muted">Key (optional)</span>
            <input name="key" className={field} placeholder="auto from title" />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs text-muted">Subtitle</span>
            <input name="subtitle" className={field} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-muted">Sort order</span>
            <input
              name="sortOrder"
              type="number"
              defaultValue={0}
              className={field}
            />
          </label>
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" name="enabled" defaultChecked />
            Enabled
          </label>
          <div className="md:col-span-2">
            <CollectionPlacePicker places={placeOptions} />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)]"
        >
          Create collection
        </button>
      </form>
    </div>
  );
}
