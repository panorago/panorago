"use client";

import { setPlacePublished } from "@/lib/admin/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function PlacePublishBar({
  id,
  slug,
  published,
  placeName,
}: {
  id: string;
  slug: string;
  published: boolean;
  placeName: string;
}) {
  const router = useRouter();
  const [live, setLive] = useState(published);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function push(next: boolean) {
    setError(null);
    const previous = live;
    setLive(next);
    startTransition(async () => {
      const result = await setPlacePublished(id, next);
      if (!result.ok) {
        setLive(previous);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-3 shadow-[var(--shadow)]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          {live ? "Live on the site" : "Draft preview"}
        </p>
        <p className="text-sm">
          {live
            ? `${placeName} is visible on the public site.`
            : `${placeName} is hidden until you push it.`}
        </p>
        {error ? (
          <p className="mt-1 text-sm text-[var(--danger)]">{error}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/places/${id}`}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--glass)]"
        >
          Edit
        </Link>
        <Link
          href={`/preview/places/${id}`}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--glass)]"
        >
          Preview
        </Link>
        {live ? (
          <a
            href={`/panoras/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--glass)]"
          >
            View live
          </a>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => push(!live)}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
        >
          {pending ? "Saving…" : live ? "Unpublish" : "Push to site"}
        </button>
      </div>
    </div>
  );
}
