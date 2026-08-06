import {
  deleteStory,
  getAdminStories,
  setStoryPublished,
} from "@/lib/admin/actions";
import { SEED_PLACES, SEED_STORIES } from "@/data/seed-places";
import { formatDistanceToNow } from "date-fns";

export const metadata = {
  title: "Admin · Stories",
};

export default async function AdminStoriesPage() {
  const fetched = await getAdminStories();
  const stories =
    fetched.length > 0
      ? fetched
      : SEED_STORIES.map((story) => ({
          ...story,
          placeName:
            SEED_PLACES.find((p) => p.id === story.placeId)?.name ?? "Unknown",
        }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Experience stories</h1>
        <p className="mt-1 text-sm text-muted">
          Moderate guest comments — publish or remove.
        </p>
      </div>

      {fetched.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-4 py-3 text-sm text-muted">
          Showing seed stories — connect Supabase to moderate live submissions.
        </p>
      )}

      <ul className="space-y-4">
        {stories.map((story) => (
          <li
            key={story.id}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{story.authorName}</p>
                <p className="text-xs text-muted">
                  {story.placeName ?? "Place"} ·{" "}
                  {formatDistanceToNow(new Date(story.createdAt), {
                    addSuffix: true,
                  })}{" "}
                  · {story.published ? "Published" : "Pending"} ·{" "}
                  {story.likesCount} likes
                </p>
              </div>
              {fetched.length > 0 && (
                <div className="flex gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await setStoryPublished(story.id, !story.published);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--glass)]"
                    >
                      {story.published ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await deleteStory(story.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-[var(--danger)]/40 px-3 py-1 text-xs text-[var(--danger)]"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed">{story.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
