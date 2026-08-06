"use client";

/** Instant display — avoids setState-in-effect lint noise. */
export function AnimatedCounter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return <span className={className}>{value.toLocaleString()}</span>;
}
