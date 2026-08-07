import {
  deleteStory,
  getAdminStories,
  setStoryPublished,
} from "@/lib/admin/actions";
import { setStoryFlags } from "@/lib/admin/command";
import { formatDistanceToNow } from "date-fns";

export const metadata = {
  title: "Command Center · The Story Continues",
};

export default async function AdminStoriesPage() {
  const stories = await getAdminStories();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Community
        </p>
        <h1 className="mt-1 font-display text-4xl">The Story Continues</h1>
        <p className="mt-2 text-sm text-muted">
          Approve, pin, hide, or remove guest stories from the field.
        </p>
      </div>

      {stories.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--glass)] px-6 py-16 text-center">
          <p className="font-display text-2xl">No stories yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Guest submissions from place pages appear here once Supabase is
            connected.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {stories.map((story) => (
            <li
              key={story.id}
              className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow)] backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{story.authorName}</p>
                    {story.pinned && (
                      <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                        Pinned
                      </span>
                    )}
                    {story.reported && (
                      <span className="rounded-full bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--danger)]">
                        Reported
                      </span>
                    )}
                    <span
                      className={
                        story.published
                          ? "text-xs text-[var(--success)]"
                          : "text-xs text-muted"
                      }
                    >
                      {story.published ? "Live" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {story.placeName ?? "Place"} ·{" "}
                    {formatDistanceToNow(new Date(story.createdAt), {
                      addSuffix: true,
                    })}{" "}
                    · {story.likesCount} likes
                    {story.feeling ? ` · ${story.feeling}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
                      {story.published ? "Hide" : "Approve"}
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await setStoryFlags(story.id, {
                        pinned: !story.pinned,
                      });
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--glass)]"
                    >
                      {story.pinned ? "Unpin" : "Pin"}
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
              </div>
              <p className="long-form mt-3 text-sm leading-relaxed">{story.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
