import { getAdminPlaces, getAdminStories } from "@/lib/admin/actions";
import { SEED_PLACES, SEED_STORIES } from "@/data/seed-places";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const metadata = {
  title: "Admin · Dashboard",
};

export default async function AdminDashboardPage() {
  const [places, stories] = await Promise.all([
    getAdminPlaces(),
    getAdminStories(),
  ]);

  const placeList = places.length > 0 ? places : SEED_PLACES;
  const storyList = stories.length > 0 ? stories : SEED_STORIES;

  const published = placeList.filter((p) => p.published).length;
  const drafts = placeList.length - published;
  const pendingStories = storyList.filter((s) => !s.published).length;

  const recent = [...placeList]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 6);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Overview of places, stories, and recent edits.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Places", value: placeList.length },
          { label: "Published", value: published },
          { label: "Drafts", value: drafts },
          { label: "Stories pending", value: pendingStories },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] p-5"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-3xl">{stat.value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Recent places</h2>
          <Link
            href="/admin/places"
            className="text-sm text-[var(--accent)] hover:opacity-80"
          >
            Manage all →
          </Link>
        </div>
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)]">
          {recent.map((place) => (
            <li
              key={place.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <Link
                  href={`/admin/places/${place.id}`}
                  className="font-medium hover:text-[var(--accent)]"
                >
                  {place.name}
                </Link>
                <p className="text-xs text-muted">
                  {place.city} · {place.published ? "Published" : "Draft"} ·{" "}
                  {formatDistanceToNow(new Date(place.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <Link
                href={`/panoras/${place.slug}`}
                className="text-xs text-muted hover:text-[var(--accent)]"
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
