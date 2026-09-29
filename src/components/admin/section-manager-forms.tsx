"use client";

import {
  createSection,
  deleteSection,
  type ActionResult,
} from "@/lib/admin/actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

const SECTION_TYPES = [
  "grid",
  "featured",
  "hero",
  "list",
  "cta",
  "testimonial",
  "about",
] as const;

export function CreateSectionForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  return (
    <form
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-4 sm:flex-row sm:items-end"
      action={(formData) => {
        startTransition(async () => {
          const next = await createSection(formData);
          setResult(next);
          if (next.ok) router.refresh();
        });
      }}
    >
      <label className="min-w-0 flex-1 space-y-1.5">
        <span className="text-xs text-muted">New section</span>
        <input
          name="title"
          required
          placeholder="Section name"
          className={field}
        />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs text-muted">Type</span>
        <select name="sectionType" defaultValue="grid" className={field}>
          {SECTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add section"}
      </button>
      {result ? (
        <p
          className={`w-full text-sm sm:basis-full ${result.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
        >
          {result.ok ? result.message : result.error}
        </p>
      ) : null}
    </form>
  );
}

export function DeleteSectionButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-full border border-[var(--danger)]/40 px-4 py-2 text-sm text-[var(--danger)] disabled:opacity-60"
      onClick={() => {
        const confirmed = window.confirm(
          `Delete “${title}”? Places stay published, but they will leave this section.`,
        );
        if (!confirmed) return;
        const formData = new FormData();
        formData.set("id", id);
        startTransition(async () => {
          await deleteSection(formData);
          router.refresh();
        });
      }}
    >
      {pending ? "Deleting…" : "Delete section"}
    </button>
  );
}
