import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About Panora Go",
  description:
    "About Panora Go — Zimbabwe tourism and lifestyle discovery. Discover Connect Belong with curated places, insider notes, and concierge enquiries.",
  alternates: {
    canonical: absoluteUrl("/about"),
  },
};

export default function AboutPage() {
  return (
    <div className="gradient-mesh">
      <Reveal className="container-narrow py-[var(--space-section)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          About
        </p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">
          We sell weekends, not inventory.
        </h1>
        <div className="long-form mt-8 space-y-5 text-base leading-relaxed text-[var(--foreground-muted)]">
          <p>
            Panora Go is Zimbabwe&apos;s premium lifestyle discovery platform.
            We hand-curate places worth dressing for — restaurants, escapes,
            rituals, and nights that feel like a memory before you arrive.
          </p>
          <p>
            There is no booking engine here. When you are ready, you enquire
            with our concierge team by WhatsApp, email, or phone. We confirm
            details personally so the experience stays human.
          </p>
          <p>
            Every listing carries a story, a Panora Note, and verification
            signals you can trust — because anticipation should feel premium.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/discover">
            <Button variant="accent" size="lg" className="rounded-full">
              Start discovering
            </Button>
          </Link>
          <Link href="/enquiry">
            <Button variant="outline" size="lg" className="rounded-full">
              Talk to Panora
            </Button>
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
