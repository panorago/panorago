/** Panora-branded Google Maps styles and custom markers. */

export const PANORA_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0a192f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#c29b62" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a192f" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e3a5f" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#0d2137" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a9bb0" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0c2438" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#132a45" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0a192f" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9eb0c4" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1a3555" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0a192f" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#06101c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a6a88" }],
  },
];

export function getMapsApiKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return key || undefined;
}

/** Panora P-pin asset (teardrop + lettermark). Aspect 48×60; anchor bottom-center. */
export const PANORA_PIN_SIZE = { width: 40, height: 50 } as const;
export const PANORA_PIN_SIZE_LG = { width: 44, height: 55 } as const;

export function panoraMarkerIconUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/images/map/panora-pin.svg`;
  }
  return "/images/map/panora-pin.svg";
}

/** Inline SVG data-URI fallback matching `public/images/map/panora-pin.svg`. */
export function panoraMarkerSvg(width = 48): string {
  const height = Math.round((width * 60) / 48);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 48 60">
  <ellipse cx="24" cy="56.5" rx="9" ry="2.8" fill="#000000" fill-opacity="0.32"/>
  <path d="M24 2C14.06 2 6 10.06 6 20c0 12.5 18 34 18 34s18-21.5 18-34C42 10.06 33.94 2 24 2z"
    fill="#0A192F" stroke="#C29B62" stroke-width="2.25" stroke-linejoin="round"/>
  <circle cx="24" cy="20" r="10" fill="#C29B62"/>
  <path fill="#0A192F"
    d="M19.2 12.6h6.05c3.05 0 5.05 1.7 5.05 4.35 0 2.55-1.9 4.3-5.05 4.3H22.5v6.15h-3.3V12.6zm3.3 6.15h2.55c1.35 0 2.15-.75 2.15-1.85s-.8-1.8-2.15-1.8H22.5v3.65z"/>
</svg>`.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** Google Maps Icon options with bottom-center tip anchor. */
export function panoraMarkerIconOptions(
  g: Pick<
    import("@/lib/maps/load-google-maps").GoogleMapsBundle,
    "Size" | "Point"
  >,
  size: { width: number; height: number } = PANORA_PIN_SIZE,
): google.maps.Icon {
  return {
    url: panoraMarkerIconUrl(),
    scaledSize: new g.Size(size.width, size.height),
    anchor: new g.Point(size.width / 2, size.height),
  };
}

export function userMarkerSvg(size = 36): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="14" fill="#C29B62" fill-opacity="0.25" stroke="#C29B62" stroke-width="2"/>
  <circle cx="18" cy="18" r="6" fill="#C29B62"/>
</svg>`.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const DIRECTIONS_POLYLINE = {
  strokeColor: "#C29B62",
  strokeOpacity: 0.9,
  strokeWeight: 4,
};

export function formatArrivalEstimate(durationMinutes: number): string {
  const eta = new Date(Date.now() + durationMinutes * 60_000);
  return eta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
