"use client";

import { SmartShareButton } from "@/components/smart-share/smart-share-button";
import type { SmartSharePlace } from "@/components/smart-share/smart-share-sheet";
import { Reveal } from "@/components/motion/reveal";

type ViralShareBandProps = {
  place: SmartSharePlace;
};

export function ViralShareBand({ place }: ViralShareBandProps) {
  return (
    <Reveal>
      <div className="rounded-[var(--radius-xl)] border border-[var(--accent)]/30 bg-[var(--brand-navy)] px-6 py-8 text-white shadow-[var(--shadow-gold)] md:px-10 md:py-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-gold)]">
          Panora SmartShare™
        </p>
        <h2 className="mt-3 font-display text-2xl md:text-3xl">
          Know someone who would love this place?
        </h2>
        <p className="mt-3 max-w-lg text-sm text-white/70">
          Send them a beautiful Panora page — story, atmosphere, and nearby gems
          — before they open Maps.
        </p>
        <div className="mt-6">
          <SmartShareButton
            place={place}
            label="Share the discovery"
            variant="accent"
            size="lg"
          />
        </div>
        <p className="mt-6 text-xs tracking-wide text-white/45">
          Discover. Connect. Belong.
        </p>
      </div>
    </Reveal>
  );
}
