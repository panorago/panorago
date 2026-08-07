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

const AMENITY_OPTIONS = [
  { key: "power", label: "Power" },
  { key: "solar", label: "Solar" },
  { key: "borehole", label: "Borehole" },
  { key: "wifi", label: "Wi‑Fi" },
  { key: "starlink", label: "Starlink" },
  { key: "parking", label: "Parking" },
  { key: "security", label: "Security" },
  { key: "swimming", label: "Swimming" },
  { key: "fireplace", label: "Fireplace" },
  { key: "outdoorSeating", label: "Outdoor seating" },
  { key: "music", label: "Music" },
  { key: "photography", label: "Photography" },
  { key: "petFriendly", label: "Pet friendly" },
  { key: "kidFriendly", label: "Kid friendly" },
  { key: "wheelchairAccess", label: "Wheelchair access" },
] as const;

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export default function AddYourPlacePage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showOtherAmenities, setShowOtherAmenities] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);

    const amenities: Record<string, boolean | string[]> = {};
    for (const { key } of AMENITY_OPTIONS) {
      if (form.get(key) === "on") amenities[key] = true;
    }
    const otherRaw = String(form.get("otherAmenities") ?? "");
    const other = otherRaw
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (other.length) amenities.other = other;

    const gallery = String(form.get("galleryUrls") ?? "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

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
          phone: form.get("phone") || null,
          email: form.get("email") || null,
          instagram: form.get("instagram") || null,
          facebook: form.get("facebook") || null,
          google_maps_url: form.get("googleMapsUrl") || null,
          hero_image: form.get("heroImage") || null,
          gallery_urls: gallery,
          price_guide: form.get("priceGuide") || null,
          average_spend: form.get("averageSpend") || null,
          opening_hours: form.get("openingHours") || null,
          best_time: form.get("bestTime") || null,
          dress_vibe: form.get("dressVibe") || null,
          panora_notes: form.get("panoraNotes") || null,
          amenities,
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
      <div className="container-narrow py-24 text-center">
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
    <div className="container-narrow py-16 sm:py-24">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        Partners
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Add your place</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Share as much detail as you can — story, amenities, hours, contacts, and
        photos. We review every submission before it appears publicly.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-8">
        <section className="space-y-4">
          <h2 className="font-display text-2xl">About you</h2>
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
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl">The place</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs text-muted">Place name</span>
              <input name="placeName" required className={field} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">City</span>
              <input name="city" defaultValue="Harare" className={field} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">
                Category (suggestion or free text)
              </span>
              <input
                name="category"
                list="add-place-categories"
                defaultValue="dining"
                className={field}
                placeholder="dining, escape, farm stay…"
              />
              <datalist id="add-place-categories">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs text-muted">Location / address</span>
              <input name="location" className={field} />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs text-muted">Country</span>
              <input name="country" defaultValue="Zimbabwe" className={field} />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs text-muted">Tell us the story</span>
              <textarea name="story" rows={6} required className={field} />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs text-muted">
                Notes for Panora editors (optional)
              </span>
              <textarea name="panoraNotes" rows={3} className={field} />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl">Contacts</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs text-muted">WhatsApp for guests</span>
              <input name="whatsapp" className={field} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Phone</span>
              <input name="phone" className={field} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Public email</span>
              <input name="email" type="email" className={field} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Website</span>
              <input name="website" className={field} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Instagram</span>
              <input name="instagram" className={field} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Facebook</span>
              <input name="facebook" className={field} />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs text-muted">Google Maps URL</span>
              <input name="googleMapsUrl" className={field} />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl">Amenities</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AMENITY_OPTIONS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-sm"
              >
                <input type="checkbox" name={key} />
                {label}
              </label>
            ))}
            <label className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={showOtherAmenities}
                onChange={(e) => setShowOtherAmenities(e.target.checked)}
              />
              Other
            </label>
          </div>
          {showOtherAmenities ? (
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">
                Other amenities (comma or newline)
              </span>
              <textarea
                name="otherAmenities"
                rows={2}
                className={field}
                placeholder="Braai area, Day beds…"
              />
            </label>
          ) : null}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl">Pricing & hours</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Price guide</span>
              <input
                name="priceGuide"
                className={field}
                placeholder="$12–22 pp"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Average spend</span>
              <input name="averageSpend" className={field} />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs text-muted">Opening hours</span>
              <input
                name="openingHours"
                className={field}
                placeholder="Tue–Sun 10:00–22:00"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Best time to visit</span>
              <input name="bestTime" className={field} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Dress vibe</span>
              <input name="dressVibe" className={field} />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl">Photos</h2>
          <div className="grid gap-4">
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Hero image URL</span>
              <input
                name="heroImage"
                className={field}
                placeholder="https://…"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">
                Gallery image URLs (one per line)
              </span>
              <textarea
                name="galleryUrls"
                rows={3}
                className={field}
                placeholder={"https://…\nhttps://…"}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Anything else we should know?</span>
              <textarea name="notes" rows={3} className={field} />
            </label>
          </div>
        </section>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <Button
          type="submit"
          variant="accent"
          disabled={pending}
          className="rounded-full"
        >
          {pending ? "Submitting…" : "Submit for review"}
        </Button>
      </form>
    </div>
  );
}
