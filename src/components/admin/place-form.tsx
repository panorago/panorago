"use client";

import { LocationMapPicker } from "@/components/admin/location-map-picker";
import { MediaDropzone } from "@/components/admin/media-dropzone";
import { Button } from "@/components/ui/button";
import type { Place, PricingItem } from "@/types";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      <div>
        <h2 className="font-display text-xl text-[var(--foreground)]">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function pricingItemsToText(items: PricingItem[] | undefined) {
  if (!items?.length) return "";
  return items.map((i) => `${i.label}|${i.price}`).join("\n");
}

interface PlaceFormProps {
  place?: Place;
  action: (formData: FormData) => Promise<{
    ok: boolean;
    error?: string;
    id?: string;
    message?: string;
  }>;
  submitLabel: string;
}

export function PlaceForm({ place, action, submitLabel }: PlaceFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [heroImage, setHeroImage] = useState(place?.heroImage ?? "");
  const [gallery, setGallery] = useState<string[]>(place?.gallery ?? []);
  const [menuImages, setMenuImages] = useState<string[]>(
    place?.menuImageUrls ?? [],
  );
  const [videoUrl, setVideoUrl] = useState(place?.videoUrl ?? "");
  const [coords, setCoords] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({
    latitude: place?.latitude ?? null,
    longitude: place?.longitude ?? null,
  });

  const initialOther = place?.amenities.other?.join(", ") ?? "";
  const [otherAmenities, setOtherAmenities] = useState(initialOther);
  const [showOtherAmenities, setShowOtherAmenities] = useState(
    Boolean(initialOther.trim()),
  );

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
    <form action={onSubmit} className="space-y-6">
      <Section
        title="Basics"
        subtitle="Identity and category shown across Discover, map, and SmartShare."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted">Name</span>
            <input name="name" required defaultValue={place?.name} className={field} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Slug</span>
            <input
              name="slug"
              defaultValue={place?.slug}
              className={field}
              placeholder="auto from name"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">
              Category (suggestions or free text)
            </span>
            <input
              name="category"
              list="place-category-suggestions"
              required
              defaultValue={place?.category ?? "dining"}
              className={field}
              placeholder="dining, escape, farm stay…"
            />
            <datalist id="place-category-suggestions">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted">
              Mood tags (comma or newline)
            </span>
            <textarea
              name="mood"
              rows={2}
              defaultValue={place?.mood.join(", ")}
              className={field}
              placeholder="Date Night, Golden Hour"
            />
          </label>
        </div>
      </Section>

      <Section
        title="Hero"
        subtitle="Full-bleed image at the top of the public place page."
      >
        <MediaDropzone
          label="Hero image"
          hint="Shown behind the place name"
          name="heroImage"
          kind="hero"
          accept="image/*"
          value={heroImage}
          onChange={(v) => setHeroImage(typeof v === "string" ? v : v[0] ?? "")}
        />
      </Section>

      <Section
        title="Video"
        subtitle="Plays directly under the hero (before the gallery). Upload an mp4 or paste a YouTube/Vimeo URL."
      >
        <MediaDropzone
          label="Venue video file"
          hint="Optional — mp4/webm upload"
          kind="video"
          accept="video/*"
          includeHiddenField={false}
          value={
            videoUrl &&
            !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/i.test(
              videoUrl,
            )
              ? videoUrl
              : ""
          }
          onChange={(v) => {
            const next = typeof v === "string" ? v : (v[0] ?? "");
            if (next) setVideoUrl(next);
          }}
        />
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">
            Video URL (YouTube, Vimeo, or direct mp4)
          </span>
          <input
            name="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className={field}
            placeholder="https://youtube.com/… or https://….mp4"
          />
        </label>
        <p className="text-[11px] text-muted">
          Public page order: Hero → Video → Gallery → Story → Pricing / Menu sneak peek.
        </p>
      </Section>

      <Section
        title="Gallery"
        subtitle="Photo grid on the place page (after video). Not the same as menu photos."
      >
        <MediaDropzone
          label="Gallery images"
          hint="Atmosphere, interiors, views — multi upload"
          name="gallery"
          kind="gallery"
          accept="image/*"
          multiple
          value={gallery}
          onChange={(v) => setGallery(Array.isArray(v) ? v : v ? [v] : [])}
        />
      </Section>

      <Section
        title="Menu sneak peek"
        subtitle="Menu / price-list photos shown in the Pricing sneak peek section (not the main gallery)."
      >
        <MediaDropzone
          label="Menu images"
          hint="Photos of menus, boards, or rate cards"
          name="menuImageUrls"
          kind="menu"
          accept="image/*"
          multiple
          value={menuImages}
          onChange={(v) => setMenuImages(Array.isArray(v) ? v : v ? [v] : [])}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Price guide</span>
            <input
              name="priceGuide"
              defaultValue={place?.priceGuide}
              className={field}
              placeholder="$12–22 pp"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Average spend</span>
            <input
              name="averageSpend"
              defaultValue={place?.highlights.averageSpend ?? ""}
              className={field}
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted">
              Pricing rows (one per line: Label|Price)
            </span>
            <textarea
              name="pricingItems"
              rows={3}
              defaultValue={pricingItemsToText(place?.pricingItems)}
              className={field}
              placeholder={"Starter|$8\nMain|$22"}
            />
          </label>
        </div>
      </Section>

      <Section
        title="Location"
        subtitle="Address fields plus map pin for directions and SmartShare maps."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Location / area</span>
            <input
              name="location"
              required
              defaultValue={place?.location}
              className={field}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">City</span>
            <input name="city" required defaultValue={place?.city} className={field} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Country</span>
            <input
              name="country"
              defaultValue={place?.country ?? "Zimbabwe"}
              className={field}
            />
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
        </div>
        <LocationMapPicker
          latitude={coords.latitude}
          longitude={coords.longitude}
          onChange={({ latitude, longitude }) =>
            setCoords({ latitude, longitude })
          }
        />
      </Section>

      <Section title="Story" subtitle="Long-form atmosphere copy on the place page.">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Story</span>
          <textarea
            name="story"
            required
            rows={6}
            defaultValue={place?.story}
            className={field}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Panora notes</span>
          <textarea
            name="panoraNotes"
            required
            rows={4}
            defaultValue={place?.panoraNotes}
            className={field}
          />
        </label>
      </Section>

      <Section title="Highlights" subtitle="Insider details in the highlights panel.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Golden hour</span>
            <input
              name="goldenHour"
              defaultValue={place?.highlights.goldenHour ?? ""}
              className={field}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Best time</span>
            <input
              name="bestTime"
              defaultValue={place?.highlights.bestTime ?? ""}
              className={field}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Dress vibe</span>
            <input
              name="dressVibe"
              defaultValue={place?.highlights.dressVibe ?? ""}
              className={field}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Noise level</span>
            <input
              name="noiseLevel"
              defaultValue={place?.highlights.noiseLevel ?? ""}
              className={field}
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted">Opening hours</span>
            <input
              name="openingHours"
              defaultValue={place?.highlights.openingHours ?? ""}
              className={field}
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted">
              Perfect for (comma/newline)
            </span>
            <textarea
              name="perfectFor"
              rows={2}
              defaultValue={place?.highlights.perfectFor?.join(", ") ?? ""}
              className={field}
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted">
              Payment methods (comma/newline)
            </span>
            <textarea
              name="paymentMethods"
              rows={2}
              defaultValue={place?.highlights.paymentMethods?.join(", ") ?? ""}
              className={field}
            />
          </label>
        </div>
      </Section>

      <Section
        title="Amenities"
        subtitle="Tick common amenities, or add custom ones under Other."
      >
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
          <label className="mt-3 block space-y-1.5">
            <span className="text-xs font-medium text-muted">
              Other amenities (comma or newline)
            </span>
            <textarea
              name="otherAmenities"
              rows={2}
              value={otherAmenities}
              onChange={(e) => setOtherAmenities(e.target.value)}
              className={field}
              placeholder="Braai area, Day beds, Private chef…"
            />
          </label>
        ) : (
          <input type="hidden" name="otherAmenities" value="" />
        )}
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Phone signal</span>
            <select
              name="phoneSignal"
              defaultValue={place?.amenities.phoneSignal ?? ""}
              className={field}
            >
              <option value="">—</option>
              <option value="strong">strong</option>
              <option value="moderate">moderate</option>
              <option value="weak">weak</option>
              <option value="none">none</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Road condition</span>
            <select
              name="roadCondition"
              defaultValue={place?.amenities.roadCondition ?? ""}
              className={field}
            >
              <option value="">—</option>
              <option value="excellent">excellent</option>
              <option value="good">good</option>
              <option value="fair">fair</option>
              <option value="challenging">challenging</option>
            </select>
          </label>
        </div>
      </Section>

      <Section title="Contact">
        <div className="grid gap-4 md:grid-cols-2">
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
                defaultValue={
                  (place?.contact[name] as string | null | undefined) ?? ""
                }
                className={field}
              />
            </label>
          ))}
        </div>
      </Section>

      <Section title="Publishing & SEO">
        <div className="grid gap-4 md:grid-cols-2">
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
            <input
              name="metaTitle"
              defaultValue={place?.metaTitle ?? ""}
              className={field}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Meta description</span>
            <input
              name="metaDescription"
              defaultValue={place?.metaDescription ?? ""}
              className={field}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="verified"
              defaultChecked={place?.verified ?? true}
            />
            Panora Verified
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="published"
              defaultChecked={place?.published ?? false}
            />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={place?.featured ?? false}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="archived"
              defaultChecked={place?.archived ?? false}
            />
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
        </div>
      </Section>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {message && <p className="text-sm text-[var(--success)]">{message}</p>}

      <Button type="submit" variant="accent" disabled={pending} className="rounded-full">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
