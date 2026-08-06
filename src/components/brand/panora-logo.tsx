"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";

type LogoVariant = "full" | "icon";

type PanoraLogoProps = {
  variant?: LogoVariant;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  href?: string | null;
  alt?: string;
  /** Extra visual scale for accessibility without changing layout box much */
  zoom?: number;
};

const LOGO_SRC: Record<
  LogoVariant,
  Record<"light" | "dark", string>
> = {
  full: {
    light: "/logos/panora-light.web.png",
    dark: "/logos/panora-dark.web.png",
  },
  icon: {
    light: "/logos/pgo-light.web.png",
    dark: "/logos/pgo-dark.web.png",
  },
};

/** Larger defaults for readability (including low vision). */
const DEFAULT_SIZE: Record<LogoVariant, { width: number; height: number }> = {
  full: { width: 188, height: 52 },
  icon: { width: 48, height: 48 },
};

export function PanoraLogo({
  variant = "full",
  width,
  height,
  className,
  priority = false,
  href = "/",
  alt = "Panora Go",
  zoom = 1.08,
}: PanoraLogoProps) {
  const { resolvedTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mode: "light" | "dark" =
    mounted && resolvedTheme === "dark" ? "dark" : "light";

  const w = width ?? DEFAULT_SIZE[variant].width;
  const h = height ?? DEFAULT_SIZE[variant].height;
  const src = LOGO_SRC[variant][mode];

  const image = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={src}
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden rounded-[var(--radius-sm)]",
          className,
        )}
        style={{ width: w, height: h }}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={{
          duration: motionTokens.duration.base,
          ease: motionTokens.ease.out,
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={Math.round(w * 1.35)}
          height={Math.round(h * 1.35)}
          priority={priority}
          className="h-full w-full object-contain"
          style={{ transform: `scale(${zoom})` }}
          sizes={`${Math.round(w * 2)}px`}
        />
      </motion.span>
    </AnimatePresence>
  );

  if (href === null) return image;

  return (
    <Link
      href={href}
      className="focus-ring inline-flex rounded-[var(--radius-sm)]"
      aria-label={alt}
    >
      {image}
    </Link>
  );
}

/** Brand lockup: PGO mark + full wordmark for maximum recognition. */
export function PanoraBrandLockup({
  className,
  scrolled = false,
}: {
  className?: string;
  scrolled?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <PanoraLogo
        variant="icon"
        width={scrolled ? 44 : 52}
        height={scrolled ? 44 : 52}
        zoom={1.12}
        priority
        alt="PGO"
        className="bg-[var(--brand-navy)] ring-1 ring-[var(--border)]"
      />
      <PanoraLogo
        variant="full"
        width={scrolled ? 168 : 196}
        height={scrolled ? 46 : 54}
        zoom={1.14}
        priority
        className="bg-[var(--brand-navy)] ring-1 ring-[var(--border)]"
      />
    </div>
  );
}
