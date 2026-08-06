import { AnimatedCounter } from "@/components/admin/animated-counter";
import { getAdminPlaces, getAdminStories } from "@/lib/admin/actions";
import { getDashboardStats } from "@/lib/admin/command";
import { BOOKING_STATUS_COLORS } from "@/lib/bookings/codes";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const metadata = {
  title: "Command Center · Dashboard",
};

export default async function AdminDashboardPage() {
  const [stats, places, stories] = await Promise.all([
    getDashboardStats(),
    getAdminPlaces(),
    getAdminStories(),
  ]);

  const hasLiveData =
    places.length > 0 ||
    stories.length > 0 ||
    stats.bookingsToday > 0 ||
    stats.placesTotal > 0;

  const cards = [
    { label: "Places", value: stats.placesTotal || places.length, href: "/admin/places" },
    {
      label: "Published",
      value: stats.placesPublished || places.filter((p) => p.published).length,
      href: "/admin/places",
    },
    {
      label: "Verified",
      value: stats.placesVerified || places.filter((p) => p.verified).length,
      href: "/admin/places",
    },
    {
      label: "Featured",
      value: stats.placesFeatured || places.filter((p) => p.featured).length,
      href: "/admin/places",
    },
    {
      label: "Stories",
      value: stats.storiesTotal || stories.length,
      href: "/admin/stories",
    },
    {
      label: "Stories pending",
      value:
        stats.storiesPending || stories.filter((s) => !s.published).length,
      href: "/admin/stories",
    },
    {
      label: "Enquiries today",
      value: stats.bookingsToday,
      href: "/admin/enquiries",
    },
  ];

  const statusBars = (
    Object.entries(stats.bookingsByStatus) as [keyof typeof BOOKING_STATUS_COLORS, number][]
  ).filter(([, n]) => n > 0 || true);
  const maxStatus = Math.max(1, ...statusBars.map(([, n]) => n));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Panora Command Center
          </p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">Dashboard</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Live pulse across places, enquiries, and The Story Continues.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/places/new"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)]"
          >
            Add place
          </Link>
          <Link
            href="/admin/enquiries"
            className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:bg-[var(--glass)]"
          >
            Review enquiries
          </Link>
        </div>
      </div>

      {!hasLiveData && (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--glass)] px-4 py-3 text-sm text-muted">
          No live Supabase rows yet — sign in as an admin with{" "}
          <code className="text-[var(--accent)]">profiles.role = admin</code> and
          run migrations <code>001</code>–<code>004</code>. Empty modules stay
          honest until data arrives.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow)] backdrop-blur-xl transition hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {card.label}
            </p>
            <p className="mt-3 font-display text-4xl text-[var(--foreground)] group-hover:text-[var(--accent)]">
              <AnimatedCounter value={card.value} />
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow)] backdrop-blur-xl lg:col-span-3">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">Enquiry status</h2>
              <p className="text-sm text-muted">Bookings pipeline at a glance</p>
            </div>
            <Link
              href="/admin/enquiries"
              className="text-sm text-[var(--accent)] hover:opacity-80"
            >
              Open →
            </Link>
          </div>
          <div className="space-y-4">
            {statusBars.map(([status, count]) => {
              const meta = BOOKING_STATUS_COLORS[status];
              return (
                <div key={status}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                    <span className="tabular-nums text-muted">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all"
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow)] backdrop-blur-xl lg:col-span-2">
          <h2 className="font-display text-2xl">Newest place</h2>
          {stats.newestPlace ? (
            <div className="mt-4">
              <Link
                href={`/admin/places/${stats.newestPlace.id}`}
                className="font-medium hover:text-[var(--accent)]"
              >
                {stats.newestPlace.name}
              </Link>
              <p className="mt-1 text-sm text-muted">/{stats.newestPlace.slug}</p>
              <Link
                href={`/panoras/${stats.newestPlace.slug}`}
                className="mt-4 inline-block text-sm text-[var(--accent)]"
              >
                Preview public page →
              </Link>
            </div>
          ) : places[0] ? (
            <div className="mt-4">
              <Link
                href={`/admin/places/${places[0].id}`}
                className="font-medium hover:text-[var(--accent)]"
              >
                {places[0].name}
              </Link>
              <p className="mt-1 text-sm text-muted">{places[0].city}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">No places yet.</p>
          )}
        </section>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow)] backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl">Recent activity</h2>
        </div>
        {stats.recentActivity.length === 0 ? (
          <p className="text-sm text-muted">
            Activity appears here once bookings or admin actions land in Supabase.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {stats.recentActivity.map((item) => {
              const href =
                "href" in item && typeof item.href === "string"
                  ? item.href
                  : undefined;
              return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                {href ? (
                  <Link
                    href={href}
                    className="text-sm hover:text-[var(--accent)]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <p className="text-sm">{item.label}</p>
                )}
                <p className="text-xs text-muted">
                  {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
                </p>
              </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
