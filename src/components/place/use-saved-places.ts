"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "panora-saved";

function readSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function writeSaved(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("panora-saved-change"));
  window.dispatchEvent(new Event("panora-saved-changed"));
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener("panora-saved-change", handler);
  window.addEventListener("panora-saved-changed", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("panora-saved-change", handler);
    window.removeEventListener("panora-saved-changed", handler);
  };
}

export function useSavedPlaces() {
  const saved = useSyncExternalStore(
    subscribe,
    readSaved,
    () => [] as string[],
  );

  const isSaved = useCallback(
    (placeId: string) => saved.includes(placeId),
    [saved],
  );

  const toggle = useCallback((placeId: string) => {
    const current = readSaved();
    const next = current.includes(placeId)
      ? current.filter((id) => id !== placeId)
      : [...current, placeId];
    writeSaved(next);
  }, []);

  const save = useCallback((placeId: string) => {
    const current = readSaved();
    if (current.includes(placeId)) return;
    writeSaved([...current, placeId]);
  }, []);

  const unsave = useCallback((placeId: string) => {
    writeSaved(readSaved().filter((id) => id !== placeId));
  }, []);

  return { saved, isSaved, toggle, save, unsave };
}

export function getSavedPlaceIds(): string[] {
  return readSaved();
}

/** Hydration-safe saved check for first paint */
export function useIsSaved(placeId: string) {
  const { isSaved, toggle } = useSavedPlaces();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    saved: mounted ? isSaved(placeId) : false,
    toggle: () => toggle(placeId),
    mounted,
  };
}

export { STORAGE_KEY as SAVED_STORAGE_KEY };
