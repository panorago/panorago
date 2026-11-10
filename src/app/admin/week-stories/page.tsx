import { WeekStoryManager } from "@/components/admin/week-story-manager";
import { getAdminPlaces } from "@/lib/admin/actions";
import { listAdminWeekStories } from "@/lib/stories/week-story-actions";

export const metadata = {
  title: "Command Center · New This Week",
};

export default async function AdminWeekStoriesPage() {
  const [{ stories, unavailable }, places] = await Promise.all([
    listAdminWeekStories(),
    getAdminPlaces(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Homepage
        </p>
        <h1 className="mt-1 font-display text-4xl">New This Week</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Publish image or video statuses. They appear as stories on the public
          site and stay up until you unpublish them or the optional expiry date
          passes.
        </p>
      </div>
      <WeekStoryManager
        stories={stories}
        unavailable={unavailable}
        places={places.map((place) => ({ id: place.id, name: place.name }))}
      />
    </div>
  );
}
