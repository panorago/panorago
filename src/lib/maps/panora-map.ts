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

/** Prefer PGO brand icon; SVG “P” pin as fallback for data-URI markers. */
export function panoraMarkerIconUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/logos/pgo-light-icon.png`;
  }
  return "/logos/pgo-light-icon.png";
}

/** Gold “P” pin with soft glow — used when image marker is unavailable. */
export function panoraMarkerSvg(size = 48): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 12}" viewBox="0 0 48 60">
  <defs>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <ellipse cx="24" cy="54" rx="10" ry="3.5" fill="rgba(0,0,0,0.35)"/>
  <path filter="url(#glow)" d="M24 2C14.06 2 6 10.06 6 20c0 12.5 18 34 18 34s18-21.5 18-34C42 10.06 33.94 2 24 2z"
    fill="#0A192F" stroke="#C29B62" stroke-width="2.25"/>
  <circle cx="24" cy="20" r="9.5" fill="#C29B62"/>
  <text x="24" y="24.5" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-weight="700" fill="#0A192F">P</text>
</svg>`.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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
