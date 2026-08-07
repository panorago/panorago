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
   * `on-dark` → white/gold wordmark (navy Command Center, dark UI).
   * `on-light` → navy wordmark (light surfaces).
   * `auto` → follow `html.dark` via CSS (no hydration flash).
   */
  tone?: LogoTone;
};

/**
 * Asset naming:
 * - `*-light` = navy mark for light surfaces
 * - `*-dark` = white/gold mark for dark surfaces
 */
const LOGO_SRC: Record<LogoVariant, Record<"light" | "dark", string>> = {
  full: {
    light: "/logos/panora-light.web.png",
    dark: "/logos/panora-dark.web.png",
  },
  icon: {
    light: "/logos/pgo-light.web.png",
    dark: "/logos/pgo-dark.web.png",
  },
};

const INTRINSIC: Record<LogoVariant, { width: number; height: number }> = {
  full: { width: 960, height: 266 },
  icon: { width: 960, height: 982 },
};

/**
 * Theme-aware logo without forced square boxes.
 * Both assets stay mounted; opacity crossfades. For `tone="auto"`, visibility
 * is driven by the `dark` class on `html` so the correct mark shows as soon as
 * next-themes applies the class (before React hydrates).
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

  const lightOpacity =
    tone === "on-dark"
      ? "opacity-0"
      : tone === "on-light"
        ? "opacity-100"
        : "opacity-100 dark:opacity-0";

  const darkOpacity =
    tone === "on-dark"
      ? "opacity-100"
      : tone === "on-light"
        ? "opacity-0"
        : "opacity-0 dark:opacity-100";

  const mark = (
    <span
      className={cn(
        "relative inline-grid items-center justify-items-start [&>img]:col-start-1 [&>img]:row-start-1",
        className,
      )}
    >
      <Image
        src={LOGO_SRC[variant].light}
        alt={alt}
        width={intrinsic.width}
        height={intrinsic.height}
        priority={priority}
        className={cn(
          sizeClass,
          "logo-fade",
          lightOpacity,
          imageClassName,
        )}
        sizes={variant === "full" ? "180px" : "64px"}
      />
      <Image
        src={LOGO_SRC[variant].dark}
        alt=""
        aria-hidden
        width={intrinsic.width}
        height={intrinsic.height}
        priority={priority}
        className={cn(
          sizeClass,
          "logo-fade",
          darkOpacity,
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
