"use client";

import {
  createAdminAccountFormAction,
  type ActionResult,
} from "@/lib/admin/command";
import { useActionState } from "react";

const initial: ActionResult | null = null;

export function CreateAdminAccountForm() {
  const [state, formAction, pending] = useActionState(
    createAdminAccountFormAction,
    initial,
  );

  return (
    <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 sm:col-span-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="name@panorago.co.zw"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      </label>
      <label className="space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Display name
        </span>
        <input
          name="displayName"
          type="text"
          autoComplete="off"
          placeholder="Optional"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      </label>
      <label className="space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Role
        </span>
        <select
          name="role"
          defaultValue="admin"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="admin">admin</option>
          <option value="editor">editor</option>
          <option value="viewer">viewer</option>
        </select>
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Temporary password
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Min. 8 characters — user must change on first login"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      </label>
      {state && !state.ok && (
        <p className="text-sm text-[var(--danger)] sm:col-span-2">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-[var(--success)] sm:col-span-2">
          {state.message ?? "Account created."}
        </p>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-xs font-medium text-[var(--accent-foreground,#fff)] hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create account"}
        </button>
      </div>
    </form>
  );
}
