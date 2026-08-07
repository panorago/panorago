"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoVariant = "full" | "icon";

/** Which surface the logo sits on — picks the high-contrast asset. */
type LogoTone = "auto" | "on-light" | "on-dark";

type PanoraLogoProps = {
  variant?: LogoVariant;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  href?: string | null;
  alt?: string;
  /**
   * `on-dark` → white/gold wordmark (navy Command Center, dark heroes).
   * `on-light` → navy wordmark (light surfaces; force even in dark theme).
   * `auto` → follow `html.dark` via CSS (navy when light, white/gold when dark).
   */
  tone?: LogoTone;
};

/**
 * Asset naming:
 * - `*-light` = navy mark for light surfaces
 * - `*-dark` = white/gold mark for dark surfaces
 */
const LOGO_SRC: Record<LogoVariant, Record<"navy" | "inverse", string>> = {
  full: {
    navy: "/logos/panora-light.web.png",
    inverse: "/logos/panora-dark.web.png",
  },
  icon: {
    navy: "/logos/pgo-light.web.png",
    inverse: "/logos/pgo-dark.web.png",
  },
};

const INTRINSIC: Record<LogoVariant, { width: number; height: number }> = {
  full: { width: 960, height: 266 },
  icon: { width: 960, height: 982 },
};

/**
 * Theme-aware logo without forced square boxes.
 * Visibility is driven by `html.dark` + `data-tone` in globals.css — never by
 * `prefers-color-scheme` — so light theme always shows the navy wordmark.
 */
export function PanoraLogo({
  variant = "full",
  className,
  imageClassName,
  priority = false,
  href = "/",
  alt = variant === "icon" ? "PGO" : "Panora Go",
  tone = "auto",
}: PanoraLogoProps) {
  const intrinsic = INTRINSIC[variant];
  const sizeClass =
    variant === "full"
      ? "h-10 w-auto object-contain"
      : "h-12 w-auto object-contain";

  const mark = (
    <span
      data-tone={tone}
      className={cn(
        "panora-logo relative inline-grid items-center justify-items-start [&>img]:col-start-1 [&>img]:row-start-1",
        className,
      )}
    >
      <Image
        src={LOGO_SRC[variant].navy}
        alt={alt}
        width={intrinsic.width}
        height={intrinsic.height}
        priority={priority}
        className={cn(
          sizeClass,
          "panora-logo-mark panora-logo-mark--navy logo-fade",
          imageClassName,
        )}
        sizes={variant === "full" ? "180px" : "64px"}
      />
      <Image
        src={LOGO_SRC[variant].inverse}
        alt=""
        aria-hidden
        width={intrinsic.width}
        height={intrinsic.height}
        priority={priority}
        className={cn(
          sizeClass,
          "panora-logo-mark panora-logo-mark--inverse logo-fade",
          imageClassName,
        )}
        sizes={variant === "full" ? "180px" : "64px"}
      />
    </span>
  );

  if (href === null) return mark;

  return (
    <Link href={href} className="focus-ring inline-flex items-center" aria-label={alt}>
      {mark}
    </Link>
  );
}
