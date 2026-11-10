"use client";

import { CollectionPlacePicker } from "@/components/admin/collection-place-picker";
import type { CollectionPlaceOption } from "@/components/admin/collection-place-picker";
import { DeleteSectionButton } from "@/components/admin/section-manager-forms";
import { updateSection, type ActionResult } from "@/lib/admin/actions";
import { isHeroLayoutKey } from "@/lib/home/hero-layout";
import type { HomepageSection } from "@/types";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

const HERO_VIBES = [
  "trending",
  "Golden Hour",
  "Date Night",
  "Hidden Escape",
  "Weekend Away",
  "Coffee Ritual",
  "Tonight",
] as const;

const SECTION_TYPES = [
  "grid",
  "featured",
  "hero",
  "list",
  "cta",
  "testimonial",
  "about",
] as const;

export function HomepageSectionForm({
  section,
  places,
}: {
  section: HomepageSection;
  places: CollectionPlaceOption[];
}) {
  const router = useRouter();
  const placeIds = useRef(section.placeIds);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("placeIds", placeIds.current.join("\n"));
    setResult(null);
    startTransition(async () => {
      const next = await updateSection(formData);
      setResult(next);
      if (next.ok) router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow)]"
    >
      <input type="hidden" name="id" value={section.id} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          {section.key}
          {section.sectionType ? ` · ${section.sectionType}` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={section.enabled}
            />
            Enabled
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save section"}
          </button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs text-muted">Title</span>
          <input name="title" defaultValue={section.title} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-muted">Sort order</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={section.sortOrder}
            className={field}
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs text-muted">Subtitle</span>
          <input
            name="subtitle"
            defaultValue={section.subtitle}
            className={field}
          />
        </label>
        {isHeroLayoutKey(section.key) ? (
          <>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Number of cards to show</span>
              <input
                type="number"
                name="cardLimit"
                min={1}
                max={6}
                defaultValue={section.cardLimit ?? 3}
                className={field}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Vibe filter</span>
              <select
                name="vibeFilter"
                defaultValue={section.vibeFilter ?? ""}
                className={field}
              >
                <option value="">Newest places</option>
                {HERO_VIBES.map((vibe) => (
                  <option key={vibe} value={vibe}>
                    {vibe}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        <label className="space-y-1.5">
          <span className="text-xs text-muted">Type</span>
          <select
            name="sectionType"
            defaultValue={section.sectionType ?? "grid"}
            className={field}
          >
            {SECTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2">
          <CollectionPlacePicker
            places={places}
            initialSelectedIds={section.placeIds}
            label="Places from your database"
            onSelectedChange={(ids) => {
              placeIds.current = ids;
            }}
          />
        </div>
      </div>
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save section"}
        </button>
        <DeleteSectionButton id={section.id} title={section.title} />
        {result ? (
          <p
            className={`text-sm ${result.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
          >
            {result.ok ? result.message ?? "Section saved." : result.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
