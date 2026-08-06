"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PanoraAtmosphere } from "@/lib/panora/atmospheres";
import { fadeUp, staggerFast } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";

type AtmosphereBadgesProps = {
  atmospheres: PanoraAtmosphere[];
  className?: string;
  /** Dark glass on hero overlays */
  onDark?: boolean;
  animated?: boolean;
};

export function AtmosphereBadges({
  atmospheres,
  className,
  onDark = false,
  animated = true,
}: AtmosphereBadgesProps) {
  const reduceMotion = useReducedMotion();

  if (atmospheres.length === 0) return null;

  const list = (
    <motion.ul
      className={cn("flex flex-wrap gap-2", className)}
      variants={reduceMotion || !animated ? undefined : staggerFast}
      initial={animated ? "hidden" : undefined}
      whileInView={animated ? "visible" : undefined}
      viewport={{ once: true, margin: "-40px" }}
    >
      {atmospheres.map((atmosphere) => (
        <motion.li
          key={atmosphere.id}
          variants={reduceMotion || !animated ? undefined : fadeUp}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide backdrop-blur-md",
            onDark
              ? "border-[var(--brand-gold)]/35 bg-white/10 text-white"
              : "border-[var(--accent)]/35 bg-[var(--glass)] text-[var(--foreground)]",
          )}
          title={atmosphere.whisper}
        >
          {atmosphere.label}
        </motion.li>
      ))}
    </motion.ul>
  );

  return list;
}
