import {
  deletePlace,
  getAdminPlaces,
  setPlacePublished,
} from "@/lib/admin/actions";
import { CsvImport } from "@/components/admin/csv-import";
import { SEED_PLACES } from "@/data/seed-places";
import Link from "next/link";

export const metadata = {
  title: "Admin · Places",
};

export default async function AdminPlacesPage() {
  const fetched = await getAdminPlaces();
  const places = fetched.length > 0 ? fetched : SEED_PLACES;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Places</h1>
          <p className="mt-1 text-sm text-muted">
            Publish, unpublish, or remove listings.
          </p>
        </div>
        <Link
          href="/admin/places/new"
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)]"
        >
          Add place
        </Link>
      </div>

      {fetched.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-4 py-3 text-sm text-muted">
          Showing seed data — connect Supabase and sign in as admin to manage
          live records.
        </p>
      )}

      {fetched.length > 0 && <CsvImport />}

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--secondary)] text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--background-elevated)]">
            {places.map((place) => (
              <tr key={place.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/places/${place.id}`}
                    className="font-medium hover:text-[var(--accent)]"
                  >
                    {place.name}
                  </Link>
                  <p className="text-xs text-muted">{place.slug}</p>
                </td>
                <td className="px-4 py-3 text-muted">{place.city}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      place.published
                        ? "text-[var(--success)]"
                        : "text-muted"
                    }
                  >
                    {place.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/places/${place.id}`}
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--glass)]"
                    >
                      Edit
                    </Link>
                    {fetched.length > 0 && (
                      <>
                        <form
                          action={async () => {
                            "use server";
                            await setPlacePublished(place.id, !place.published);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--glass)]"
                          >
                            {place.published ? "Unpublish" : "Publish"}
                          </button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await deletePlace(place.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-full border border-[var(--danger)]/40 px-3 py-1 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10"
                          >
                            Delete
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
