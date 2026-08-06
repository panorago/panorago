import {
  deletePlace,
  getAdminPlaces,
  setPlacePublished,
} from "@/lib/admin/actions";
import {
  duplicatePlace,
  setPlaceFlags,
} from "@/lib/admin/command";
import { CsvImport } from "@/components/admin/csv-import";
import Link from "next/link";

export const metadata = {
  title: "Command Center · Places",
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    tier?: string;
    page?: string;
  }>;
};

export default async function AdminPlacesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const status = params.status ?? "all";
  const tier = params.tier ?? "all";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = 24;

  const fetched = await getAdminPlaces();
  let places = fetched;

  if (q) {
    places = places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }
  if (status === "published") places = places.filter((p) => p.published && !p.archived);
  if (status === "draft") places = places.filter((p) => !p.published && !p.archived);
  if (status === "archived") places = places.filter((p) => p.archived);
  if (status === "featured") places = places.filter((p) => p.featured);
  if (status === "verified") places = places.filter((p) => p.verified);
  if (tier !== "all") places = places.filter((p) => p.paidTier === tier);

  const total = places.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const slice = places.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Inventory
          </p>
          <h1 className="mt-1 font-display text-4xl">Places</h1>
          <p className="mt-2 text-sm text-muted">
            Search, filter, publish, feature, archive, and duplicate listings.
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
          No places in Supabase yet — connect and sign in as admin to manage live
          records.
        </p>
      )}

      {fetched.length > 0 && <CsvImport />}

      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search name, city, slug…"
          className="min-w-[200px] flex-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm"
        >
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="featured">Featured</option>
          <option value="verified">Verified</option>
          <option value="archived">Archived</option>
        </select>
        <select
          name="tier"
          defaultValue={tier}
          className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm"
        >
          <option value="all">All tiers</option>
          <option value="basic">Basic</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
        </select>
        <button
          type="submit"
          className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)]"
        >
          Apply
        </button>
      </form>

      <p className="text-xs text-muted">
        {total} place{total === 1 ? "" : "s"}
        {pages > 1 ? ` · page ${page} of ${pages}` : ""}
      </p>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {slice.map((place) => (
          <li
            key={place.id}
            className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] shadow-[var(--shadow)]"
          >
            <div
              className="aspect-[16/10] bg-cover bg-center"
              style={{ backgroundImage: `url(${place.heroImage})` }}
            />
            <div className="space-y-3 p-4">
              <div>
                <Link
                  href={`/admin/places/${place.id}`}
                  className="font-display text-xl hover:text-[var(--accent)]"
                >
                  {place.name}
                </Link>
                <p className="text-xs text-muted">
                  {place.city} · {place.category} · {place.paidTier}
                  {place.verified ? " · Verified" : ""}
                  {place.featured ? " · Featured" : ""}
                  {place.archived ? " · Archived" : ""}
                  {" · "}
                  {place.published ? "Published" : "Draft"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/places/${place.id}`}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--glass)]"
                >
                  Edit
                </Link>
                <Link
                  href={`/panoras/${place.slug}`}
                  target="_blank"
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--glass)]"
                >
                  Preview
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
                        await setPlaceFlags(place.id, {
                          featured: !place.featured,
                        });
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--glass)]"
                      >
                        {place.featured ? "Unfeature" : "Feature"}
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await setPlaceFlags(place.id, {
                          archived: !place.archived,
                          published: place.archived ? place.published : false,
                        });
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--glass)]"
                      >
                        {place.archived ? "Restore" : "Archive"}
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await duplicatePlace(place.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--glass)]"
                      >
                        Duplicate
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
                        className="rounded-full border border-[var(--danger)]/40 px-3 py-1 text-xs text-[var(--danger)]"
                      >
                        Delete
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => {
            const qs = new URLSearchParams();
            if (params.q) qs.set("q", params.q);
            if (status !== "all") qs.set("status", status);
            if (tier !== "all") qs.set("tier", tier);
            qs.set("page", String(n));
            return (
              <Link
                key={n}
                href={`/admin/places?${qs.toString()}`}
                className={`rounded-full px-3 py-1 text-xs ${
                  n === page
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "border border-[var(--border)] hover:bg-[var(--glass)]"
                }`}
              >
                {n}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
