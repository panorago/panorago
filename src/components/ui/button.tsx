"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";

const variantStyles = {
  primary:
    "bg-[var(--brand-navy)] text-[var(--brand-white)] hover:shadow-[var(--shadow-gold)] border border-transparent",
  secondary:
    "bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)] hover:border-[var(--border-strong)]",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--glass)] border border-transparent",
  gold:
    "bg-[var(--accent)] text-[var(--accent-foreground)] border border-transparent shadow-[var(--shadow-gold)] hover:brightness-105",
  accent:
    "bg-[var(--accent)] text-[var(--accent-foreground)] border border-transparent shadow-[var(--shadow-gold)] hover:brightness-105",
  outline:
    "bg-transparent text-[var(--foreground)] border border-[var(--border-strong)] hover:bg-[var(--glass)] hover:border-[var(--accent)]",
} as const;

const sizeStyles = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-[var(--radius-sm)]",
  md: "h-11 px-5 text-sm gap-2 rounded-[var(--radius-md)]",
  lg: "h-12 px-7 text-base gap-2.5 rounded-[var(--radius-md)]",
  icon: "h-11 w-11 rounded-full",
} as const;

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
  asChild?: boolean;
  href?: string;
};

export type ButtonProps = ButtonBaseProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof ButtonBaseProps | "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
  >;

function RippleLayer({
  ripples,
}: {
  ripples: { id: number; x: number; y: number }[];
}) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/35"
          style={{ left: r.x, top: r.y }}
          initial={{ scale: 0, opacity: 0.55 }}
          animate={{ scale: 28, opacity: 0 }}
          transition={{
            duration: motionTokens.duration.slow,
            ease: motionTokens.ease.out,
          }}
        />
      ))}
    </span>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  asChild = false,
  href,
  onClick,
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  const reduceMotion = useReducedMotion();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>(
    [],
  );
  const rippleId = useRef(0);

  const classes = cn(
    "focus-ring relative inline-flex items-center justify-center font-medium",
    "transition-[box-shadow,filter,background-color,border-color] duration-300",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none overflow-hidden",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );

  function spawnRipple(event: MouseEvent<HTMLElement>) {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const id = ++rippleId.current;
    const next = {
      id,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setRipples((prev) => [...prev, next]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 700);
  }

  const motionHover = reduceMotion
    ? undefined
    : { scale: 1.02, transition: motionTokens.spring.snappy };
  const motionTap = reduceMotion
    ? undefined
    : { scale: 0.97, transition: motionTokens.spring.snappy };

  if (asChild && isValidElement(children)) {
    const child = Children.only(children) as ReactElement<{
      className?: string;
      onClick?: (e: MouseEvent<HTMLElement>) => void;
      children?: ReactNode;
    }>;

    return cloneElement(child, {
      className: cn(classes, child.props.className),
      onClick: (e: MouseEvent<HTMLElement>) => {
        spawnRipple(e);
        child.props.onClick?.(e);
        onClick?.(e as MouseEvent<HTMLButtonElement>);
      },
      children: (
        <>
          {child.props.children}
          <RippleLayer ripples={ripples} />
        </>
      ),
    });
  }

  if (href) {
    return (
      <motion.span
        className="inline-flex"
        whileHover={motionHover}
        whileTap={motionTap}
      >
        <Link
          href={href}
          className={classes}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          onClick={(e) => {
            if (disabled) {
              e.preventDefault();
              return;
            }
            spawnRipple(e);
            onClick?.(e as unknown as MouseEvent<HTMLButtonElement>);
          }}
        >
          {children}
          <RippleLayer ripples={ripples} />
        </Link>
      </motion.span>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      disabled={disabled}
      whileHover={motionHover}
      whileTap={motionTap}
      onClick={(e) => {
        spawnRipple(e);
        onClick?.(e);
      }}
      name={props.name}
      value={props.value}
      id={props.id}
      form={props.form}
      aria-label={props["aria-label"]}
      aria-pressed={props["aria-pressed"]}
      aria-busy={props["aria-busy"]}
      tabIndex={props.tabIndex}
    >
      {children}
      <RippleLayer ripples={ripples} />
    </motion.button>
  );
}
