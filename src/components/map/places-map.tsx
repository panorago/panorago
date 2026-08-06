"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MapPin, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProgressiveImage } from "@/components/media/progressive-image";
import { loadGoogleMaps } from "@/lib/maps/load-google-maps";
import {
  getMapsApiKey,
  PANORA_MAP_STYLES,
  panoraMarkerIconUrl,
} from "@/lib/maps/panora-map";
import { cn, formatPriceGuide } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";
import type { Place } from "@/types";

const REGIONS = [
  "All",
  "Chinhoyi",
  "Kariba",
  "Victoria Falls",
] as const;

type Region = (typeof REGIONS)[number];

const DEFAULT_REGION: Region = "Chinhoyi";

function matchesRegion(place: Place, region: Region) {
  if (region === "All") return true;
  const city = place.city.toLowerCase();
  if (region === "Victoria Falls") {
    return city.includes("victoria") || city.includes("falls");
  }
  return city.includes(region.toLowerCase());
}

type PlacesMapProps = {
  places: Place[];
};

export function PlacesMap({ places }: PlacesMapProps) {
  const reduceMotion = useReducedMotion();
  const apiKey = getMapsApiKey();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapFailed, setMapFailed] = useState(false);

  const filtered = useMemo(
    () =>
      places.filter(
        (place) =>
          place.latitude != null &&
          place.longitude != null &&
          matchesRegion(place, region),
      ),
    [places, region],
  );

  const selected = filtered.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!apiKey || mapFailed || !mapRef.current) return;

    let cancelled = false;

    async function init() {
      try {
        const g = await loadGoogleMaps(apiKey!);
        if (cancelled || !mapRef.current) return;

        if (!mapInstance.current) {
          mapInstance.current = new g.Map(mapRef.current, {
            center: { lat: -17.3667, lng: 30.2 },
            zoom: 8,
            styles: PANORA_MAP_STYLES as google.maps.MapTypeStyle[],
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            backgroundColor: "#0A192F",
          });
        }

        const map = mapInstance.current;
        if (!map) return;

        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const bounds = new g.LatLngBounds();
        for (const place of filtered) {
          const position = {
            lat: place.latitude as number,
            lng: place.longitude as number,
          };
          bounds.extend(position);
          const marker = new g.Marker({
            position,
            map,
            title: place.name,
            icon: {
              url: panoraMarkerIconUrl(),
              scaledSize: new g.Size(40, 40),
              anchor: new g.Point(20, 40),
            },
          });
          marker.addListener("click", () => setSelectedId(place.id));
          marker.addListener("mouseover", () => {
            marker.setAnimation(g.Animation.BOUNCE);
            window.setTimeout(() => marker.setAnimation(null), 650);
          });
          markersRef.current.push(marker);
        }

        if (filtered.length > 0) {
          map.fitBounds(bounds, 72);
        }
      } catch (err) {
        console.info(
          "[maps] Explore map failed:",
          err instanceof Error ? err.message : err,
        );
        if (!cancelled) setMapFailed(true);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [apiKey, mapFailed, filtered]);

  return (
    <div className="relative flex h-[calc(100dvh-var(--nav-height)-var(--bottom-nav-height)-env(safe-area-inset-bottom))] min-h-[28rem] flex-col bg-[var(--brand-navy)] text-white md:h-[calc(100dvh-var(--nav-height))]">
      <div className="absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-[color-mix(in_srgb,var(--brand-navy)_88%,transparent)] px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Explore
            </p>
            <h1 className="font-display text-2xl leading-tight sm:text-3xl">
              Map of Zimbabwe
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setRegion(item);
                  setSelectedId(null);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  region === item
                    ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--accent)]"
                    : "border-white/20 bg-white/5 text-white/80 hover:border-white/40",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden pt-[7.5rem] sm:pt-[6.5rem]">
        {apiKey && !mapFailed ? (
          <div ref={mapRef} className="absolute inset-0 h-full w-full" />
        ) : (
          <ElegantMapFallback
            places={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            reduceMotion={!!reduceMotion}
          />
        )}

        {filtered.length === 0 && (
          <p className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center text-sm text-white/70">
            No places with coordinates in this region yet.
          </p>
        )}
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="absolute inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto w-auto max-w-md sm:inset-x-auto sm:right-6 sm:bottom-8 sm:left-auto sm:w-full"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            transition={motionTokens.spring.soft}
          >
            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-white/15 bg-[color-mix(in_srgb,var(--brand-navy)_72%,transparent)] shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
              <div className="relative aspect-[16/9]">
                <ProgressiveImage
                  src={selected.heroImage}
                  alt={selected.name}
                  fill
                  sizes="400px"
                  className="object-cover"
                  containerClassName="absolute inset-0"
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md"
                  aria-label="Close preview"
                  onClick={() => setSelectedId(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 p-4">
                <p className="flex items-center gap-1.5 text-xs text-white/70">
                  <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" />
                  {selected.city}
                </p>
                <h2 className="font-display text-2xl leading-tight">
                  {selected.name}
                </h2>
                <p className="line-clamp-2 text-sm text-white/75">
                  {selected.story.slice(0, 120)}…
                </p>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs font-medium text-[var(--accent)]">
                    {formatPriceGuide(selected.priceGuide)}
                  </span>
                  <Link
                    href={`/panoras/${selected.slug}`}
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--brand-navy)] transition hover:opacity-90"
                  >
                    View place →
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Soft fallback when Maps API key is missing or fails to load. */
function ElegantMapFallback({
  places,
  selectedId,
  onSelect,
  reduceMotion,
}: {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  reduceMotion: boolean;
}) {
  const BOUNDS = {
    minLat: -22.5,
    maxLat: -15.5,
    minLng: 25.0,
    maxLng: 33.5,
  };

  function project(lat: number, lng: number) {
    const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
    const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
    return {
      left: Math.min(96, Math.max(4, x)),
      top: Math.min(94, Math.max(6, y)),
    };
  }

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 70% 55% at 55% 45%, rgba(194,155,98,0.14), transparent 70%),
            linear-gradient(160deg, #0d2137 0%, #0a192f 45%, #071222 100%)
          `,
        }}
        aria-hidden
      />
      <div className="relative mx-auto h-full w-full max-w-5xl px-2 sm:px-6">
        <div className="relative h-full w-full">
          {places.map((place) => {
            const { left, top } = project(
              place.latitude as number,
              place.longitude as number,
            );
            const active = selectedId === place.id;
            return (
              <motion.button
                key={place.id}
                type="button"
                className="absolute z-10 -translate-x-1/2 -translate-y-full focus:outline-none"
                style={{ left: `${left}%`, top: `${top}%` }}
                onClick={() =>
                  onSelect(selectedId === place.id ? null : place.id)
                }
                initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={reduceMotion ? undefined : { scale: 1.12 }}
                transition={motionTokens.spring.soft}
                aria-label={`Show ${place.name}`}
              >
                <span
                  className={cn(
                    "relative flex flex-col items-center",
                    active && "drop-shadow-[0_0_12px_rgba(194,155,98,0.65)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-lg",
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--brand-navy)]"
                        : "border-[var(--accent)] bg-[var(--brand-navy)] text-[var(--accent)]",
                    )}
                  >
                    <span className="text-xs font-bold">P</span>
                  </span>
                  <span className="mt-0.5 h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-[var(--accent)]" />
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
      <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-white/45">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for full Google Maps
      </p>
    </div>
  );
}
