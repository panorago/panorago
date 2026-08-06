"use client";

import Image, { type ImageProps } from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";

const DEFAULT_BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxMiI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjEyIiBmaWxsPSIjZThkNWIxIi8+PC9zdmc+";

type ProgressiveImageProps = Omit<ImageProps, "onLoad" | "placeholder"> & {
  parallax?: boolean;
  parallaxStrength?: number;
  containerClassName?: string;
  fadeDuration?: number;
  blurDataURL?: string;
};

export function ProgressiveImage({
  className,
  containerClassName,
  parallax = false,
  parallaxStrength = 40,
  fadeDuration,
  blurDataURL = DEFAULT_BLUR,
  alt,
  fill,
  width,
  height,
  ...props
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion || !parallax
      ? [0, 0]
      : [parallaxStrength, -parallaxStrength],
  );

  const duration = fadeDuration ?? motionTokens.duration.slow;

  const image = (
    <motion.div
      className={cn(
        fill ? "absolute inset-0" : "relative",
        parallax && "will-change-transform",
      )}
      style={parallax && !reduceMotion ? { y } : undefined}
    >
      <Image
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        placeholder="blur"
        blurDataURL={blurDataURL}
        onLoad={() => setLoaded(true)}
        className={cn(
          "object-cover transition-opacity",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        style={{
          transitionDuration: reduceMotion ? "0ms" : `${duration * 1000}ms`,
        }}
        {...props}
      />
    </motion.div>
  );

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden",
        fill && "relative h-full w-full",
        containerClassName,
      )}
    >
      {image}
    </div>
  );
}
