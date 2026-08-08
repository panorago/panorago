"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Compass, Heart, LogOut, Sparkles } from "lucide-react";

import { ExplorerOnboarding } from "@/components/auth/explorer-onboarding";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import type { ExplorerProfile } from "@/lib/auth/profile";
import { syncWishlistAction } from "@/lib/auth/wishlist";
import {
  getSavedPlaceIds,
  mergeSavedPlaceIds,
  replaceSavedPlaceIds,
} from "@/components/place/use-saved-places";

export function ExplorerProfileClient() {
  const { user, profile, loading, openAuth, signOut, refreshProfile } =
    useAuth();
  const [localProfile, setLocalProfile] = useState<ExplorerProfile | null>(
    profile,
  );
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const local = getSavedPlaceIds();
    setSavedCount(local.length);
    void (async () => {
      const synced = await syncWishlistAction(local);
      if (synced.ok) {
        replaceSavedPlaceIds(synced.placeIds);
        setSavedCount(synced.placeIds.length);
      } else {
        const merged = mergeSavedPlaceIds(synced.placeIds ?? local);
        setSavedCount(merged.length);
        console.warn("[wishlist] explorer sync deferred", synced.error);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="container-narrow py-16">
        <p className="text-sm text-muted">Loading your explorer profile…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-narrow py-16">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
          Explorer Profile
        </p>
        <h1 className="mt-2 font-display text-4xl">Join Panora</h1>
        <p className="long-form mt-3 max-w-lg text-sm leading-relaxed text-muted">
          Save places, send enquiries, and belong in the Circle — browsing stays
          free for everyone.
        </p>
        <Button
          type="button"
          variant="gold"
          className="mt-6 rounded-full"
          onClick={() =>
            openAuth({
              kind: "explorer",
              returnTo: "/explorer",
              headline: "Join Panora",
            })
          }
        >
          Join Panora
        </Button>
      </div>
    );
  }

  const name =
    localProfile?.displayName ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Explorer";

  return (
    <div className="container-narrow py-12 sm:py-16">
      <ExplorerOnboarding
        profile={localProfile}
        onComplete={(next) => {
          if (next) setLocalProfile(next);
          void refreshProfile();
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Explorer Profile
          </p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{name}</h1>
          <p className="mt-2 text-sm text-muted">
            {localProfile?.email ?? user.email}
            {localProfile?.passportLevel
              ? ` · Passport: ${localProfile.passportLevel}`
              : null}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => void signOut()}
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        <li>
          <Link
            href="/saved"
            className="focus-ring flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--glass)] p-5 backdrop-blur-md transition hover:border-[var(--accent)]"
          >
            <Heart className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 font-display text-2xl">My Wishlist</p>
            <p className="mt-1 text-sm text-muted">
              {savedCount} saved place{savedCount === 1 ? "" : "s"} · synced
            </p>
          </Link>
        </li>
        <li>
          <Link
            href="/enquiry"
            className="focus-ring flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--glass)] p-5 backdrop-blur-md transition hover:border-[var(--accent)]"
          >
            <CalendarDays className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 font-display text-2xl">Upcoming bookings</p>
            <p className="mt-1 text-sm text-muted">
              Enquiries & tickets — coming into focus
            </p>
          </Link>
        </li>
        <li className="rounded-[var(--radius-xl)] border border-dashed border-[var(--border-strong)] bg-[var(--glass)] p-5 sm:col-span-2">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="font-display text-xl">Collections coming</p>
              <p className="long-form mt-1 text-sm leading-relaxed text-muted">
                Visited, Weekend Ideas, and custom lists — scaffolded for a
                later release. Your wishlist is live today.
              </p>
            </div>
          </div>
        </li>
        <li>
          <Link
            href="/discover"
            className="focus-ring flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--glass)] p-5 backdrop-blur-md transition hover:border-[var(--accent)]"
          >
            <Compass className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-3 font-display text-2xl">Continue Exploring</p>
            <p className="mt-1 text-sm text-muted">
              Discover more of Zimbabwe with Panora Go
            </p>
          </Link>
        </li>
      </ul>

      {Array.isArray(localProfile?.preferences?.vibes) &&
      localProfile.preferences.vibes.length > 0 ? (
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Your vibes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {localProfile.preferences.vibes.map((v) => (
              <span
                key={v}
                className="rounded-full border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1 text-xs font-medium text-[var(--accent)]"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-10 text-xs text-muted">
        Explorer points: {localProfile?.explorerPoints ?? 0} · Passport
        gamification coming soon.
      </p>
    </div>
  );
}
