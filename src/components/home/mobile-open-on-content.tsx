"use client";

import { useEffect } from "react";

/** On phones, open the homepage on the first venue section instead of the hero search. */
export function MobileOpenOnContent({ targetId }: { targetId: string }) {
  useEffect(() => {
    if (window.innerWidth >= 768) return;
    if (window.location.hash) return;

    const section = document.getElementById(targetId);
    if (!section) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const frame = window.requestAnimationFrame(() => {
      section.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [targetId]);

  return null;
}
