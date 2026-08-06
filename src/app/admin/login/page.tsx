"use client";

import { Button } from "@/components/ui/button";
import { loginAdmin, type ActionResult } from "@/lib/admin/actions";
import { useActionState } from "react";

const initial: ActionResult | null = null;

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAdmin, initial);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-elevated)] p-8 shadow-[var(--shadow)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Restricted
        </p>
        <h1 className="mt-2 font-display text-3xl">Admin sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Panora Go editorial access only.
        </p>

        <form action={formAction} className="mt-8 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
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
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
