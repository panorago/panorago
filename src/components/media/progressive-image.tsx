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

function ParallaxImage({
  className,
  parallaxStrength,
  fadeDuration,
  blurDataURL,
  alt,
  fill,
  width,
  height,
  loaded,
  onLoaded,
  reduceMotion,
  ...props
}: ProgressiveImageProps & {
  loaded: boolean;
  onLoaded: () => void;
  reduceMotion: boolean | null;
  parallaxStrength: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [parallaxStrength, -parallaxStrength],
  );
  const duration = fadeDuration ?? motionTokens.duration.slow;

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden",
        fill && "relative h-full w-full",
      )}
    >
      <motion.div
        className={cn(fill ? "absolute inset-0" : "relative", "will-change-transform")}
        style={{ y }}
      >
        <Image
          alt={alt}
          fill={fill}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          placeholder="blur"
          blurDataURL={blurDataURL}
          onLoad={onLoaded}
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
    </div>
  );
}

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
  const duration = fadeDuration ?? motionTokens.duration.slow;

  if (parallax && !reduceMotion) {
    return (
      <div className={cn(fill && "relative h-full w-full", containerClassName)}>
        <ParallaxImage
          className={className}
          parallaxStrength={parallaxStrength}
          fadeDuration={fadeDuration}
          blurDataURL={blurDataURL}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          loaded={loaded}
          onLoaded={() => setLoaded(true)}
          reduceMotion={reduceMotion}
          {...props}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden",
        fill && "relative h-full w-full",
        containerClassName,
      )}
    >
      <div className={cn(fill ? "absolute inset-0" : "relative")}>
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
      </div>
    </div>
  );
}
