"use client";

import { Button } from "@/components/ui/button";
import { PanoraLogo } from "@/components/brand/panora-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { changeOwnPassword, type ActionResult } from "@/lib/admin/actions";
import { useActionState } from "react";

const initial: ActionResult | null = null;

export default function AdminChangePasswordPage() {
  const [state, formAction, pending] = useActionState(changeOwnPassword, initial);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_55%),linear-gradient(180deg,var(--background),var(--background-elevated))]"
      />
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="relative w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--glass-strong)] p-8 shadow-[var(--shadow)] backdrop-blur-2xl"
      >
        <PanoraLogo
          variant="full"
          href={null}
          tone="auto"
          priority
          imageClassName="h-9 w-auto"
        />
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Security
        </p>
        <h1
          id="change-password-title"
          className="mt-2 font-display text-3xl"
        >
          Change your password
        </h1>
        <p className="mt-2 text-sm text-muted">
          You must set a new password before using Command Center. Use at least
          8 characters, and do not reuse the launch default.
        </p>

        <form action={formAction} className="mt-8 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted">New password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted">
              Confirm password
            </span>
            <input
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
          {state && !state.ok && (
            <p className="text-sm text-[var(--danger)]">{state.error}</p>
          )}
          <Button
            type="submit"
            variant="accent"
            className="w-full rounded-full"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save password & continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
