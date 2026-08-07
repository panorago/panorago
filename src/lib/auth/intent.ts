/** Pending personal-action intent after Join Panora / Welcome Back. */

export type AuthIntentKind =
  | "save"
  | "enquiry"
  | "circle_post"
  | "generic"
  | "explorer";

export type PlaceAuthContext = {
  placeId: string;
  placeName?: string;
  imageUrl?: string | null;
  atmospheres?: string[];
  slug?: string;
};

export type AuthIntent = {
  kind: AuthIntentKind;
  place?: PlaceAuthContext;
  /** Path to return to after OAuth / email confirm */
  returnTo?: string;
  /** Headline override for the modal */
  headline?: string;
  subtitle?: string;
};

export const AUTH_INTENT_STORAGE_KEY = "panora-auth-intent";
export const AUTH_PENDING_SAVE_KEY = "panora-pending-save";

export function readAuthIntent(): AuthIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_INTENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthIntent;
  } catch {
    return null;
  }
}

export function writeAuthIntent(intent: AuthIntent | null) {
  if (typeof window === "undefined") return;
  if (!intent) {
    sessionStorage.removeItem(AUTH_INTENT_STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(AUTH_INTENT_STORAGE_KEY, JSON.stringify(intent));
}

export function clearAuthIntent() {
  writeAuthIntent(null);
}
