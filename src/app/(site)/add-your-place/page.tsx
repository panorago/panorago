"use client";

import { Button } from "@/components/ui/button";
import { FormEvent, useState } from "react";

const CATEGORIES = [
  "dining",
  "escape",
  "nightlife",
  "wellness",
  "culture",
  "outdoors",
  "coffee",
  "weekend",
] as const;

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export default function AddYourPlacePage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/place-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitter_name: form.get("submitterName"),
          submitter_email: form.get("submitterEmail") || null,
          submitter_phone: form.get("submitterPhone") || null,
          place_name: form.get("placeName"),
          location: form.get("location") || "",
          city: form.get("city") || "Harare",
          country: form.get("country") || "Zimbabwe",
          category: form.get("category") || "dining",
          story: form.get("story") || "",
          website: form.get("website") || null,
          whatsapp: form.get("whatsapp") || null,
          hero_image: form.get("heroImage") || null,
          notes: form.get("notes") || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not submit. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please retry.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Received
        </p>
        <h1 className="mt-2 font-display text-4xl">Thank you</h1>
        <p className="mt-3 text-sm text-muted">
          Our editorial team will review your place. If approved, it enters as a
          draft for Panora Verified curation.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        Partners
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Add your place</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Submit a venue for Panora Go consideration. We review every submission
        before it appears publicly.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs text-muted">Your name</span>
            <input name="submitterName" required className={field} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-muted">Email</span>
            <input name="submitterEmail" type="email" className={field} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-muted">Phone / WhatsApp</span>
            <input name="submitterPhone" className={field} />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs text-muted">Place name</span>
            <input name="placeName" required className={field} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-muted">City</span>
            <input name="city" defaultValue="Harare" className={field} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-muted">Category</span>
            <select name="category" defaultValue="dining" className={field}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs text-muted">Location / address</span>
            <input name="location" className={field} />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs text-muted">Tell us the story</span>
            <textarea name="story" rows={5} required className={field} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-muted">Website</span>
            <input name="website" className={field} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-muted">WhatsApp for guests</span>
            <input name="whatsapp" className={field} />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs text-muted">Hero image URL (optional)</span>
            <input name="heroImage" className={field} />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs text-muted">Notes for Panora</span>
            <textarea name="notes" rows={3} className={field} />
          </label>
          <input type="hidden" name="country" value="Zimbabwe" />
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <Button type="submit" variant="accent" disabled={pending} className="rounded-full">
          {pending ? "Submitting…" : "Submit for review"}
        </Button>
      </form>
    </div>
  );
}
