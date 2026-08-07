"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  function toggle() {
    if (!mounted) return;
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        !mounted
          ? "Toggle theme"
          : isDark
            ? "Switch to light theme"
            : "Switch to dark theme"
      }
      className={cn(
        "focus-ring relative inline-flex h-10 w-[4.25rem] shrink-0 items-center rounded-full",
        "border border-[var(--border)] bg-[var(--glass)] backdrop-blur-xl",
        "shadow-[var(--shadow)] transition-[box-shadow,background-color,border-color] duration-300",
        "hover:shadow-[var(--shadow-gold)]",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
      >
        <span
          className={cn(
            "absolute inset-0 opacity-40 transition-opacity duration-500 dark:opacity-80",
            mounted && (isDark ? "opacity-80" : "opacity-40"),
          )}
          style={{
            background:
              "radial-gradient(circle at 70% 50%, rgba(200,164,106,0.45), transparent 55%)",
          }}
        />
      </span>

      {mounted ? (
        <motion.span
          aria-hidden
          className="absolute top-1 left-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--background-elevated)] shadow-[var(--shadow-gold)]"
          animate={{ x: isDark ? 28 : 0 }}
          transition={
            reduceMotion ? { duration: 0.01 } : motionTokens.spring.snappy
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isDark ? "moon" : "sun"}
              initial={
                reduceMotion ? false : { opacity: 0, rotate: -40, scale: 0.7 }
              }
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, rotate: 40, scale: 0.7 }
              }
              transition={{
                duration: motionTokens.duration.fast,
                ease: motionTokens.ease.out,
              }}
              className="flex text-[var(--accent)]"
            >
              {isDark ? (
                <Moon className="h-4 w-4 fill-current" strokeWidth={1.75} />
              ) : (
                <Sun className="h-4 w-4 fill-current" strokeWidth={1.75} />
              )}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      ) : (
        <span
          aria-hidden
          className="absolute top-1 left-1 z-10 flex h-8 w-8 translate-x-0 items-center justify-center rounded-full bg-[var(--background-elevated)] shadow-[var(--shadow-gold)] dark:translate-x-7"
        >
          <Sun className="h-4 w-4 text-[var(--accent)] dark:hidden" strokeWidth={1.75} />
          <Moon
            className="hidden h-4 w-4 fill-current text-[var(--accent)] dark:block"
            strokeWidth={1.75}
          />
        </span>
      )}

      <span className="sr-only">
        {mounted ? (isDark ? "Dark mode" : "Light mode") : "Theme"}
      </span>
    </button>
  );
}
