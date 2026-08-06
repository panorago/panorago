"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type LogoVariant = "full" | "icon";

type PanoraLogoProps = {
  variant?: LogoVariant;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  href?: string | null;
  alt?: string;
};

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
 * - Header: variant="full" → h-10 w-auto object-contain
 * - Footer: variant="icon" → h-12 w-auto object-contain
 * Both light/dark assets stay mounted; opacity swaps to avoid layout shift.
 */
export function PanoraLogo({
  variant = "full",
  className,
  imageClassName,
  priority = false,
  href = "/",
  alt = variant === "icon" ? "PGO" : "Panora Go",
}: PanoraLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const intrinsic = INTRINSIC[variant];
  const sizeClass =
    variant === "full"
      ? "h-10 w-auto object-contain"
      : "h-12 w-auto object-contain";

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
          "transition-opacity duration-300",
          isDark ? "opacity-0" : "opacity-100",
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
          "transition-opacity duration-300",
          isDark ? "opacity-100" : "opacity-0",
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
