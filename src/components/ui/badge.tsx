import { BadgeCheck } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = {
  soft:
    "bg-[var(--glass)] text-[var(--foreground)] border border-[var(--border)] backdrop-blur-md",
  muted:
    "bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-transparent",
  outline:
    "bg-transparent text-[var(--foreground-muted)] border border-[var(--border)]",
  gold:
    "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)] border border-[color-mix(in_srgb,var(--accent)_40%,transparent)]",
  verified:
    "bg-[var(--accent)] text-[var(--brand-navy)] border border-[var(--accent)] shadow-[var(--shadow-gold)] font-semibold",
} as const;

type BadgeVariant = keyof typeof badgeVariants;

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({
  children,
  variant = "soft",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

type VerifiedBadgeProps = {
  className?: string;
  label?: string;
};

export function VerifiedBadge({
  className,
  label = "Panora Verified",
}: VerifiedBadgeProps) {
  return (
    <Badge
      variant="verified"
      className={cn("px-3 py-1.5 text-sm font-semibold", className)}
    >
      <BadgeCheck className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      {label}
    </Badge>
  );
}
