"use client";

import { SmartShareButton } from "@/components/smart-share/smart-share-button";
import type { SmartSharePlace } from "@/components/smart-share/smart-share-sheet";
import { useState } from "react";

type ViralShareBandProps = {
  place: SmartSharePlace;
};

export function ViralShareBand({ place }: ViralShareBandProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--accent)]/30 bg-[var(--brand-navy)] px-4 py-3 text-white md:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-gold)]">
          Panora SmartShare
        </p>
        <button
          type="button"
          className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide" : "Share"}
        </button>
      </div>
      {open ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <h2 className="font-display text-2xl">
            Know someone who would love this place?
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/90">
            Send them a Panora page with the story, atmosphere, and nearby gems.
          </p>
          <div className="mt-4">
            <SmartShareButton
              place={place}
              label="Share the discovery"
              variant="accent"
              size="lg"
              className="opacity-100"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
