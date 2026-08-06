"use client";

/**
 * Embed + directions without requiring NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 * If that key is set later, swap the iframe for the Maps JS API (Places /
 * Directions) — embed URLs below remain a zero-key fallback.
 */

import { Button } from "@/components/ui/button";
import { formatDistance } from "@/lib/utils";
import { MapPin, Navigation } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PlaceDirectionsMapProps = {
  name: string;
  lat: number;
  lng: number;
  googleMapsUrl?: string | null;
};

type GeoState =
  | { status: "idle" | "denied" | "unavailable" }
  | {
      status: "ready";
      lat: number;
      lng: number;
      distanceKm: number;
      driveMinutes: number;
    };

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in kilometres. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDriveMinutes(distanceKm: number): number {
  // Under ~40 km: assume urban ~40 km/h; longer legs: rural ~60 km/h.
  const speedKmh = distanceKm < 40 ? 40 : 60;
  return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
}

function embedSrc(lat: number, lng: number, googleMapsUrl?: string | null) {
  if (googleMapsUrl) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(googleMapsUrl)}&z=14&output=embed`;
  }
  return `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`;
}

function osmFallbackSrc(lat: number, lng: number) {
  const delta = 0.02;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function PlaceDirectionsMap({
  name,
  lat,
  lng,
  googleMapsUrl,
}: PlaceDirectionsMapProps) {
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [useOsm, setUseOsm] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo({ status: "unavailable" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const distanceKm = haversineKm(userLat, userLng, lat, lng);
        setGeo({
          status: "ready",
          lat: userLat,
          lng: userLng,
          distanceKm,
          driveMinutes: estimateDriveMinutes(distanceKm),
        });
      },
      () => setGeo({ status: "denied" }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 120_000 },
    );
  }, [lat, lng]);

  const mapSrc = useMemo(
    () =>
      useOsm ? osmFallbackSrc(lat, lng) : embedSrc(lat, lng, googleMapsUrl),
    [useOsm, lat, lng, googleMapsUrl],
  );

  const directionsHref =
    geo.status === "ready"
      ? `https://www.google.com/maps/dir/?api=1&origin=${geo.lat},${geo.lng}&destination=${lat},${lng}`
      : googleMapsUrl?.startsWith("http")
        ? googleMapsUrl
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Find your way</h2>
          {geo.status === "ready" ? (
            <p className="mt-1 text-sm text-muted">
              About {formatDistance(geo.distanceKm)} away · roughly{" "}
              {geo.driveMinutes} min drive
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">
              Map of {name}
              {geo.status === "denied" || geo.status === "unavailable"
                ? " — enable location for distance and turn-by-turn directions"
                : ""}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="accent"
          size="sm"
          className="rounded-full"
          onClick={() => {
            window.open(directionsHref, "_blank", "noopener,noreferrer");
          }}
        >
          <Navigation className="h-4 w-4" />
          Get directions
        </Button>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
        <iframe
          title={`Map of ${name}`}
          src={mapSrc}
          className="h-72 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onError={() => setUseOsm(true)}
        />
      </div>

      {!useOsm ? (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-muted underline-offset-2 hover:text-[var(--foreground)] hover:underline"
          onClick={() => setUseOsm(true)}
        >
          <MapPin className="h-3.5 w-3.5" />
          Prefer OpenStreetMap embed
        </button>
      ) : null}
    </div>
  );
}
