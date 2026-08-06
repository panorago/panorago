import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Panora Way",
  description:
    "How Panora Go curates Zimbabwe's most unforgettable places — atmosphere first, insider notes, and weekends worth remembering.",
};

export default function ThePanoraWayPage() {
  return (
    <div className="gradient-mesh pt-[calc(var(--nav-height)+2rem)]">
      <article className="container-narrow pb-[var(--space-section)]">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Brand story
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
            The Panora Way
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            We believe a weekend should feel intentional — not like scrolling
            until something looks “fine.” Panora Go exists to shorten the
            distance between longing and arrival.
          </p>
        </Reveal>

        <Reveal className="mt-12 space-y-6 text-base leading-relaxed" delay={0.05}>
          <p>
            Panora Go is a Zimbabwe-first guide to places that leave a mark:
            garden tables under jacarandas, river lodges at first light, coffee
            houses that protect a quiet morning, and nights that still have
            pulse. We write for people who care how a room feels when they walk
            in — the light, the sound, the pace of service, the honesty of the
            plate.
          </p>
          <p>
            Every listing carries a story, not a brochure blurb. We add Panora
            Notes — the small truths that change an evening: which entrance
            avoids the queue, when golden hour actually lands, whether the card
            machine survives load shedding. Highlights cover dress vibe, noise,
            spend, and the amenities that matter on the ground.
          </p>
          <p>
            We do not chase star ratings. Guests leave experience stories —
            short, human, memorable. You enquire through us on WhatsApp, email,
            or a call, and we help you book with the confidence of someone who
            has already asked the awkward questions.
          </p>
        </Reveal>

        <Reveal className="mt-14 grid gap-4 sm:grid-cols-3" delay={0.08}>
          {[
            {
              title: "Atmosphere first",
              body: "If the light, sound, and pace are wrong, the rest rarely matters.",
            },
            {
              title: "Local honesty",
              body: "Cash realities, road conditions, and signal strength — written plainly.",
            },
            {
              title: "Weekends with intent",
              body: "Fewer options, deeper notes, clearer next steps to enquire.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--glass)] p-5"
            >
              <h2 className="font-display text-xl">{item.title}</h2>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </div>
          ))}
        </Reveal>

        <Reveal className="mt-14 flex flex-wrap gap-3" delay={0.1}>
          <Link href="/discover">
            <Button variant="accent" size="lg" className="rounded-full">
              Discover places
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg" className="rounded-full">
              Back home
            </Button>
          </Link>
        </Reveal>
      </article>
    </div>
  );
}
