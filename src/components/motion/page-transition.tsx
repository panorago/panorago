"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { pageTransition, reducedMotion } from "@/lib/motion/variants";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced
    ? {
        initial: reducedMotion.hidden,
        animate: reducedMotion.visible,
        exit: reducedMotion.hidden,
      }
    : pageTransition;

  return (
    <motion.div
      className={cn("w-full", className)}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
