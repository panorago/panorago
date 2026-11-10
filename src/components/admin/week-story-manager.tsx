"use client";

import { MediaDropzone } from "@/components/admin/media-dropzone";
import {
  deleteWeekStory,
  deleteWeekStoryComment,
  listWeekStoryComments,
  saveWeekStory,
  type AdminWeekStory,
} from "@/lib/stories/week-story-actions";
import type { WeekStoryComment } from "@/lib/stories/week-stories";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

type PlaceOption = { id: string; name: string };

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]";

export function WeekStoryManager({
  stories,
  places,
  unavailable,
}: {
  stories: AdminWeekStory[];
  places: PlaceOption[];
  unavailable: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminWeekStory | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveWeekStory(formData);
      if (!result.ok) {
        setError(result.error);
        setMessage("");
        return;
      }
      setError("");
      setMessage(result.message ?? "Saved.");
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {unavailable ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3 text-sm text-muted">
          The story tables are not on this database yet. Run
          supabase/migrations/018_week_stories.sql in the Supabase SQL editor.
        </p>
      ) : null}
      <StoryForm
        key={editing?.id ?? "new"}
        story={editing}
        places={places}
        pending={pending}
        error={error}
        message={message}
        onSubmit={onSubmit}
        onCancel={() => setEditing(null)}
      />
      <ul className="space-y-3">
        {stories.map((story) => (
          <li
            key={story.id}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{story.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {story.published ? "Published" : "Unpublished"}
                  {story.category ? ` · ${story.category}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs"
                  onClick={() => setEditing(story)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs"
                  onClick={() => {
                    startTransition(async () => {
                      const result = await deleteWeekStory(story.id);
                      if (!result.ok) setError(result.error);
                      else router.refresh();
                    });
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            <CommentModeration storyId={story.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StoryForm({
  story,
  places,
  pending,
  error,
  message,
  onSubmit,
  onCancel,
}: {
  story: AdminWeekStory | null;
  places: PlaceOption[];
  pending: boolean;
  error: string;
  message: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const [imageUrl, setImageUrl] = useState(story?.imageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(story?.videoUrl ?? "");

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] p-4">
      <h2 className="font-display text-2xl">{story ? "Edit status" : "New status"}</h2>
      {story ? <input type="hidden" name="id" value={story.id} /> : null}
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted">Title</span>
        <input name="title" required defaultValue={story?.title} className={field} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted">Caption</span>
        <textarea name="caption" rows={3} defaultValue={story?.caption} className={field} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Category</span>
          <input name="category" defaultValue={story?.category} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Place</span>
          <select name="placeId" defaultValue={story?.placeId ?? ""} className={field}>
            <option value="">None</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Publish at</span>
          <input
            type="datetime-local"
            name="publishedAt"
            defaultValue={story?.publishedAt}
            className={field}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Expires at (optional)</span>
          <input
            type="datetime-local"
            name="expiresAt"
            defaultValue={story?.expiresAt}
            className={field}
          />
        </label>
      </div>
      <MediaDropzone
        label="Image"
        name="imageUrl"
        kind="gallery"
        value={imageUrl}
        onChange={(next) => setImageUrl(typeof next === "string" ? next : next[0] ?? "")}
      />
      <MediaDropzone
        label="Short video"
        hint="MP4 or WebM. Keep it short."
        name="videoUrl"
        kind="video"
        accept="video/mp4,video/webm"
        value={videoUrl}
        onChange={(next) => setVideoUrl(typeof next === "string" ? next : next[0] ?? "")}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={story?.published ?? true} />
        Published
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--brand-navy)] px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save status"}
        </button>
        {story ? (
          <button type="button" onClick={onCancel} className="px-3 py-2 text-sm">
            Cancel edit
          </button>
        ) : null}
      </div>
    </form>
  );
}

function CommentModeration({ storyId }: { storyId: string }) {
  const [comments, setComments] = useState<WeekStoryComment[] | null>(null);
  const [pending, startTransition] = useTransition();

  async function load() {
    setComments(await listWeekStoryComments(storyId));
  }

  return (
    <div className="mt-3">
      <button type="button" className="text-xs text-[var(--accent)]" onClick={() => void load()}>
        {comments ? "Refresh comments" : "Review comments"}
      </button>
      {comments && comments.length === 0 ? (
        <p className="mt-2 text-xs text-muted">No comments yet.</p>
      ) : null}
      <ul className="mt-2 space-y-2">
        {comments?.map((comment) => (
          <li key={comment.id} className="flex items-start justify-between gap-3 text-sm">
            <p>
              <span className="font-medium">{comment.authorName}: </span>
              {comment.body}
            </p>
            <button
              type="button"
              disabled={pending}
              className="shrink-0 text-xs text-muted"
              onClick={() => {
                startTransition(async () => {
                  await deleteWeekStoryComment(comment.id);
                  await load();
                });
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
