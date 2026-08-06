import { getAnalyticsSummary, getDashboardStats } from "@/lib/admin/command";

export const metadata = {
  title: "Command Center · Analytics",
};

export default async function AdminAnalyticsPage() {
  const [analytics, stats] = await Promise.all([
    getAnalyticsSummary(),
    getDashboardStats(),
  ]);

  const derived = [
    { label: "Places (active)", value: stats.placesTotal },
    { label: "Published places", value: stats.placesPublished },
    { label: "Verified places", value: stats.placesVerified },
    { label: "Stories", value: stats.storiesTotal },
    { label: "Enquiries today", value: stats.bookingsToday },
    {
      label: "Pending enquiries",
      value: stats.bookingsByStatus.pending,
    },
    {
      label: "Confirmed enquiries",
      value: stats.bookingsByStatus.confirmed,
    },
  ];

  const eventEntries = Object.entries(analytics.byName).sort(
    (a, b) => b[1] - a[1],
  );
  const maxEvent = Math.max(1, ...eventEntries.map(([, n]) => n));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Insight
        </p>
        <h1 className="mt-1 font-display text-4xl">Analytics</h1>
        <p className="mt-2 text-sm text-muted">
          Best-effort view from bookings, places, stories, and optional{" "}
          <code>analytics_events</code>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {derived.map((row) => (
          <div
            key={row.label}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow)]"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              {row.label}
            </p>
            <p className="mt-2 font-display text-3xl">{row.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow)]">
        <h2 className="font-display text-2xl">First-party events (30 days)</h2>
        {!analytics.available || analytics.total === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No <code>analytics_events</code> rows yet. After migration 004, you
            can insert events from the public site. Until then, the cards above
            reflect operational data only — this is intentional, not a broken
            chart.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-muted">{analytics.total} events logged</p>
            {eventEntries.map(([name, count]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="text-muted">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${(count / maxEvent) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
