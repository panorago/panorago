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

const DEFAULT_SIZE: Record<LogoVariant, { width: number; height: number }> = {
  full: { width: 148, height: 40 },
  icon: { width: 40, height: 40 },
};

export function PanoraLogo({
  variant = "full",
  width,
  height,
  className,
  priority = false,
  href = "/",
  alt = "Panora Go",
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
        className={cn("relative inline-flex items-center", className)}
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
          width={w}
          height={h}
          priority={priority}
          className="h-full w-full object-contain"
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
