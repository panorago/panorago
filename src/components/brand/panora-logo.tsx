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
   * `on-dark` → white/gold wordmark (over dark heroes / navy surfaces).
   * `on-light` → navy wordmark (light surfaces; force even in dark theme).
   * `auto` → navy when light, white/gold when `html.dark` (Tailwind `dark:`).
   */
  tone?: LogoTone;
};

/**
 * Asset naming (verified visually):
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
 * Theme-aware logo. One crisp asset per tone — never dual-opacity stacks.
 * `auto` uses `dark:` keyed to `.dark` via `@custom-variant` — never
 * `prefers-color-scheme` alone.
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
      ? "h-10 w-auto object-contain opacity-100"
      : "h-12 w-auto object-contain opacity-100";
  const sizes = variant === "full" ? "180px" : "64px";
  const navySrc = LOGO_SRC[variant].navy;
  const inverseSrc = LOGO_SRC[variant].inverse;

  const mark = (
    <span
      data-tone={tone}
      className={cn(
        "panora-logo relative inline-grid items-center justify-items-start opacity-100 [&>img]:col-start-1 [&>img]:row-start-1",
        className,
      )}
    >
      {tone === "on-dark" ? (
        <Image
          src={inverseSrc}
          alt={alt}
          width={intrinsic.width}
          height={intrinsic.height}
          priority={priority}
          className={cn(sizeClass, imageClassName)}
          sizes={sizes}
        />
      ) : null}

      {tone === "on-light" ? (
        <Image
          src={navySrc}
          alt={alt}
          width={intrinsic.width}
          height={intrinsic.height}
          priority={priority}
          className={cn(sizeClass, imageClassName)}
          sizes={sizes}
        />
      ) : null}

      {tone === "auto" ? (
        <>
          <Image
            src={navySrc}
            alt={alt}
            width={intrinsic.width}
            height={intrinsic.height}
            priority={priority}
            className={cn(sizeClass, "block dark:hidden", imageClassName)}
            sizes={sizes}
          />
          <Image
            src={inverseSrc}
            alt={alt}
            width={intrinsic.width}
            height={intrinsic.height}
            priority={priority}
            className={cn(sizeClass, "hidden dark:block", imageClassName)}
            sizes={sizes}
          />
        </>
      ) : null}
    </span>
  );

  if (href === null) return mark;

  return (
    <Link
      href={href}
      className="focus-ring inline-flex items-center opacity-100"
      aria-label={alt}
    >
      {mark}
    </Link>
  );
}
