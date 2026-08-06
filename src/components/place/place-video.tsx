"use client";

import { useReducedMotion } from "framer-motion";
import { useState } from "react";

type PlaceVideoProps = {
  src: string;
  title: string;
};

function isEmbedUrl(src: string) {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(src);
}

function toEmbedSrc(src: string): string | null {
  try {
    const url = new URL(src);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = url.pathname.split("/");
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`;
      }
    }
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function PlaceVideo({ src, title }: PlaceVideoProps) {
  const reduceMotion = useReducedMotion();
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  if (isEmbedUrl(src)) {
    const embed = toEmbedSrc(src);
    if (!embed) return null;
    return (
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
        <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Venue film
        </p>
        <div className="relative mt-3 aspect-video w-full">
          <iframe
            title={`Video — ${title}`}
            src={embed}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
      <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        Venue film
      </p>
      <video
        className="mt-3 aspect-video w-full bg-[var(--brand-navy)] object-cover"
        controls
        playsInline
        muted={!!reduceMotion}
        preload="metadata"
        onError={() => setFailed(true)}
      >
        <source src={src} />
      </video>
    </div>
  );
}
