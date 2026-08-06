"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "panora-saved";
const EMPTY_SAVED: string[] = [];

let cachedRaw: string | null = null;
let cachedIds: string[] = EMPTY_SAVED;

function parseSaved(raw: string | null): string[] {
  if (!raw) return EMPTY_SAVED;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY_SAVED;
    const ids = parsed.filter((id): id is string => typeof id === "string");
    return ids.length === 0 ? EMPTY_SAVED : ids;
  } catch {
    return EMPTY_SAVED;
  }
}

function getSnapshot(): string[] {
  if (typeof window === "undefined") return EMPTY_SAVED;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  cachedIds = parseSaved(raw);
  return cachedIds;
}

function getServerSnapshot(): string[] {
  return EMPTY_SAVED;
}

function writeSaved(ids: string[]) {
  const next = ids.length === 0 ? EMPTY_SAVED : ids;
  const raw = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedIds = next;
  window.dispatchEvent(new Event("panora-saved-change"));
  window.dispatchEvent(new Event("panora-saved-changed"));
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    cachedRaw = null;
    onStoreChange();
  };
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
  const saved = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isSaved = useCallback(
    (placeId: string) => saved.includes(placeId),
    [saved],
  );

  const toggle = useCallback((placeId: string) => {
    const current = getSnapshot();
    const next = current.includes(placeId)
      ? current.filter((id) => id !== placeId)
      : [...current, placeId];
    writeSaved(next);
  }, []);

  const save = useCallback((placeId: string) => {
    const current = getSnapshot();
    if (current.includes(placeId)) return;
    writeSaved([...current, placeId]);
  }, []);

  const unsave = useCallback((placeId: string) => {
    writeSaved(getSnapshot().filter((id) => id !== placeId));
  }, []);

  return { saved, isSaved, toggle, save, unsave };
}

export function getSavedPlaceIds(): string[] {
  return getSnapshot();
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
