"use client";

import { ProgressiveImage } from "@/components/media/progressive-image";
import { Button } from "@/components/ui/button";
import { motionTokens } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface GalleryLightboxProps {
  images: string[];
  placeName: string;
}

export function GalleryLightbox({ images, placeName }: GalleryLightboxProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();

  const gallery = images.length > 0 ? images : [];

  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + gallery.length) % gallery.length);
  }, [gallery.length]);
  const next = useCallback(() => {
    setIndex((i) => (i + 1) % gallery.length);
  }, [gallery.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, prev, next]);

  if (gallery.length === 0) return null;

  function openAt(i: number) {
    setIndex(i);
    setOpen(true);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {gallery.slice(0, 8).map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => openAt(i)}
            className={cn(
              "group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] focus-ring",
              i === 0 && "col-span-2 row-span-2 aspect-auto min-h-[220px] md:min-h-[320px]",
            )}
          >
            <ProgressiveImage
              src={src}
              alt={`${placeName} gallery ${i + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              containerClassName="absolute inset-0"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
              <ZoomIn className="h-6 w-6 text-white" />
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0.01 : motionTokens.duration.fast }}
            onClick={close}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-10 text-white hover:bg-white/10"
              onClick={close}
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </Button>

            {gallery.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-white hover:bg-white/10 md:left-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-7 w-7" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-white hover:bg-white/10 md:right-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-7 w-7" />
                </Button>
              </>
            )}

            <motion.div
              key={index}
              className="relative h-[70vh] w-full max-w-5xl"
              initial={
                prefersReduced
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.96, y: 12 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                prefersReduced
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.98, y: -8 }
              }
              transition={{
                duration: prefersReduced ? 0.01 : motionTokens.duration.base,
                ease: motionTokens.ease.premium,
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => setTouchStart(e.touches[0]?.clientX ?? null)}
              onTouchEnd={(e) => {
                if (touchStart == null) return;
                const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStart;
                if (delta > 60) prev();
                if (delta < -60) next();
                setTouchStart(null);
              }}
            >
              <ProgressiveImage
                src={gallery[index]}
                alt={`${placeName} — image ${index + 1}`}
                fill
                sizes="100vw"
                className="rounded-[var(--radius-md)] object-contain"
                containerClassName="absolute inset-0"
                priority
              />
            </motion.div>

            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/80">
              {index + 1} / {gallery.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
