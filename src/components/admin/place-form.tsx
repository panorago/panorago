"use client";

import { Button } from "@/components/ui/button";
import type { Place } from "@/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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

const SECTION_KEYS = [
  "trending",
  "new_discoveries",
  "panora_picks",
  "weekend_escape",
  "editors_choice",
] as const;

const AMENITY_TOGGLES: { key: keyof Place["amenities"]; label: string }[] = [
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
];

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

interface PlaceFormProps {
  place?: Place;
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string; id?: string; message?: string }>;
  submitLabel: string;
}

export function PlaceForm({ place, action, submitLabel }: PlaceFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setMessage(result.message ?? "Saved.");
      if (result.id) {
        router.push(`/admin/places/${result.id}`);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium text-muted">Name</span>
          <input name="name" required defaultValue={place?.name} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Slug</span>
          <input name="slug" defaultValue={place?.slug} className={field} placeholder="auto from name" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Category</span>
          <select name="category" defaultValue={place?.category ?? "dining"} className={field}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Location</span>
          <input name="location" required defaultValue={place?.location} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">City</span>
          <input name="city" required defaultValue={place?.city} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Country</span>
          <input name="country" defaultValue={place?.country ?? "Zimbabwe"} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Price guide</span>
          <input name="priceGuide" defaultValue={place?.priceGuide} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Distance (km)</span>
          <input
            name="distanceKm"
            type="number"
            step="0.1"
            defaultValue={place?.distanceKm ?? ""}
            className={field}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Latitude</span>
          <input name="latitude" type="number" step="any" defaultValue={place?.latitude ?? ""} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Longitude</span>
          <input name="longitude" type="number" step="any" defaultValue={place?.longitude ?? ""} className={field} />
        </label>
      </section>

      <section className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Story</span>
          <textarea name="story" required rows={6} defaultValue={place?.story} className={field} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Panora notes</span>
          <textarea name="panoraNotes" required rows={4} defaultValue={place?.panoraNotes} className={field} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Mood tags (comma or newline)</span>
          <textarea
            name="mood"
            rows={2}
            defaultValue={place?.mood.join(", ")}
            className={field}
            placeholder="Date Night, Golden Hour"
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Golden hour</span>
          <input name="goldenHour" defaultValue={place?.highlights.goldenHour ?? ""} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Best time</span>
          <input name="bestTime" defaultValue={place?.highlights.bestTime ?? ""} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Dress vibe</span>
          <input name="dressVibe" defaultValue={place?.highlights.dressVibe ?? ""} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Noise level</span>
          <input name="noiseLevel" defaultValue={place?.highlights.noiseLevel ?? ""} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Average spend</span>
          <input name="averageSpend" defaultValue={place?.highlights.averageSpend ?? ""} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Opening hours</span>
          <input name="openingHours" defaultValue={place?.highlights.openingHours ?? ""} className={field} />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium text-muted">Perfect for (comma/newline)</span>
          <textarea
            name="perfectFor"
            rows={2}
            defaultValue={place?.highlights.perfectFor?.join(", ") ?? ""}
            className={field}
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium text-muted">Payment methods (comma/newline)</span>
          <textarea
            name="paymentMethods"
            rows={2}
            defaultValue={place?.highlights.paymentMethods?.join(", ") ?? ""}
            className={field}
          />
        </label>
      </section>

      <section>
        <p className="mb-3 text-xs font-medium text-muted">Amenities</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {AMENITY_TOGGLES.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name={key}
                defaultChecked={Boolean(place?.amenities[key])}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Phone signal</span>
            <select name="phoneSignal" defaultValue={place?.amenities.phoneSignal ?? ""} className={field}>
              <option value="">—</option>
              <option value="strong">strong</option>
              <option value="moderate">moderate</option>
              <option value="weak">weak</option>
              <option value="none">none</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Road condition</span>
            <select name="roadCondition" defaultValue={place?.amenities.roadCondition ?? ""} className={field}>
              <option value="">—</option>
              <option value="excellent">excellent</option>
              <option value="good">good</option>
              <option value="fair">fair</option>
              <option value="challenging">challenging</option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium text-muted">Hero image URL</span>
          <input name="heroImage" required defaultValue={place?.heroImage} className={field} />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium text-muted">Gallery URLs (one per line)</span>
          <textarea
            name="gallery"
            rows={4}
            defaultValue={place?.gallery.join("\n") ?? ""}
            className={field}
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {(
          [
            ["whatsapp", "WhatsApp"],
            ["phone", "Phone"],
            ["email", "Email"],
            ["website", "Website"],
            ["instagram", "Instagram"],
            ["facebook", "Facebook"],
            ["tiktok", "TikTok"],
            ["googleMapsUrl", "Google Maps URL"],
          ] as const
        ).map(([name, label]) => (
          <label key={name} className="space-y-1.5">
            <span className="text-xs font-medium text-muted">{label}</span>
            <input
              name={name}
              defaultValue={(place?.contact[name] as string | null | undefined) ?? ""}
              className={field}
            />
          </label>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium text-muted">
            Homepage sections (comma/newline)
          </span>
          <textarea
            name="homepageSections"
            rows={2}
            defaultValue={place?.homepageSections.join(", ") ?? ""}
            className={field}
            placeholder={SECTION_KEYS.join(", ")}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Meta title</span>
          <input name="metaTitle" defaultValue={place?.metaTitle ?? ""} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Meta description</span>
          <input name="metaDescription" defaultValue={place?.metaDescription ?? ""} className={field} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="verified" defaultChecked={place?.verified ?? true} />
          Panora Verified
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={place?.published ?? false} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={place?.featured ?? false} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="archived" defaultChecked={place?.archived ?? false} />
          Archived
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Paid listing tier</span>
          <select
            name="paidTier"
            defaultValue={place?.paidTier ?? "basic"}
            className={field}
          >
            <option value="basic">Basic</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Video URL</span>
          <input
            name="videoUrl"
            defaultValue={place?.videoUrl ?? ""}
            className={field}
            placeholder="mp4 or YouTube/Vimeo"
          />
        </label>
      </section>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {message && <p className="text-sm text-[var(--success)]">{message}</p>}

      <Button type="submit" variant="accent" disabled={pending} className="rounded-full">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
