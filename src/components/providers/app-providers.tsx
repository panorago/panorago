"use client";

import {
  ThemeProvider,
  useTheme,
  type ThemeProviderProps,
} from "next-themes";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { motionTokens } from "@/lib/motion/variants";

function ThemeTransitionOverlay() {
  const { resolvedTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [wipeKey, setWipeKey] = useState(0);
  const [active, setActive] = useState(false);
  const prevTheme = useRef<string | undefined>(undefined);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prevTheme.current = resolvedTheme;
      return;
    }
    if (!resolvedTheme || resolvedTheme === prevTheme.current) return;
    prevTheme.current = resolvedTheme;
    if (reduceMotion) return;
    setWipeKey((k) => k + 1);
    setActive(true);
  }, [resolvedTheme, reduceMotion]);

  const handleComplete = useCallback(() => {
    setActive(false);
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={wipeKey}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.duration.fast }}
          onAnimationComplete={handleComplete}
        >
          <motion.div
            className="absolute left-1/2 top-1/2 h-[220vmax] w-[220vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(200,164,106,0.55) 0%, rgba(247,243,236,0.72) 42%, rgba(247,243,236,0) 70%)",
            }}
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{
              duration: motionTokens.duration.slower,
              ease: motionTokens.ease.premium,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type AppProvidersProps = {
  children: ReactNode;
  themeProps?: Omit<ThemeProviderProps, "children">;
};

export function AppProviders({ children, themeProps }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      {...themeProps}
    >
      {children}
      <ThemeTransitionOverlay />
    </ThemeProvider>
  );
}
