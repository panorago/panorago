"use client";

import {
  MotionConfig,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  fadeUp,
  reducedMotion,
  staggerContainer,
  staggerFast,
} from "@/lib/motion/variants";

type RevealAs =
  | "div"
  | "section"
  | "article"
  | "ul"
  | "li"
  | "header"
  | "footer"
  | "main"
  | "nav"
  | "span";

type RevealProps = {
  as?: RevealAs;
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
  amount?: number | "some" | "all";
} & Omit<HTMLMotionProps<"div">, "children">;

const motionMap = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  ul: motion.ul,
  li: motion.li,
  header: motion.header,
  footer: motion.footer,
  main: motion.main,
  nav: motion.nav,
  span: motion.span,
} as const;

export function Reveal({
  as = "div",
  children,
  className,
  delay = 0,
  once = true,
  amount = 0.2,
  ...props
}: RevealProps) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? reducedMotion : fadeUp;
  const MotionTag = motionMap[as] as typeof motion.div;

  return (
    <MotionTag
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin: "-50px" }}
      transition={
        prefersReduced
          ? { duration: 0.01 }
          : delay
            ? { delay }
            : undefined
      }
      {...(props as HTMLMotionProps<"div">)}
    >
      {children}
    </MotionTag>
  );
}

type StaggerProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  className?: string;
  fast?: boolean;
  once?: boolean;
  amount?: number | "some" | "all";
};

export function Stagger({
  children,
  className,
  fast = false,
  once = true,
  amount = 0.15,
  ...props
}: StaggerProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      variants={
        prefersReduced
          ? reducedMotion
          : fast
            ? staggerFast
            : staggerContainer
      }
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin: "-50px" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type ReducedMotionConfigProps = {
  children: ReactNode;
};

export function ReducedMotionConfig({ children }: ReducedMotionConfigProps) {
  const prefersReduced = useReducedMotion();

  return (
    <MotionConfig reducedMotion={prefersReduced ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}

export { MotionConfig };
