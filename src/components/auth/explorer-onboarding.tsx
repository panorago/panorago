"use client";

import { saveExplorerPreferencesAction } from "@/lib/auth/actions";
import type { ExplorerProfile } from "@/lib/auth/profile";
import { motionTokens } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const VIBES = [
  "Nature",
  "Food",
  "Luxury",
  "Adventure",
  "Culture",
  "Nightlife",
  "Wellness",
  "Weekend",
] as const;

type ExplorerOnboardingProps = {
  profile: ExplorerProfile | null;
  onComplete: (profile?: ExplorerProfile) => void;
};

function ConfettiBurst({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();
  if (!active || reduceMotion) return null;
  const pieces = Array.from({ length: 18 });
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {pieces.map((_, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/3 h-2 w-2 rounded-sm"
          style={{
            background:
              i % 3 === 0
                ? "#C29B62"
                : i % 3 === 1
                  ? "#0A192F"
                  : "rgba(255,255,255,0.85)",
          }}
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
            rotate: 0,
            scale: 1,
          }}
          animate={{
            x: (Math.random() - 0.5) * 280,
            y: 120 + Math.random() * 160,
            opacity: 0,
            rotate: Math.random() * 360,
            scale: 0.4,
          }}
          transition={{
            duration: 1.1 + Math.random() * 0.4,
            ease: motionTokens.ease.out,
          }}
        />
      ))}
    </div>
  );
}

export function ExplorerOnboarding({
  profile,
  onComplete,
}: ExplorerOnboardingProps) {
  const reduceMotion = useReducedMotion();
  const already =
    Boolean(profile?.preferences?.onboarded) ||
    (Array.isArray(profile?.preferences?.vibes) &&
      (profile?.preferences?.vibes?.length ?? 0) > 0);

  const [open, setOpen] = useState(!already);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    if (already) setOpen(false);
  }, [already]);

  if (!open) return null;

  async function finish() {
    setPending(true);
    const result = await saveExplorerPreferencesAction(selected);
    setPending(false);
    if (result.ok) {
      setConfetti(true);
      window.setTimeout(() => {
        setOpen(false);
        onComplete(result.profile);
      }, reduceMotion ? 0 : 900);
    } else {
      setOpen(false);
      onComplete();
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="relative mb-8 overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--glass-strong)] p-6 shadow-[var(--shadow-gold)] backdrop-blur-2xl sm:p-8"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: motionTokens.duration.base }}
        >
          <ConfettiBurst active={confetti} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Explorer Profile
          </p>
          <h2 className="mt-2 font-display text-3xl text-[var(--foreground)]">
            Welcome to Panora.
          </h2>
          <p className="mt-2 max-w-lg text-sm text-[var(--foreground-muted)]">
            Discover. Connect. Belong. Pick a few vibes so we can shape your
            journey.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {VIBES.map((vibe) => {
              const on = selected.includes(vibe);
              return (
                <button
                  key={vibe}
                  type="button"
                  onClick={() =>
                    setSelected((prev) =>
                      on ? prev.filter((x) => x !== vibe) : [...prev, vibe],
                    )
                  }
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition",
                    on
                      ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--accent)]",
                  )}
                >
                  {vibe}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="gold"
              className="rounded-full"
              disabled={pending}
              onClick={() => void finish()}
            >
              {pending ? "Saving…" : "Continue Exploring"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              disabled={pending}
              onClick={() => void finish()}
            >
              Skip for now
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
