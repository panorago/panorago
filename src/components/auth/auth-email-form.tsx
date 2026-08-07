"use client";

import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import {
  sendMagicLinkAction,
  sendPasswordResetAction,
  signInWithEmailAction,
  signUpWithEmailAction,
} from "@/lib/auth/actions";
import { useState } from "react";

type Mode = "join" | "signin" | "forgot" | "magic";

type AuthEmailFormProps = {
  initialMode?: Mode;
  onSuccess: () => void;
  onModeChange?: (mode: Mode) => void;
};

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export function AuthEmailForm({
  initialMode = "join",
  onSuccess,
  onModeChange,
}: AuthEmailFormProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setMessage(null);
    onModeChange?.(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      if (mode === "join") {
        const result = await signUpWithEmailAction({
          email,
          password,
          displayName,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (result.needsEmailConfirm) {
          setMessage(result.message ?? "Check your email to continue.");
          return;
        }
        onSuccess();
        return;
      }
      if (mode === "signin") {
        const result = await signInWithEmailAction({ email, password });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onSuccess();
        return;
      }
      if (mode === "forgot") {
        const result = await sendPasswordResetAction(email);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setMessage(result.message ?? "Check your email.");
        return;
      }
      if (mode === "magic") {
        const result = await sendMagicLinkAction(email);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setMessage(result.message ?? "Check your email.");
      }
    } finally {
      setPending(false);
    }
  }

  const title =
    mode === "join"
      ? "Continue with Email"
      : mode === "signin"
        ? "Welcome Back"
        : mode === "forgot"
          ? "Reset password"
          : "Magic link";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>

      {mode === "join" ? (
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Display name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            placeholder="How should we greet you?"
            className={fieldClass}
          />
        </label>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          className={fieldClass}
        />
      </label>

      {mode === "join" || mode === "signin" ? (
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === "join" ? "new-password" : "current-password"
            }
            className={fieldClass}
          />
        </label>
      ) : null}

      {mode === "join" ? <PasswordStrength password={password} /> : null}

      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--accent)]" role="status">
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="gold"
        className="w-full rounded-full"
        disabled={pending}
      >
        {pending
          ? "Please wait…"
          : mode === "join"
            ? "Join Panora"
            : mode === "signin"
              ? "Welcome Back"
              : mode === "forgot"
                ? "Send reset link"
                : "Send magic link"}
      </Button>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[var(--foreground-muted)]">
        {mode === "join" ? (
          <button
            type="button"
            className="font-medium text-[var(--accent)] hover:underline"
            onClick={() => switchMode("signin")}
          >
            Already have an account? Sign In
          </button>
        ) : null}
        {mode === "signin" ? (
          <>
            <button
              type="button"
              className="font-medium text-[var(--accent)] hover:underline"
              onClick={() => switchMode("join")}
            >
              Join Panora
            </button>
            <button
              type="button"
              className="hover:underline"
              onClick={() => switchMode("forgot")}
            >
              Forgot password
            </button>
            <button
              type="button"
              className="hover:underline"
              onClick={() => switchMode("magic")}
            >
              Magic link
            </button>
          </>
        ) : null}
        {mode === "forgot" || mode === "magic" ? (
          <button
            type="button"
            className="font-medium text-[var(--accent)] hover:underline"
            onClick={() => switchMode("signin")}
          >
            Welcome Back
          </button>
        ) : null}
      </div>
    </form>
  );
}
