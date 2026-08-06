import {
  BadgeCheck,
  Camera,
  CircleDollarSign,
  Droplets,
  Satellite,
  Sun,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const BADGE_META: Record<
  string,
  { label: string; icon: LucideIcon }
> = {
  photos_verified: { label: "Photos verified", icon: Camera },
  accurate_pricing: { label: "Accurate pricing", icon: CircleDollarSign },
  family_friendly: { label: "Family friendly", icon: Users },
  solar_power: { label: "Solar power", icon: Sun },
  borehole_water: { label: "Borehole water", icon: Droplets },
  starlink: { label: "Starlink internet", icon: Satellite },
};

type VerificationBadgesProps = {
  keys: string[];
  className?: string;
  /** Always show Panora Verified as lead badge when true */
  showPanoraVerified?: boolean;
};

export function VerificationBadges({
  keys,
  className,
  showPanoraVerified = true,
}: VerificationBadgesProps) {
  const items = [
    ...(showPanoraVerified
      ? [{ key: "panora_verified", label: "Panora Verified", icon: BadgeCheck }]
      : []),
    ...keys.map((key) => {
      const meta = BADGE_META[key];
      return {
        key,
        label: meta?.label ?? key.replace(/_/g, " "),
        icon: meta?.icon ?? BadgeCheck,
      };
    }),
  ];

  if (!items.length) return null;

  return (
    <ul
      className={cn("flex flex-wrap gap-2.5", className)}
      aria-label="Panora verification badges"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isLead = item.key === "panora_verified";
        return (
          <li key={item.key}>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold tracking-wide shadow-[var(--shadow-gold)]",
                isLead
                  ? "border border-[var(--accent)] bg-[var(--accent)] text-[var(--brand-navy)]"
                  : "border border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)]",
              )}
            >
              <Icon
                className={cn("h-4 w-4", isLead ? "text-[var(--brand-navy)]" : "")}
                strokeWidth={2.25}
                aria-hidden
              />
              {item.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
