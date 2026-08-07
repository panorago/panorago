"use client";

import { Button } from "@/components/ui/button";
import { loadGoogleMaps } from "@/lib/maps/load-google-maps";
import {
  DIRECTIONS_POLYLINE,
  formatArrivalEstimate,
  getMapsApiKey,
  PANORA_MAP_STYLES,
  PANORA_PIN_SIZE_LG,
  panoraMarkerIconOptions,
  panoraMarkerIconUrl,
  panoraMarkerSvg,
  userMarkerSvg,
} from "@/lib/maps/panora-map";
import { haversineKm } from "@/lib/maps/geo";
import { formatDistance } from "@/lib/utils";
import { MapPin, Navigation, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export { haversineKm };

type PlaceDirectionsMapProps = {
  name: string;
  lat: number;
  lng: number;
  googleMapsUrl?: string | null;
  /** When set, Share uses Panora SmartShare™ (`/p/{slug}`) instead of Maps. */
  shareSlug?: string;
  onSmartShare?: () => void;
};

type RouteInfo = {
  distanceKm: number;
  durationText: string;
  durationMinutes: number;
};

type NearbyPlace = {
  name: string;
  vicinity?: string;
  rating?: number;
};

type GeoState =
  | { status: "idle" | "denied" | "unavailable" | "loading" }
  | {
      status: "ready";
      lat: number;
      lng: number;
      route: RouteInfo | null;
    };

function estimateDriveMinutes(distanceKm: number): number {
  const speedKmh = distanceKm < 40 ? 40 : 60;
  return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
}

function embedSrc(lat: number, lng: number, googleMapsUrl?: string | null) {
  if (googleMapsUrl?.startsWith("http")) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(googleMapsUrl)}&z=14&output=embed`;
  }
  return `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`;
}

function sharePanoraPlace(name: string, slug: string) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/p/${encodeURIComponent(slug)}`;
  const text = `Discover ${name} on Panora Go\n${url}`;
  if (navigator.share) {
    void navigator.share({ title: name, text, url }).catch(() => {
      void navigator.clipboard?.writeText(url);
    });
    return;
  }
  void navigator.clipboard?.writeText(url);
}

function MapHeader({
  name,
  geo,
  directionsHref,
  onShare,
}: {
  name: string;
  geo: GeoState;
  directionsHref: string;
  onShare?: () => void;
}) {
  const arrival =
    geo.status === "ready" && geo.route
      ? formatArrivalEstimate(geo.route.durationMinutes)
      : null;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Navigate
        </p>
        <h2 className="mt-1 font-display text-2xl">Find your way</h2>
        {geo.status === "ready" && geo.route ? (
          <p className="mt-1 text-sm text-muted">
            {formatDistance(geo.route.distanceKm)} · {geo.route.durationText}{" "}
            drive
            {arrival ? ` · arrive ~${arrival}` : ""}
          </p>
        ) : geo.status === "ready" ? (
          <p className="mt-1 text-sm text-muted">
            Location found — calculating driving route…
          </p>
        ) : geo.status === "loading" || geo.status === "idle" ? (
          <p className="mt-1 text-sm text-muted">
            Locating you for a driving route…
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">
            Map of {name}
            {geo.status === "denied" || geo.status === "unavailable"
              ? " — location off; venue pin still shown"
              : ""}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {onShare ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4" />
            Share place
          </Button>
        ) : null}
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
          Navigate with Google Maps
        </Button>
      </div>
    </div>
  );
}

function resolveShareAction(opts: {
  name: string;
  shareSlug?: string;
  onSmartShare?: () => void;
}): (() => void) | undefined {
  if (opts.onSmartShare) return opts.onSmartShare;
  if (opts.shareSlug) return () => sharePanoraPlace(opts.name, opts.shareSlug!);
  return undefined;
}

function EmbedFallback({
  name,
  lat,
  lng,
  googleMapsUrl,
  geo,
  shareSlug,
  onSmartShare,
}: {
  name: string;
  lat: number;
  lng: number;
  googleMapsUrl?: string | null;
  geo: GeoState;
  shareSlug?: string;
  onSmartShare?: () => void;
}) {
  const directionsHref =
    geo.status === "ready"
      ? `https://www.google.com/maps/dir/?api=1&origin=${geo.lat},${geo.lng}&destination=${lat},${lng}&travelmode=driving`
      : googleMapsUrl?.startsWith("http")
        ? googleMapsUrl
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

  return (
    <div className="space-y-4">
      <MapHeader
        name={name}
        geo={geo}
        directionsHref={directionsHref}
        onShare={resolveShareAction({ name, shareSlug, onSmartShare })}
      />
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
        <iframe
          title={`Map of ${name}`}
          src={embedSrc(lat, lng, googleMapsUrl)}
          className="h-80 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="text-xs text-muted">
        Interactive Google Maps loads when a Maps API key is configured.
      </p>
    </div>
  );
}

export function PlaceDirectionsMap({
  name,
  lat,
  lng,
  googleMapsUrl,
  shareSlug,
  onSmartShare,
}: PlaceDirectionsMapProps) {
  const apiKey = getMapsApiKey();
  const mapRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [mapFailed, setMapFailed] = useState(false);
  const [nearby, setNearby] = useState<NearbyPlace[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo({ status: "unavailable" });
      return;
    }
    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          status: "ready",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          route: null,
        });
      },
      () => setGeo({ status: "denied" }),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 },
    );
  }, []);

  const userLat = geo.status === "ready" ? geo.lat : null;
  const userLng = geo.status === "ready" ? geo.lng : null;

  useEffect(() => {
    if (!apiKey || mapFailed || !mapRef.current) return;

    let cancelled = false;
    let directionsRenderer: google.maps.DirectionsRenderer | null = null;

    async function init() {
      try {
        const g = await loadGoogleMaps(apiKey!, { places: true });
        if (cancelled || !mapRef.current) return;

        const venue = { lat, lng };
        const map = new g.Map(mapRef.current, {
          center: venue,
          zoom: 13,
          styles: PANORA_MAP_STYLES as google.maps.MapTypeStyle[],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          backgroundColor: "#0A192F",
        });

        const iconUrl = panoraMarkerIconUrl();
        const pinSize = PANORA_PIN_SIZE_LG;
        const venueMarker = new g.Marker({
          position: venue,
          map,
          title: name,
          icon: panoraMarkerIconOptions(g, pinSize),
          animation: g.Animation.DROP,
        });

        const img = new Image();
        img.onerror = () => {
          venueMarker.setIcon({
            url: panoraMarkerSvg(pinSize.width),
            scaledSize: new g.Size(pinSize.width, pinSize.height),
            anchor: new g.Point(pinSize.width / 2, pinSize.height),
          });
        };
        img.src = iconUrl;

        venueMarker.addListener("mouseover", () => {
          venueMarker.setAnimation(g.Animation.BOUNCE);
          window.setTimeout(() => venueMarker.setAnimation(null), 700);
        });

        directionsRenderer = new g.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: DIRECTIONS_POLYLINE,
        });

        if (g.places?.PlacesService) {
          try {
            const service = new g.places.PlacesService(map);
            service.nearbySearch(
              {
                location: venue,
                radius: 2500,
                type: "tourist_attraction",
              },
              (results, status) => {
                if (cancelled) return;
                if (status === "OK" && results) {
                  setNearby(
                    results.slice(0, 5).map((r) => ({
                      name: r.name ?? "Place",
                      vicinity: r.vicinity,
                      rating: r.rating,
                    })),
                  );
                }
              },
            );
          } catch {
            // Places optional
          }
        }

        if (userLat != null && userLng != null) {
          const origin = { lat: userLat, lng: userLng };
          new g.Marker({
            position: origin,
            map,
            title: "Your location",
            icon: {
              url: userMarkerSvg(36),
              scaledSize: new g.Size(36, 36),
              anchor: new g.Point(18, 18),
            },
          });

          const directions = new g.DirectionsService();
          directions.route(
            {
              origin,
              destination: venue,
              travelMode: g.TravelMode.DRIVING,
            },
            (result, status) => {
              if (cancelled) return;
              if (status === "OK" && result) {
                directionsRenderer?.setDirections(result);
                const leg = result.routes[0]?.legs[0];
                if (leg?.distance && leg.duration) {
                  setGeo((prev) =>
                    prev.status === "ready"
                      ? {
                          ...prev,
                          route: {
                            distanceKm: leg.distance!.value / 1000,
                            durationText: leg.duration!.text,
                            durationMinutes: Math.round(
                              leg.duration!.value / 60,
                            ),
                          },
                        }
                      : prev,
                  );
                }
              } else {
                const distanceKm = haversineKm(
                  origin.lat,
                  origin.lng,
                  venue.lat,
                  venue.lng,
                );
                const mins = estimateDriveMinutes(distanceKm);
                setGeo((prev) =>
                  prev.status === "ready"
                    ? {
                        ...prev,
                        route: {
                          distanceKm,
                          durationText: `~${mins} min`,
                          durationMinutes: mins,
                        },
                      }
                    : prev,
                );
                const bounds = new g.LatLngBounds();
                bounds.extend(origin);
                bounds.extend(venue);
                map.fitBounds(bounds, 64);
              }
            },
          );
        }
      } catch (err) {
        console.info(
          "[maps] Google Maps failed, using embed fallback:",
          err instanceof Error ? err.message : err,
        );
        if (!cancelled) setMapFailed(true);
      }
    }

    void init();
    return () => {
      cancelled = true;
      directionsRenderer?.setMap(null);
    };
  }, [apiKey, mapFailed, lat, lng, name, userLat, userLng]);

  const directionsHref = useMemo(() => {
    if (geo.status === "ready") {
      return `https://www.google.com/maps/dir/?api=1&origin=${geo.lat},${geo.lng}&destination=${lat},${lng}&travelmode=driving`;
    }
    if (googleMapsUrl?.startsWith("http")) return googleMapsUrl;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  }, [geo, lat, lng, googleMapsUrl]);

  const handleShare = resolveShareAction({ name, shareSlug, onSmartShare });

  if (!apiKey || mapFailed) {
    return (
      <EmbedFallback
        name={name}
        lat={lat}
        lng={lng}
        googleMapsUrl={googleMapsUrl}
        geo={geo}
        shareSlug={shareSlug}
        onSmartShare={onSmartShare}
      />
    );
  }

  return (
    <div className="space-y-4">
      <MapHeader
        name={name}
        geo={geo}
        directionsHref={directionsHref}
        onShare={handleShare}
      />
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow)]">
        <div
          ref={mapRef}
          className="h-80 w-full bg-[var(--brand-navy)]"
          role="img"
          aria-label={`Google Map of ${name}`}
        />
      </div>
      <p className="inline-flex items-center gap-1.5 text-xs text-muted">
        <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" />
        Panora pin · live driving route when location is allowed
      </p>
      {nearby.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Nearby
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted">
            {nearby.map((place) => (
              <li key={place.name}>
                <span className="text-[var(--foreground)]">{place.name}</span>
                {place.vicinity ? ` — ${place.vicinity}` : ""}
                {place.rating != null ? ` · ${place.rating.toFixed(1)}★` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
