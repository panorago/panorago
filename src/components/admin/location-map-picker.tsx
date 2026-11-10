"use client";

import { loadGoogleMaps } from "@/lib/maps/load-google-maps";
import { getMapsApiKey, PANORA_MAP_STYLES } from "@/lib/maps/panora-map";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export type PickedLocation = {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  placeId: string;
};

type LocationMapPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  onPlacePicked?: (place: PickedLocation) => void;
};

const DEFAULT_CENTER = { lat: -17.3667, lng: 30.2 }; // Chinhoyi

function cityFromComponents(
  components?: google.maps.GeocoderAddressComponent[],
) {
  if (!components) return "";
  const locality = components.find((part) => part.types.includes("locality"));
  return locality?.long_name ?? "";
}

export function LocationMapPicker({
  latitude,
  longitude,
  onChange,
  onPlacePicked,
}: LocationMapPickerProps) {
  const apiKey = getMapsApiKey();
  const mapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onPickedRef = useRef(onPlacePicked);
  const [mapFailed, setMapFailed] = useState(false);
  const [placeId, setPlaceId] = useState("");
  const [searchNote, setSearchNote] = useState("");
  onPickedRef.current = onPlacePicked;

  const [latInput, setLatInput] = useState(
    latitude != null ? String(latitude) : "",
  );
  const [lngInput, setLngInput] = useState(
    longitude != null ? String(longitude) : "",
  );

  useEffect(() => {
    setLatInput(latitude != null ? String(latitude) : "");
    setLngInput(longitude != null ? String(longitude) : "");
  }, [latitude, longitude]);

  useEffect(() => {
    if (!apiKey || mapFailed || !mapRef.current) return;
    let cancelled = false;

    async function init() {
      try {
        const g = await loadGoogleMaps(apiKey!, { places: true });
        if (cancelled || !mapRef.current) return;

        const center =
          latitude != null && longitude != null
            ? { lat: latitude, lng: longitude }
            : DEFAULT_CENTER;

        const map = new g.Map(mapRef.current, {
          center,
          zoom: latitude != null ? 14 : 11,
          styles: PANORA_MAP_STYLES,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
        });
        mapInstance.current = map;

        const marker = new g.Marker({
          map,
          position: center,
          draggable: true,
          title: "Place location",
        });
        markerRef.current = marker;

        const emit = (lat: number, lng: number) => {
          onChange({ latitude: lat, longitude: lng });
          setLatInput(String(lat));
          setLngInput(String(lng));
        };

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          const lat = e.latLng?.lat();
          const lng = e.latLng?.lng();
          if (lat == null || lng == null) return;
          marker.setPosition({ lat, lng });
          emit(lat, lng);
        });

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (!pos) return;
          emit(pos.lat(), pos.lng());
        });

        if (g.places && searchRef.current) {
          const autocomplete = new g.places.Autocomplete(searchRef.current, {
            fields: [
              "name",
              "formatted_address",
              "geometry",
              "place_id",
              "address_components",
            ],
          });
          autocomplete.addListener("place_changed", () => {
            const picked = autocomplete.getPlace();
            const lat = picked.geometry?.location?.lat();
            const lng = picked.geometry?.location?.lng();
            if (lat == null || lng == null) {
              setSearchNote("That suggestion has no map position. Try another result.");
              return;
            }
            const next = { lat, lng };
            marker.setPosition(next);
            map.panTo(next);
            map.setZoom(16);
            emit(lat, lng);
            setPlaceId(picked.place_id ?? "");
            setSearchNote("");
            onPickedRef.current?.({
              name: picked.name ?? "",
              address: picked.formatted_address ?? "",
              city: cityFromComponents(picked.address_components),
              latitude: lat,
              longitude: lng,
              placeId: picked.place_id ?? "",
            });
          });
        }
      } catch {
        if (!cancelled) setMapFailed(true);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
    // init once when key is available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, mapFailed]);

  useEffect(() => {
    if (
      latitude == null ||
      longitude == null ||
      !markerRef.current ||
      !mapInstance.current
    ) {
      return;
    }
    const pos = { lat: latitude, lng: longitude };
    markerRef.current.setPosition(pos);
    mapInstance.current.panTo(pos);
  }, [latitude, longitude]);

  function applyManual() {
    const lat = Number(latInput);
    const lng = Number(lngInput);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    onChange({ latitude: lat, longitude: lng });
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted">
          Search a business or address
        </span>
        <input
          ref={searchRef}
          type="search"
          className={field}
          placeholder={
            apiKey
              ? "Start typing a place in Zimbabwe"
              : "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to search locations"
          }
          disabled={!apiKey}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
        />
        {searchNote ? (
          <p className="text-xs text-muted">{searchNote}</p>
        ) : null}
      </label>
      <input type="hidden" name="googlePlaceId" value={placeId} />

      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-[var(--accent)]" />
        <p className="text-xs font-medium text-muted">
          Scroll the page normally. Use two fingers, or Ctrl and scroll, to zoom the map. Drag the pin to adjust.
        </p>
      </div>

      {apiKey && !mapFailed ? (
        <div
          ref={mapRef}
          className="h-64 w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]"
          role="application"
          aria-label="Click map to set place location"
        />
      ) : (
        <p className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--secondary)] px-3 py-3 text-xs text-muted">
          {mapFailed
            ? "Map failed to load."
            : "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for click-to-pin."}{" "}
          You can still enter latitude and longitude below.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Latitude</span>
          <input
            name="latitude"
            type="number"
            step="any"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            onBlur={applyManual}
            className={field}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Longitude</span>
          <input
            name="longitude"
            type="number"
            step="any"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            onBlur={applyManual}
            className={field}
          />
        </label>
      </div>
    </div>
  );
}
