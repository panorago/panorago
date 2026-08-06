"use client";

import { ProgressiveImage } from "@/components/media/progressive-image";
import { QuickVibes } from "@/components/search/quick-vibes";
import { SearchBar } from "@/components/search/search-bar";
import { Button } from "@/components/ui/button";
import { fadeUp, motionTokens, staggerContainer } from "@/lib/motion/variants";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

interface HomeHeroProps {
  heroImage: string;
}

export function HomeHero({ heroImage }: HomeHeroProps) {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative min-h-dvh overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1 }}
        animate={prefersReduced ? { scale: 1 } : { scale: 1.08 }}
        transition={{
          duration: prefersReduced ? 0 : motionTokens.duration.hero,
          ease: "linear",
        }}
      >
        <ProgressiveImage
          src={heroImage}
          alt="Zimbabwe landscape at golden hour"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          containerClassName="absolute inset-0"
        />
      </motion.div>

      <div
        className="absolute inset-0"
        style={{ background: "var(--hero-overlay)" }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-dvh flex-col justify-end pb-16 pt-[calc(var(--nav-height)+2rem)] md:justify-center md:pb-24">
        <motion.div
          className="container-panora max-w-3xl text-white"
          initial="hidden"
          animate="visible"
          variants={prefersReduced ? undefined : staggerContainer}
        >
          <motion.p
            variants={prefersReduced ? undefined : fadeUp}
            className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]"
          >
            Panora Go · Zimbabwe
          </motion.p>
          <motion.h1
            variants={prefersReduced ? undefined : fadeUp}
            className="font-display text-4xl leading-[1.05] text-balance sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Where will your next unforgettable weekend begin?
          </motion.h1>
          <motion.p
            variants={prefersReduced ? undefined : fadeUp}
            className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
          >
            Discover Zimbabwe&apos;s most unforgettable places.
          </motion.p>

          <motion.div
            variants={prefersReduced ? undefined : fadeUp}
            className="mt-8 max-w-xl"
          >
            <SearchBar large className="text-[var(--foreground)]" />
          </motion.div>

          <motion.div
            variants={prefersReduced ? undefined : fadeUp}
            className="mt-6"
          >
            <QuickVibes onLight />
          </motion.div>

          <motion.div
            variants={prefersReduced ? undefined : fadeUp}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/discover">
              <Button variant="accent" size="lg" className="rounded-full">
                Start discovering
              </Button>
            </Link>
            <Link href="/the-panora-way">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-white/35 text-white hover:bg-white/10 hover:text-white"
              >
                The Panora Way
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
