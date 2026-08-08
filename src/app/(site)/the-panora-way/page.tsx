import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Panora Way — Discover Connect Belong",
  description:
    "Discover. Connect. Belong. How Panora Go curates tourism in Panora Zimbabwe through stories, atmosphere, and honest local insight.",
  alternates: {
    canonical: absoluteUrl("/the-panora-way"),
  },
};

const PRINCIPLES = [
  {
    emoji: "🧭",
    title: "Discover",
    lead: "Find places that make you stop scrolling and start planning.",
    body: [
      "Some destinations are famous. Others become your favourite because you found them first.",
      "Panora Go goes beyond search results to uncover experiences that deserve your attention—from hidden coffee spots and scenic drives to family adventures, romantic escapes and unforgettable weekends.",
      "Every recommendation is carefully curated so your next discovery feels like finding a secret worth sharing.",
    ],
    closer: "Every destination begins with one question… “What if we went there this weekend?”",
  },
  {
    emoji: "🤝",
    title: "Connect",
    lead: "Turn inspiration into unforgettable moments.",
    body: [
      "Finding a place is easy. Finding the right place, at the right time, with the confidence to go—that's different.",
      "Panora Go brings everything together: beautiful photography, real stories, honest local insights, menus and pricing, maps and directions, direct enquiries, and helpful recommendations.",
      "So instead of spending hours comparing websites… you spend your time making memories.",
    ],
  },
  {
    emoji: "🏡",
    title: "Belong",
    lead: "Every visitor becomes part of the story.",
    body: [
      "Some people leave reviews. We leave moments.",
      "Every destination on Panora Go has a living space where travellers share discoveries, celebrations, unexpected surprises and unforgettable experiences.",
      "It's not about stars. It's about stories. Because today's visitor becomes tomorrow's inspiration.",
    ],
    closer: "Every place has a story. Every visitor writes the next chapter.",
  },
] as const;

const ATMOSPHERE = [
  "☀️ Golden Hour recommendations",
  "🎶 Sound & ambience",
  "🌿 Overall mood",
  "📸 Most photogenic spots",
  "💬 Conversation level",
  "🌙 Evening atmosphere",
  "🍃 Surroundings",
  "✨ The feeling that makes a place unforgettable",
] as const;

const HONESTY = [
  "Road conditions",
  "Network coverage",
  "Solar backup",
  "Borehole availability",
  "Wi-Fi quality",
  "Starlink access",
  "Payment methods",
  "Parking",
  "Accessibility",
  "Safety insights",
  "Best time to visit",
  "Local tips",
] as const;

const WEEKEND = [
  "📖 A beautifully written story",
  "📝 Panora Notes",
  "📸 Stunning photography",
  "🎥 Videos",
  "💰 Real prices",
  "🗺 Maps & directions",
  "💬 Genuine visitor moments",
  "📍 Local insights",
  "📞 Direct enquiries",
] as const;

export default function ThePanoraWayPage() {
  return (
    <div className="gradient-mesh pt-8">
      <article className="pb-[var(--space-section)]">
        {/* Hero philosophy */}
        <Reveal className="container-narrow">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Our Philosophy
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.08] md:text-6xl">
            Discover. Connect. Belong.
          </h1>
          <p className="long-form mt-6 text-lg leading-relaxed text-[var(--foreground-muted)] md:text-xl">
            Every unforgettable journey begins with curiosity.
          </p>
          <div className="long-form mt-8 space-y-3 text-base leading-relaxed text-[var(--foreground-muted)] md:text-lg">
            <p>A hidden café tucked beneath ancient trees.</p>
            <p>A sunset you&apos;ve never seen before.</p>
            <p>A weekend escape that turns into your favourite memory.</p>
          </div>
          <div className="long-form mt-10 space-y-5 text-base leading-relaxed md:text-lg">
            <p>
              Panora Go was created for people who believe life is too short for
              ordinary weekends.
            </p>
            <p className="text-[var(--foreground-muted)]">
              We&apos;re here to help you discover places that deserve your
              time, connect you with experiences worth sharing, and help you
              belong to a community that celebrates Zimbabwe through stories,
              not just destinations.
            </p>
            <p className="font-display text-2xl leading-snug text-[var(--accent)] md:text-3xl">
              Because the best places aren&apos;t simply visited.
              <br />
              They&apos;re remembered.
            </p>
          </div>
        </Reveal>

        {/* Discover / Connect / Belong */}
        <div className="container-panora mt-20 grid gap-6 lg:grid-cols-3">
          {PRINCIPLES.map((item, index) => (
            <Reveal
              key={item.title}
              delay={index * 0.06}
              className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-6 shadow-[var(--shadow)] backdrop-blur-xl md:p-8"
            >
              <p className="text-2xl" aria-hidden>
                {item.emoji}
              </p>
              <h2 className="mt-3 font-display text-3xl">{item.title}</h2>
              <p className="mt-3 text-base font-medium leading-relaxed">
                {item.lead}
              </p>
              <div className="long-form mt-5 space-y-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
                {item.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
              {"closer" in item && item.closer ? (
                <p className="mt-6 border-t border-[var(--border)] pt-5 text-sm font-medium text-[var(--accent)]">
                  {item.closer}
                </p>
              ) : null}
            </Reveal>
          ))}
        </div>

        {/* Atmosphere First */}
        <Reveal className="container-narrow mt-24">
          <p className="text-2xl" aria-hidden>
            🌅
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">
            Atmosphere First
          </h2>
          <p className="long-form mt-4 text-lg leading-relaxed text-[var(--foreground-muted)]">
            Because people remember how a place felt long after they&apos;ve
            forgotten what it cost.
          </p>
          <div className="mt-6 space-y-2 text-base leading-relaxed text-[var(--foreground-muted)]">
            <p>The light.</p>
            <p>The music.</p>
            <p>The smell after the rain.</p>
            <p>The quiet conversation over coffee.</p>
            <p>The laughter around a fire.</p>
          </div>
          <p className="long-form mt-6 text-base leading-relaxed">
            Those are the moments that stay with us. That&apos;s why Panora Go
            captures the details most travel platforms ignore.
          </p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            You&apos;ll discover
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {ATMOSPHERE.map((item) => (
              <li
                key={item}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 font-display text-xl text-[var(--accent)]">
            Because atmosphere isn&apos;t an extra. It&apos;s the experience.
          </p>
        </Reveal>

        {/* Local Honesty */}
        <Reveal className="container-narrow mt-24">
          <p className="text-2xl" aria-hidden>
            📍
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">
            Local Honesty
          </h2>
          <p className="long-form mt-4 text-lg leading-relaxed text-[var(--foreground-muted)]">
            Real journeys deserve real information.
          </p>
          <p className="long-form mt-4 text-base leading-relaxed text-[var(--foreground-muted)]">
            Beautiful photos only tell half the story. We tell you what you
            actually need to know before you leave home.
          </p>
          <ul className="mt-8 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {HONESTY.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-sm"
              >
                <span className="text-[var(--accent)]" aria-hidden>
                  ✔
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="long-form mt-6 text-base font-medium leading-relaxed">
            No surprises. No exaggerated promises. Just honest information from
            people who know the journey.
          </p>
        </Reveal>

        {/* Weekends With Intent */}
        <Reveal className="container-narrow mt-24">
          <p className="text-2xl" aria-hidden>
            ✨
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">
            Weekends With Intent
          </h2>
          <p className="long-form mt-4 text-lg leading-relaxed text-[var(--foreground-muted)]">
            Because your weekends deserve better than endless scrolling.
          </p>
          <div className="long-form mt-6 space-y-4 text-base leading-relaxed text-[var(--foreground-muted)]">
            <p>There are thousands of places. But only a few are worth your time.</p>
            <p>
              Panora Go doesn&apos;t overwhelm you with endless listings. We
              carefully select experiences that inspire you to get out, explore
              and create memories.
            </p>
            <p>Every destination is thoughtfully presented with:</p>
          </div>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {WEEKEND.map((item) => (
              <li
                key={item}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 text-sm"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 font-display text-2xl text-[var(--accent)]">
            Less searching. More living.
          </p>
        </Reveal>

        {/* Curated With Care */}
        <Reveal className="container-narrow mt-24">
          <p className="text-2xl" aria-hidden>
            ⭐
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">
            Curated With Care
          </h2>
          <p className="long-form mt-4 text-lg leading-relaxed">
            We don&apos;t list places. We introduce experiences.
          </p>
          <div className="long-form mt-6 space-y-4 text-base leading-relaxed text-[var(--foreground-muted)]">
            <p>
              Every destination on Panora Go is carefully selected before it
              earns its place on our platform.
            </p>
            <p>
              We believe quality creates trust. That&apos;s why we focus on
              thoughtful storytelling, honest information and meaningful
              recommendations rather than simply publishing every venue.
            </p>
          </div>
          <p className="mt-8 font-display text-2xl md:text-3xl">
            If it&apos;s on Panora Go…
            <br />
            <span className="text-[var(--accent)]">It&apos;s worth discovering.</span>
          </p>
        </Reveal>

        {/* Promise */}
        <Reveal className="container-narrow mt-24">
          <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--brand-navy)] px-6 py-10 text-white shadow-[var(--shadow)] md:px-12 md:py-14">
            <p className="text-2xl" aria-hidden>
              🌍
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">
              Our Promise
            </h2>
            <div className="long-form mt-6 space-y-4 text-base leading-relaxed text-white/90 md:text-lg">
              <p>
                We believe Zimbabwe is filled with extraordinary places waiting
                to be experienced.
              </p>
              <p>
                Some are famous. Many are hidden. All have a story.
              </p>
              <p>
                Whether you&apos;re planning your first date, a family getaway,
                a road trip with friends or a quiet weekend to recharge…
              </p>
              <p className="text-white">
                Panora Go will help you discover where your next favourite
                memory begins.
              </p>
            </div>
            <p className="mt-10 font-display text-xl leading-snug text-[var(--accent)] md:text-2xl">
              Discover beautifully. Connect effortlessly. Belong naturally.
            </p>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
              Welcome to Panora Go.
            </p>
          </div>
        </Reveal>

        <Reveal className="container-narrow mt-12 flex flex-wrap gap-3">
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
        </Reveal>
      </article>
    </div>
  );
}
