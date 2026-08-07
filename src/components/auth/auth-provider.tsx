"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ensureExplorerSessionAction,
  signOutExplorerAction,
} from "@/lib/auth/actions";
import {
  clearAuthIntent,
  readAuthIntent,
  writeAuthIntent,
  type AuthIntent,
} from "@/lib/auth/intent";
import type { ExplorerProfile } from "@/lib/auth/profile";
import {
  savePlaceAction,
  syncWishlistAction,
} from "@/lib/auth/wishlist";
import {
  getSavedPlaceIds,
  replaceSavedPlaceIds,
} from "@/components/place/use-saved-places";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

const AuthModalLazy = dynamic(
  () =>
    import("@/components/auth/auth-modal").then((m) => ({
      default: m.AuthModal,
    })),
  { ssr: false },
);

type AuthContextValue = {
  user: User | null;
  profile: ExplorerProfile | null;
  loading: boolean;
  openAuth: (intent?: AuthIntent) => void;
  closeAuth: () => void;
  requireAuth: (intent?: AuthIntent) => boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  authOpen: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function supabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

function JoinQueryBridge({
  user,
  openAuth,
}: {
  user: User | null;
  openAuth: (intent?: AuthIntent) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("join") !== "1") return;
    if (user) return;
    const next = searchParams.get("next") ?? undefined;
    openAuth({
      kind: next?.startsWith("/explorer") ? "explorer" : "generic",
      returnTo: next && next.startsWith("/") ? next : undefined,
    });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("join");
    params.delete("next");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [openAuth, pathname, router, searchParams, user]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ExplorerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [intent, setIntent] = useState<AuthIntent | null>(null);
  const [modalMounted, setModalMounted] = useState(false);
  const fulfilling = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    if (!supabaseConfigured()) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    const result = await ensureExplorerSessionAction();
    if (!result.ok) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u);
      setProfile(result.profile);
    } catch {
      setUser(null);
      setProfile(result.profile);
    } finally {
      setLoading(false);
    }
  }, []);

  const fulfillIntent = useCallback(async (pending: AuthIntent | null) => {
    if (!pending || fulfilling.current) return;
    fulfilling.current = true;
    try {
      if (pending.kind === "save" && pending.place?.placeId) {
        const local = getSavedPlaceIds();
        const merged = local.includes(pending.place.placeId)
          ? local
          : [...local, pending.place.placeId];
        replaceSavedPlaceIds(merged);
        await savePlaceAction(pending.place.placeId);
        const synced = await syncWishlistAction(merged);
        if (synced.ok) replaceSavedPlaceIds(synced.placeIds);
      } else {
        const local = getSavedPlaceIds();
        if (local.length > 0) {
          const synced = await syncWishlistAction(local);
          if (synced.ok) replaceSavedPlaceIds(synced.placeIds);
        }
      }
      clearAuthIntent();
      if (pending.returnTo && pending.returnTo !== pathname) {
        router.push(pending.returnTo);
      }
    } finally {
      fulfilling.current = false;
    }
  }, [pathname, router]);

  const openAuth = useCallback((next?: AuthIntent) => {
    const resolved: AuthIntent = next ?? { kind: "generic" };
    if (!resolved.returnTo && typeof window !== "undefined") {
      resolved.returnTo = window.location.pathname + window.location.search;
    }
    setIntent(resolved);
    writeAuthIntent(resolved);
    setModalMounted(true);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
  }, []);

  const requireAuth = useCallback(
    (next?: AuthIntent) => {
      if (user) return true;
      openAuth(next);
      return false;
    },
    [openAuth, user],
  );

  const signOut = useCallback(async () => {
    await signOutExplorerAction();
    setUser(null);
    setProfile(null);
  }, []);

  const onAuthenticated = useCallback(async () => {
    setAuthOpen(false);
    await refreshProfile();
    const pending = intent ?? readAuthIntent();
    await fulfillIntent(pending);
    setIntent(null);
  }, [fulfillIntent, intent, refreshProfile]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (!supabaseConfigured()) return;
    let unsub: (() => void) | undefined;
    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setUser(session?.user ?? null);
        if (event === "SIGNED_IN" && session?.user) {
          const result = await ensureExplorerSessionAction();
          if (result.ok) setProfile(result.profile);
          const pending = readAuthIntent();
          if (pending) {
            await fulfillIntent(pending);
            setAuthOpen(false);
          } else {
            const local = getSavedPlaceIds();
            if (local.length > 0) {
              const synced = await syncWishlistAction(local);
              if (synced.ok) replaceSavedPlaceIds(synced.placeIds);
            }
          }
        }
        if (event === "SIGNED_OUT") {
          setProfile(null);
        }
      });
      unsub = () => subscription.unsubscribe();
    } catch {
      // missing env
    }
    return () => unsub?.();
  }, [fulfillIntent]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      openAuth,
      closeAuth,
      requireAuth,
      refreshProfile,
      signOut,
      authOpen,
    }),
    [
      user,
      profile,
      loading,
      openAuth,
      closeAuth,
      requireAuth,
      refreshProfile,
      signOut,
      authOpen,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      <Suspense fallback={null}>
        <JoinQueryBridge user={user} openAuth={openAuth} />
      </Suspense>
      {children}
      {modalMounted ? (
        <AuthModalLazy
          open={authOpen}
          intent={intent}
          onClose={closeAuth}
          onAuthenticated={() => void onAuthenticated()}
        />
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

/** Soft hook for components that may render outside provider in edge cases. */
export function useOptionalAuth() {
  return useContext(AuthContext);
}
