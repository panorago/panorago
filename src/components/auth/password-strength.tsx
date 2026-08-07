"use client";

import {
  getPasswordChecks,
  passwordStrengthScore,
} from "@/lib/auth/password";
import { cn } from "@/lib/utils";

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;

export function PasswordStrength({ password }: { password: string }) {
  const score = password ? passwordStrengthScore(password) : 0;
  const checks = getPasswordChecks(password);
  const label = password ? LABELS[Math.min(score, 4)] : "";

  return (
    <div className="space-y-2">
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < score
                ? score <= 2
                  ? "bg-[var(--danger)]"
                  : score === 3
                    ? "bg-amber-500"
                    : "bg-[var(--accent)]"
                : "bg-[var(--border)]",
            )}
          />
        ))}
      </div>
      {password ? (
        <p className="text-[11px] text-[var(--foreground-muted)]">
          Strength: <span className="text-[var(--foreground)]">{label}</span>
        </p>
      ) : null}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-[var(--foreground-muted)]">
        {(
          [
            ["minLength", "12+ characters"],
            ["upper", "Uppercase"],
            ["lower", "Lowercase"],
            ["number", "Number"],
            ["special", "Special character"],
          ] as const
        ).map(([key, text]) => (
          <li
            key={key}
            className={cn(checks[key] && "text-[var(--accent)]")}
          >
            {checks[key] ? "✓" : "·"} {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
