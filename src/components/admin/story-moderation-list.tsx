"use client";

import { deleteStory, setStoryPublished } from "@/lib/admin/actions";
import { setStoryFlags } from "@/lib/admin/command";
import { formatDistanceToNow } from "date-fns";
import { useState, useTransition } from "react";

export type StoryModerationItem = {
  id: string;
  authorName: string;
  body: string;
  published: boolean;
  pinned?: boolean;
  reported?: boolean;
  placeName?: string;
  createdAt: string;
  likesCount: number;
  feeling?: string | null;
};

export function StoryModerationList({
  stories,
}: {
  stories: StoryModerationItem[];
}) {
  const [items, setItems] = useState(stories);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function patch(id: string, next: Partial<StoryModerationItem>) {
    setItems((current) =>
      current.map((story) => (story.id === id ? { ...story, ...next } : story)),
    );
  }

  function run(
    id: string,
    optimistic: () => void,
    revert: () => void,
    action: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    setError(null);
    optimistic();
    setPendingId(id);
    startTransition(async () => {
      const result = await action();
      setPendingId(null);
      if (!result.ok) {
        revert();
        setError(result.error ?? "Could not update that story.");
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--glass)] px-6 py-16 text-center">
        <p className="font-display text-2xl">No stories yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Guest comments from place pages appear here for approval.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--danger)]/40 px-4 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      <ul className="space-y-4">
        {items.map((story) => {
          const busy = pendingId === story.id;
          return (
            <li
              key={story.id}
              className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{story.authorName}</p>
                    {story.pinned ? (
                      <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                        Pinned
                      </span>
                    ) : null}
                    {story.reported ? (
                      <span className="rounded-full bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--danger)]">
                        Reported
                      </span>
                    ) : null}
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
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--glass)] disabled:opacity-60"
                    onClick={() => {
                      const published = story.published;
                      run(
                        story.id,
                        () => patch(story.id, { published: !published }),
                        () => patch(story.id, { published }),
                        () => setStoryPublished(story.id, !published),
                      );
                    }}
                  >
                    {story.published ? "Hide" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--glass)] disabled:opacity-60"
                    onClick={() => {
                      const pinned = Boolean(story.pinned);
                      run(
                        story.id,
                        () => patch(story.id, { pinned: !pinned }),
                        () => patch(story.id, { pinned }),
                        () => setStoryFlags(story.id, { pinned: !pinned }),
                      );
                    }}
                  >
                    {story.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-full border border-[var(--danger)]/40 px-3 py-1 text-xs text-[var(--danger)] disabled:opacity-60"
                    onClick={() => {
                      const confirmed = window.confirm(
                        "Delete this comment? It will leave the place page.",
                      );
                      if (!confirmed) return;
                      const snapshot = items;
                      run(
                        story.id,
                        () =>
                          setItems((current) =>
                            current.filter((item) => item.id !== story.id),
                          ),
                        () => setItems(snapshot),
                        () => deleteStory(story.id),
                      );
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="long-form mt-3 text-sm leading-relaxed">{story.body}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
