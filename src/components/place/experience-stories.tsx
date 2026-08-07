"use client";

import { Button } from "@/components/ui/button";
import {
  createStoryAction,
  toggleStoryLikeAction,
} from "@/lib/stories/actions";
import { fadeUp, staggerContainer } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";
import type { ExperienceStory } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { FormEvent, useEffect, useMemo, useOptimistic, useState, useTransition } from "react";

const VISITOR_KEY = "panora-go-visitor-key";
const LIKED_KEY = "panora-go-liked-stories";

function getVisitorKey() {
  if (typeof window === "undefined") return "ssr";
  let key = localStorage.getItem(VISITOR_KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, key);
  }
  return key;
}

function getLikedIds(): string[] {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function rememberLike(storyId: string) {
  const ids = new Set(getLikedIds());
  ids.add(storyId);
  localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
}

function forgetLike(storyId: string) {
  const ids = getLikedIds().filter((id) => id !== storyId);
  localStorage.setItem(LIKED_KEY, JSON.stringify(ids));
}

interface ExperienceStoriesProps {
  placeId: string;
  placeName: string;
  initialStories: ExperienceStory[];
}

export function ExperienceStories({
  placeId,
  placeName,
  initialStories,
}: ExperienceStoriesProps) {
  const prefersReduced = useReducedMotion();
  const [stories, setStories] = useState(initialStories);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [feeling, setFeeling] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [optimisticStories, addOptimisticStory] = useOptimistic(
    stories,
    (state, next: ExperienceStory) => [next, ...state],
  );

  useEffect(() => {
    setLiked(new Set(getLikedIds()));
  }, []);

  const visible = useMemo(
    () =>
      optimisticStories.filter(
        (story) => story.published || story.id.startsWith("local-") || story.id.startsWith("opt-"),
      ),
    [optimisticStories],
  );

  function handleLikeToggle(story: ExperienceStory) {
    const visitorKey = getVisitorKey();
    const wasLiked = liked.has(story.id);

    setLiked((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(story.id);
      else next.add(story.id);
      return next;
    });
    if (wasLiked) forgetLike(story.id);
    else rememberLike(story.id);

    setStories((prev) =>
      prev.map((item) =>
        item.id === story.id
          ? {
              ...item,
              likesCount: Math.max(
                0,
                item.likesCount + (wasLiked ? -1 : 1),
              ),
              likedByMe: !wasLiked,
            }
          : item,
      ),
    );

    startTransition(async () => {
      const result = await toggleStoryLikeAction(
        story.id,
        visitorKey,
        wasLiked,
      );
      setStories((prev) =>
        prev.map((item) =>
          item.id === story.id
            ? { ...item, likesCount: result.likesCount, likedByMe: result.liked }
            : item,
        ),
      );
      setLiked((prev) => {
        const next = new Set(prev);
        if (result.liked) next.add(story.id);
        else next.delete(story.id);
        return next;
      });
      if (result.liked) rememberLike(story.id);
      else forgetLike(story.id);
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);

    const feelingWord = feeling.trim().split(/\s+/)[0]?.slice(0, 40) || null;

    const optimistic: ExperienceStory = {
      id: `opt-${Date.now()}`,
      placeId,
      authorName: authorName.trim() || "Guest",
      body: body.trim(),
      likesCount: 0,
      published: true,
      createdAt: new Date().toISOString(),
      feeling: feelingWord,
    };

    startTransition(async () => {
      addOptimisticStory(optimistic);
      const result = await createStoryAction({
        placeId,
        authorName: optimistic.authorName,
        body: optimistic.body,
        feeling: feelingWord,
      });

      if (!result.ok) {
        setStatus(result.error);
        return;
      }

      setStories((prev) => [
        {
          ...result.story,
          published: true,
        },
        ...prev,
      ]);
      setAuthorName("");
      setBody("");
      setFeeling("");
      setStatus(
        result.pending
          ? "Thank you — your story is with us and will appear once reviewed."
          : "Your story is live. Thank you for sharing.",
      );
    });
  }

  const fieldClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          The Story Continues
        </p>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">
          Experiences at {placeName}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Real moments from guests — no star ratings, just stories worth
          reading before you go.
        </p>
      </div>

      <motion.ul
        className="space-y-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={prefersReduced ? undefined : staggerContainer}
      >
        {visible.length === 0 && (
          <li className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-6 py-10 text-center text-sm text-muted">
            Be the first to leave a story from this place.
          </li>
        )}
        {visible.map((story) => (
          <motion.li
            key={story.id}
            variants={prefersReduced ? undefined : fadeUp}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--glass)] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{story.authorName}</p>
                  {story.feeling ? (
                    <span className="rounded-full border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2.5 py-0.5 text-[11px] font-medium capitalize text-[var(--accent)]">
                      {story.feeling}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDistanceToNow(new Date(story.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLikeToggle(story)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm transition hover:border-[var(--accent)]",
                  liked.has(story.id) && "border-[var(--accent)] text-[var(--accent)]",
                )}
                aria-pressed={liked.has(story.id)}
                aria-label={
                  liked.has(story.id) ? "Unlike this story" : "Like this story"
                }
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5",
                    liked.has(story.id) && "fill-[var(--accent)]",
                  )}
                />
                {story.likesCount}
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]">
              {story.body}
            </p>
          </motion.li>
        ))}
      </motion.ul>

      <form
        onSubmit={handleSubmit}
        className="surface-card space-y-3 rounded-[var(--radius-lg)] p-5"
      >
        <h3 className="font-display text-xl">Share your experience</h3>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Your name</span>
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
            maxLength={60}
            placeholder="First name or initials"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">
            One word feeling{" "}
            <span className="font-normal opacity-70">(optional)</span>
          </span>
          <input
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            maxLength={40}
            placeholder="peaceful, joyful, awestruck…"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Your story</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
            maxLength={1200}
            placeholder="What made this place unforgettable?"
            className={`${fieldClass} resize-y`}
          />
        </label>
        {status && <p className="text-sm text-muted">{status}</p>}
        <Button type="submit" variant="accent" disabled={pending} className="rounded-full">
          {pending ? "Sending…" : "Add your story"}
        </Button>
      </form>
    </section>
  );
}
