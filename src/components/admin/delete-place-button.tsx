"use client";

import { deletePlace } from "@/lib/admin/actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeletePlaceButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (gone) return null;

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className="rounded-full border border-[var(--danger)]/40 px-3 py-1 text-xs text-[var(--danger)] disabled:opacity-60"
        onClick={() => {
          const confirmed = window.confirm(
            `Delete “${name}” from the database? The listing, its stories, and its place on the site will be removed.`,
          );
          if (!confirmed) return;
          setError(null);
          setGone(true);
          startTransition(async () => {
            const result = await deletePlace(id);
            if (!result.ok) {
              setGone(false);
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error ? <p className="max-w-48 text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
