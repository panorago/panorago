"use client";

import { AuthEmailForm } from "@/components/auth/auth-email-form";
import { PanoraLogo } from "@/components/brand/panora-logo";
import { ProgressiveImage } from "@/components/media/progressive-image";
import { Button } from "@/components/ui/button";
import type { AuthIntent } from "@/lib/auth/intent";
import { writeAuthIntent } from "@/lib/auth/intent";
import { createClient } from "@/lib/supabase/client";
import { mapSupabaseAuthError } from "@/lib/supabase/config";
import { motionTokens } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { Heart, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

type AuthModalProps = {
  open: boolean;
  intent: AuthIntent | null;
  onClose: () => void;
  onAuthenticated: () => void;
};

function headlineFor(intent: AuthIntent | null, welcomeBack: boolean) {
  if (intent?.headline) return intent.headline;
  if (welcomeBack) return "Welcome Back";
  if (intent?.kind === "save") return "Save this experience forever.";
  if (intent?.kind === "enquiry") return "Save Your Journey";
  if (intent?.kind === "circle_post") return "Join Panora to share.";
  return "Join Panora";
}

function subtitleFor(intent: AuthIntent | null, welcomeBack: boolean) {
  if (intent?.subtitle) return intent.subtitle;
  if (welcomeBack) {
    return "Continue exploring Zimbabwe’s finest — your wishlist and bookings travel with you.";
  }
  if (intent?.kind === "save") {
    return "Create a free Panora account to keep this place on your wishlist across devices.";
  }
  if (intent?.kind === "enquiry") {
    return "A Panora account keeps your enquiries and tickets in one place.";
  }
  if (intent?.kind === "circle_post") {
    return "Reading the Circle is free. Posting a moment needs a Panora account.";
  }
  return "Discover. Connect. Belong. — one account for saves, bookings, and Circle.";
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthModal({
  open,
  intent,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const [showEmail, setShowEmail] = useState(false);
  const [welcomeBack, setWelcomeBack] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);

  const place = intent?.place;
  const returnTo =
    intent?.returnTo ||
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) {
      setShowEmail(false);
      setWelcomeBack(false);
      setError(null);
      setGooglePending(false);
      return;
    }
    document.body.style.overflow = "hidden";
    if (intent?.kind === "save") {
      setHeartPulse(true);
      const t = window.setTimeout(() => setHeartPulse(false), 900);
      return () => {
        document.body.style.overflow = "";
        window.clearTimeout(t);
      };
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, intent?.kind]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function continueWithGoogle() {
    setError(null);
    setGooglePending(true);
    try {
      if (intent) writeAuthIntent(intent);
      const next = intent?.returnTo || returnTo;
      const origin = window.location.origin;
      const supabase = createClient();
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account",
          },
        },
      });
      if (oauthError || !data.url) {
        setError(
          mapSupabaseAuthError(
            oauthError?.message ?? "Google sign-in unavailable.",
          ),
        );
        setGooglePending(false);
        return;
      }
      window.location.assign(data.url);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Google sign-in unavailable.",
      );
      setGooglePending(false);
    }
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 100 || info.velocity.y > 600) onClose();
  }

  const panel = (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={cn(
        "relative w-full overflow-hidden border border-[var(--border)] bg-[var(--glass-strong)] shadow-[var(--nav-shadow)] backdrop-blur-2xl",
        isMobile
          ? "max-h-[92dvh] rounded-t-[1.75rem] border-b-0"
          : "max-w-md rounded-[1.75rem] shadow-[var(--shadow-gold)]",
      )}
      initial={
        reduceMotion
          ? false
          : isMobile
            ? { y: "100%" }
            : { opacity: 0, scale: 0.96, y: 12 }
      }
      animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
      exit={
        reduceMotion
          ? undefined
          : isMobile
            ? { y: "100%" }
            : { opacity: 0, scale: 0.96, y: 8 }
      }
      transition={
        reduceMotion
          ? { duration: 0.01 }
          : isMobile
            ? motionTokens.spring.soft
            : {
                duration: motionTokens.duration.base,
                ease: motionTokens.ease.premium,
              }
      }
      drag={isMobile ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.05, bottom: 0.55 }}
      onDragEnd={isMobile ? onDragEnd : undefined}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_55%)]"
      />

      {isMobile ? (
        <div className="relative flex justify-center pt-3" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
        </div>
      ) : null}

      <button
        type="button"
        onClick={onClose}
        className="focus-ring absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--glass)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        aria-label="Continue Exploring"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative max-h-[calc(92dvh-1rem)] overflow-y-auto px-5 pb-6 pt-4 sm:px-7 sm:pb-8 sm:pt-6">
        <div className="mb-5 flex items-center gap-3">
          <PanoraLogo
            variant="full"
            href={null}
            tone="auto"
            priority
            imageClassName="h-8 w-auto opacity-100"
          />
        </div>

        {place?.imageUrl || place?.placeName ? (
          <div className="mb-5 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
            <div className="relative aspect-[16/9]">
              {place.imageUrl ? (
                <ProgressiveImage
                  src={place.imageUrl}
                  alt={place.placeName ?? "Place"}
                  fill
                  sizes="400px"
                  className="object-cover"
                  containerClassName="absolute inset-0"
                />
              ) : (
                <div className="absolute inset-0 bg-[var(--brand-navy)]" />
              )}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[rgba(10,25,47,0.85)] via-transparent to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
                <div className="min-w-0">
                  {place.placeName ? (
                    <p className="truncate font-display text-lg text-white">
                      {place.placeName}
                    </p>
                  ) : null}
                  {place.atmospheres && place.atmospheres.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {place.atmospheres.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <motion.span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-[var(--accent)] backdrop-blur-md"
                  animate={
                    heartPulse && !reduceMotion
                      ? { scale: [1, 1.25, 1] }
                      : { scale: 1 }
                  }
                  transition={{
                    duration: 0.55,
                    ease: motionTokens.ease.premium,
                  }}
                >
                  <Heart className="h-4 w-4 fill-[var(--accent)]" />
                </motion.span>
              </div>
            </div>
          </div>
        ) : null}

        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
          {welcomeBack ? "Welcome Back" : "Join Panora"}
        </p>
        <h2
          id={titleId}
          className="mt-2 font-display text-3xl leading-tight text-[var(--foreground)]"
        >
          {headlineFor(intent, welcomeBack)}
        </h2>
        <p className="long-form mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
          {subtitleFor(intent, welcomeBack)}
        </p>

        <div className="mt-6 space-y-3">
          {!showEmail ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full border-[var(--border-strong)] bg-[var(--background-elevated)]/70"
                disabled={googlePending}
                onClick={() => void continueWithGoogle()}
              >
                <GoogleMark className="h-4 w-4" />
                {googlePending ? "Redirecting…" : "Continue with Google"}
              </Button>
              <Button
                type="button"
                variant="primary"
                className="w-full rounded-full"
                onClick={() => setShowEmail(true)}
              >
                Continue with Email
              </Button>
              <p className="text-center text-xs text-[var(--foreground-muted)]">
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-semibold text-[var(--accent)] hover:underline"
                  onClick={() => {
                    setWelcomeBack(true);
                    setShowEmail(true);
                  }}
                >
                  Welcome Back
                </button>
              </p>
            </>
          ) : (
            <AuthEmailForm
              key={welcomeBack ? "signin" : "join"}
              initialMode={welcomeBack ? "signin" : "join"}
              returnTo={returnTo}
              onSuccess={onAuthenticated}
              onModeChange={(m) => setWelcomeBack(m === "signin")}
            />
          )}

          {error ? (
            <p className="text-center text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="mx-auto block text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn(
            "fixed inset-0 z-[120] flex",
            isMobile
              ? "items-end justify-center"
              : "items-center justify-center p-4",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.duration.fast }}
        >
          <motion.button
            type="button"
            aria-label="Continue Exploring"
            className="absolute inset-0 bg-[rgba(10,25,47,0.55)] backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="relative z-10 w-full max-w-md">{panel}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
