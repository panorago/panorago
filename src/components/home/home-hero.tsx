"use client";

import { QuickVibes } from "@/components/search/quick-vibes";
import { SearchBar } from "@/components/search/search-bar";
import { Button } from "@/components/ui/button";
import { fadeUp, motionTokens, staggerContainer } from "@/lib/motion/variants";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface HomeHeroProps {
  heroImage: string;
  /** Optional MP4/WebM URL. Falls back to poster image when reduced motion or load failure. */
  heroVideoSrc?: string;
}

const DEFAULT_HERO_VIDEO =
  process.env.NEXT_PUBLIC_HERO_VIDEO ?? "/videos/hero.mp4";

export function HomeHero({
  heroImage,
  heroVideoSrc = DEFAULT_HERO_VIDEO,
}: HomeHeroProps) {
  const prefersReduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = Boolean(heroVideoSrc) && !prefersReduced && !videoFailed;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showVideo) return;
    const play = async () => {
      try {
        await video.play();
      } catch {
        setVideoFailed(true);
      }
    };
    void play();
  }, [showVideo, heroVideoSrc]);

  return (
    <section className="relative min-h-dvh overflow-hidden bg-[var(--brand-navy)]">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1 }}
        animate={prefersReduced ? { scale: 1 } : { scale: 1.05 }}
        transition={{
          duration: prefersReduced ? 0 : 10,
          ease: "linear",
          repeat: prefersReduced ? 0 : Infinity,
          repeatType: "reverse",
        }}
      >
        {showVideo ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={heroImage}
            onError={() => setVideoFailed(true)}
            aria-hidden
          >
            <source src={heroVideoSrc} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={heroImage}
            alt="Zimbabwe landscape at golden hour"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
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
            <Link href="/map">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-white/35 text-white hover:bg-white/10 hover:text-white"
              >
                Explore the map
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
