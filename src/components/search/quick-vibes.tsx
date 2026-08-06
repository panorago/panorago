"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { motionTokens, staggerFast, fadeUp } from "@/lib/motion/variants";
import type { MoodTag } from "@/types";

export const QUICK_VIBES: {
  vibe: MoodTag;
  emoji: string;
  label: string;
}[] = [
  { vibe: "Golden Hour", emoji: "✨", label: "Golden Hour" },
  { vibe: "Date Night", emoji: "🍷", label: "Date Night" },
  { vibe: "Hidden Escape", emoji: "🌿", label: "Hidden Escape" },
  { vibe: "Weekend Away", emoji: "🏕", label: "Weekend Away" },
  { vibe: "Coffee Ritual", emoji: "☕", label: "Coffee Ritual" },
  { vibe: "Tonight", emoji: "🎉", label: "Tonight" },
];

type QuickVibesProps = {
  className?: string;
  activeVibe?: MoodTag;
  /** Light-on-dark styling for hero overlays */
  onLight?: boolean;
  onSelect?: (vibe: MoodTag) => void;
};

export function QuickVibes({
  className,
  activeVibe,
  onLight = false,
  onSelect,
}: QuickVibesProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.ul
      className={cn("flex flex-wrap gap-2 sm:gap-2.5", className)}
      variants={reduceMotion ? undefined : staggerFast}
      initial="hidden"
      animate="visible"
    >
      {QUICK_VIBES.map((item) => {
        const href = `/discover?vibe=${encodeURIComponent(item.vibe)}`;
        const active = activeVibe === item.vibe;
        const chipClass = cn(
          "focus-ring inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium",
          "border backdrop-blur-md transition-[border-color,box-shadow,transform,background-color] duration-300",
          onLight
            ? cn(
                "border-white/25 bg-white/12 text-white shadow-[0_8px_28px_rgba(0,0,0,0.25)]",
                "hover:border-[var(--accent)] hover:bg-white/18",
                active && "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_28%,transparent)] text-white",
              )
            : cn(
                "border-[var(--border)] bg-[var(--glass)] text-[var(--foreground)] shadow-[var(--shadow)]",
                "hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] hover:shadow-[var(--shadow-gold)]",
                active &&
                  "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)] shadow-[var(--shadow-gold)]",
              ),
        );

        const content = (
          <>
            <span aria-hidden className="text-base leading-none">
              {item.emoji}
            </span>
            <span>{item.label}</span>
          </>
        );

        return (
          <motion.li
            key={item.vibe}
            variants={reduceMotion ? undefined : fadeUp}
          >
            {onSelect ? (
              <motion.button
                type="button"
                className={chipClass}
                aria-pressed={active}
                onClick={() => onSelect(item.vibe)}
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={motionTokens.spring.soft}
              >
                {content}
              </motion.button>
            ) : (
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={motionTokens.spring.soft}
              >
                <Link
                  href={href}
                  className={chipClass}
                  aria-current={active ? "page" : undefined}
                >
                  {content}
                </Link>
              </motion.div>
            )}
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
