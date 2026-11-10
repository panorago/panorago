"use client";

import dynamic from "next/dynamic";
import { MediaDropzone } from "@/components/admin/media-dropzone";
import { Button } from "@/components/ui/button";
import type { Place, PricingItem } from "@/types";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";

const LocationMapPicker = dynamic(
  () =>
    import("@/components/admin/location-map-picker").then((m) => ({
      default: m.LocationMapPicker,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)]" />
    ),
  },
);

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

const FORM_STEPS = [
  ["basics", "Basics"],
  ["photos", "Photos"],
  ["location", "Location"],
  ["story", "Story"],
  ["details", "Details"],
  ["amenities", "Amenities"],
  ["search", "Search"],
  ["contact", "Contact"],
  ["publishing", "Publishing"],
] as const;

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-elevated)] p-5"
    >
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
  sectionChoices?: { key: string; title: string }[];
}

export function PlaceForm({
  place,
  action,
  submitLabel,
  sectionChoices,
}: PlaceFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploadsBusy, setUploadsBusy] = useState(0);

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
  const nameRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);

  const initialOther = place?.amenities.other?.join(", ") ?? "";
  const [otherAmenities, setOtherAmenities] = useState(initialOther);
  const [showOtherAmenities, setShowOtherAmenities] = useState(
    Boolean(initialOther.trim()),
  );

  function onUploadBusy(busy: boolean) {
    setUploadsBusy((count) => Math.max(0, count + (busy ? 1 : -1)));
  }

  function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    if (uploadsBusy > 0) {
      setError("Wait for the photos to finish uploading, then save.");
      return;
    }
    startTransition(async () => {
      try {
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
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not save this place.";
        setError(
          /body exceeded|1 mb|413/i.test(message)
            ? "The form was too large to save. Upload photos in the dropzones instead of pasting image data."
            : message,
        );
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <nav className="sticky top-0 z-20 -mx-1 flex gap-2 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-elevated)]/95 px-3 py-2 backdrop-blur">
        {FORM_STEPS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:bg-[var(--accent)]/10 hover:text-[var(--foreground)]"
          >
            {label}
          </a>
        ))}
      </nav>
      <Section
        id="basics"
        title="Basics"
        subtitle="Identity and category shown across Discover, map, and SmartShare."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted">Name</span>
            <input
              ref={nameRef}
              name="name"
              required
              defaultValue={place?.name}
              className={field}
            />
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
        id="photos"
        title="Hero"
        subtitle="Full-bleed image at the top of the public place page. Drop a phone photo — it is resized and stored before you save."
      >
        <MediaDropzone
          onBusyChange={onUploadBusy}
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
          onBusyChange={onUploadBusy}
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
            setVideoUrl(next);
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
          onBusyChange={onUploadBusy}
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
          onBusyChange={onUploadBusy}
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
        id="location"
        title="Location"
        subtitle="Address fields plus map pin for directions and SmartShare maps."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Location / area</span>
            <input
              ref={locationRef}
              name="location"
              required
              defaultValue={place?.location}
              className={field}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">City</span>
            <input
              ref={cityRef}
              name="city"
              required
              defaultValue={place?.city}
              className={field}
            />
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
          onPlacePicked={(picked) => {
            if (nameRef.current && !nameRef.current.value.trim() && picked.name) {
              nameRef.current.value = picked.name;
            }
            if (locationRef.current && picked.address) {
              locationRef.current.value = picked.address;
            }
            if (cityRef.current && picked.city && !cityRef.current.value.trim()) {
              cityRef.current.value = picked.city;
            }
          }}
        />
      </Section>

      <Section id="story" title="Story" subtitle="Long-form atmosphere copy on the place page.">
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
            rows={4}
            defaultValue={place?.panoraNotes}
            className={field}
          />
        </label>
      </Section>

      <Section id="details" title="Highlights" subtitle="Insider details in the highlights panel.">
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
        id="amenities"
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

      <Section
        id="search"
        title="Search"
        subtitle="Words guests type, plus one sentence for AI search. Saved with the place."
      >
        <div className="grid gap-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">
              Search tags (comma or newline)
            </span>
            <p className="text-xs text-muted">
              Mood and style. e.g. outdoor, romantic, scenic, quiet, family, luxury
            </p>
            <textarea
              name="tags"
              rows={2}
              defaultValue={place?.highlights.searchTags?.join(", ") ?? place?.tags?.join(", ") ?? ""}
              className={field}
              placeholder="outdoor, romantic, scenic"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">
              Search keywords (comma or newline)
            </span>
            <p className="text-xs text-muted">
              Words someone might type. e.g. BBQ, fire, swim, caves, boat, coffee
            </p>
            <textarea
              name="searchKeywords"
              rows={2}
              defaultValue={
                place?.highlights.searchKeywords?.join(", ") ??
                place?.searchKeywords?.join(", ") ??
                ""
              }
              className={field}
              placeholder="BBQ, fire, swim"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">
              Occasions (comma or newline)
            </span>
            <p className="text-xs text-muted">
              e.g. date night, anniversary, family outing, business, weekend away
            </p>
            <textarea
              name="occasions"
              rows={2}
              defaultValue={
                place?.highlights.searchOccasions?.join(", ") ??
                place?.occasions?.join(", ") ??
                ""
              }
              className={field}
              placeholder="date night, anniversary"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">
              AI search summary
            </span>
            <p className="text-xs text-muted">
              One plain sentence. e.g. Outdoor braai garden in Chinhoyi — woodsmoke, open fires, maize roasting
            </p>
            <textarea
              name="summary"
              rows={2}
              maxLength={200}
              defaultValue={place?.highlights.searchSummary ?? place?.summary ?? ""}
              className={field}
              placeholder="One sentence describing this place for AI search"
            />
          </label>
        </div>
      </Section>

      <Section id="contact" title="Contact">
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

      <Section id="publishing" title="Publishing & SEO">
        <div className="grid gap-4 md:grid-cols-2">
          <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-xs font-medium text-muted">
              Homepage sections
            </legend>
            <div className="flex flex-wrap gap-2">
              {(
                sectionChoices?.length
                  ? sectionChoices
                  : SECTION_KEYS.map((key) => ({ key, title: key }))
              ).map((section) => (
                <label
                  key={section.key}
                  className="flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    name="homepageSections"
                    value={section.key}
                    defaultChecked={place?.homepageSections.includes(section.key)}
                  />
                  {section.title}
                </label>
              ))}
            </div>
          </fieldset>
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

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-elevated)]/95 px-4 py-3 shadow-[var(--shadow)] backdrop-blur">
        <div className="min-w-0 text-sm">
          {error ? (
            <p className="text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : message ? (
            <p className="text-[var(--success)]">{message}</p>
          ) : uploadsBusy > 0 ? (
            <p className="text-muted">Uploading photos… save unlocks when they finish.</p>
          ) : !heroImage ? (
            <p className="text-muted">A hero photo is required before this listing can be saved.</p>
          ) : (
            <p className="text-muted">Name, story, and hero photo are kept with every other field you fill in.</p>
          )}
        </div>
        <Button
          type="submit"
          variant="accent"
          disabled={pending || uploadsBusy > 0}
          className="rounded-full"
        >
          {pending ? "Saving…" : uploadsBusy > 0 ? "Uploading…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
