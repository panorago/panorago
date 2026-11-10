"use client";

import type { WeekStory, WeekStoryComment } from "@/lib/stories/week-stories";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

const SEEN_KEY = "panora-week-story-seen";

function readSeen(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function WeekStoriesRail({ stories }: { stories: WeekStory[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [seen, setSeen] = useState<string[]>([]);

  useEffect(() => {
    setSeen(readSeen());
  }, []);

  if (stories.length === 0) return null;
  const active = openIndex == null ? null : stories[openIndex];

  function open(index: number) {
    setOpenIndex(index);
    const id = stories[index]?.id;
    if (!id) return;
    const next = [...new Set([...readSeen(), id])].slice(-80);
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    setSeen(next);
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
        {stories.map((story, index) => {
          const viewed = seen.includes(story.id);
          return (
            <button
              key={story.id}
              type="button"
              onClick={() => open(index)}
              className="flex w-[4.75rem] shrink-0 flex-col items-center gap-2 text-center"
            >
              <span
                className={cn(
                  "grid h-16 w-16 place-items-center rounded-full p-[2px]",
                  viewed
                    ? "bg-[var(--border)]"
                    : "bg-[linear-gradient(135deg,var(--brand-gold),#fff4d2)]",
                )}
              >
                <span className="h-full w-full overflow-hidden rounded-full border-2 border-[var(--background)] bg-[var(--brand-navy)]">
                  {story.imageUrl ? (
                    // User-uploaded media lives on storage hosts that vary by project.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={story.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[10px] text-white">
                      New
                    </span>
                  )}
                </span>
              </span>
              <span className="line-clamp-2 text-[11px] leading-tight text-[var(--foreground)]">
                {story.title}
              </span>
            </button>
          );
        })}
      </div>
      {active && openIndex != null ? (
        <StoryViewer
          story={active}
          hasPrev={openIndex > 0}
          hasNext={openIndex < stories.length - 1}
          onClose={() => setOpenIndex(null)}
          onPrev={() => open(openIndex - 1)}
          onNext={() => open(openIndex + 1)}
        />
      ) : null}
    </>
  );
}

function StoryViewer({
  story,
  hasPrev,
  hasNext,
  onClose,
  onPrev,
  onNext,
}: {
  story: WeekStory;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [comments, setComments] = useState<WeekStoryComment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && hasNext) onNext();
      if (event.key === "ArrowLeft" && hasPrev) onPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [hasNext, hasPrev, onClose, onNext, onPrev]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch(`/api/week-stories/${story.id}/comments`);
      if (!response.ok) return;
      const payload = (await response.json()) as { comments?: WeekStoryComment[] };
      if (!cancelled) setComments(payload.comments ?? []);
    }
    void load();
    const timer = window.setInterval(() => void load(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [story.id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/week-stories/${story.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: name, body, company: "" }),
      });
      const payload = (await response.json()) as {
        comment?: WeekStoryComment;
        error?: string;
      };
      if (!response.ok || !payload.comment) {
        setError(payload.error || "Could not post that comment.");
        return;
      }
      setComments((current) => [...current, payload.comment!]);
      setBody("");
    } catch {
      setError("Could not post that comment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-[var(--brand-navy)] text-white">
      <div
        className="mx-auto flex h-full max-w-lg flex-col"
        onPointerDown={(event) => {
          startX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (startX.current == null) return;
          const delta = event.clientX - startX.current;
          startX.current = null;
          if (delta > 70 && hasPrev) onPrev();
          if (delta < -70 && hasNext) onNext();
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{story.title}</p>
            {story.category ? (
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--brand-gold)]">
                {story.category}
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close story" className="p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative min-h-0 flex-1 bg-black">
          {story.videoUrl ? (
            <video
              key={story.videoUrl}
              src={story.videoUrl}
              className="h-full w-full object-contain"
              controls
              playsInline
              poster={story.imageUrl ?? undefined}
            />
          ) : story.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.imageUrl} alt="" className="h-full w-full object-contain" />
          ) : null}
          {hasPrev ? (
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous story"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 sm:block"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}
          {hasNext ? (
            <button
              type="button"
              onClick={onNext}
              aria-label="Next story"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 sm:block"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/80 to-transparent p-4">
            {story.placeName && story.placeSlug ? (
              <Link
                href={`/panoras/${story.placeSlug}`}
                className="pointer-events-auto text-sm font-medium text-[var(--brand-gold)]"
              >
                {story.placeName}
              </Link>
            ) : null}
            {story.caption ? <p className="text-sm leading-relaxed">{story.caption}</p> : null}
            {comments.slice(-2).map((comment) => (
              <p key={comment.id} className="text-sm">
                <span className="font-medium text-[var(--brand-gold)]">{comment.authorName}</span>{" "}
                {comment.body}
              </p>
            ))}
          </div>
        </div>
        <form onSubmit={submit} className="space-y-2 border-t border-white/10 px-4 py-3">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              maxLength={40}
              className="w-28 rounded-full bg-white/10 px-3 py-2 text-sm outline-none"
            />
            <input
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Comment on this"
              maxLength={280}
              className="min-w-0 flex-1 rounded-full bg-white/10 px-3 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[var(--brand-gold)] px-3 py-2 text-xs font-semibold text-[var(--brand-navy)] disabled:opacity-60"
            >
              Send
            </button>
          </div>
          {error ? <p className="text-xs text-red-200">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}
