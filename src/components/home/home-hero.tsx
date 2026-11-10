"use client";

import { TrendingHeroPanel } from "@/components/home/trending-hero-panel";
import { PlaceSearch } from "@/components/search/place-search";
import { QuickVibes } from "@/components/search/quick-vibes";
import { Button } from "@/components/ui/button";
import type { PlaceCardModel } from "@/lib/places/card";
import { fadeUp, staggerContainer } from "@/lib/motion/variants";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface HomeHeroProps {
  heroImage: string;
  trendingTitle?: string;
  trendingPlaces?: PlaceCardModel[];
  /**
   * Optional MP4/WebM URL. Defaults to the locally hosted Victoria Falls clip.
   * Override with NEXT_PUBLIC_HERO_VIDEO, or pass explicitly.
   */
  heroVideoSrc?: string;
}

/** Local Victoria Falls / waterfall hero — drop a rights-safe MP4 at this path to replace. */
const DEFAULT_HERO_VIDEO = "/videos/hero-victoria-falls.mp4";

const HERO_VIDEO_SRC =
  process.env.NEXT_PUBLIC_HERO_VIDEO?.trim() || DEFAULT_HERO_VIDEO;

export function HomeHero({
  heroImage,
  heroVideoSrc = HERO_VIDEO_SRC,
  trendingTitle = "Trending Now",
  trendingPlaces = [],
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
    <section className="relative z-20 -mt-[var(--nav-height)] min-h-[55vh] bg-[var(--brand-navy)] lg:min-h-[72vh]">
      <div className="absolute inset-0 overflow-hidden">
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
        {/* Still always present as poster/fallback under video */}
        <Image
          src={heroImage}
          alt="Victoria Falls, Zimbabwe — rainbow over the gorge"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
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
        ) : null}
      </motion.div>
      </div>

      <div
        className="absolute inset-0"
        style={{ background: "var(--hero-overlay)" }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[55vh] flex-col justify-start pb-16 pt-[var(--nav-height)] md:justify-center md:pb-24 lg:min-h-[72vh] lg:pt-[calc(var(--nav-height)+2rem)]">
        {/* HERO LAYOUT WRAPPER — 2-column desktop split */}
        <div className="grid w-full grid-cols-1 items-center lg:grid-cols-[55%_45%]">
          <div className="min-w-0">
        <motion.div
          className="container-narrow text-white"
          initial="hidden"
          animate="visible"
          variants={prefersReduced ? undefined : staggerContainer}
        >
          <motion.p
            variants={prefersReduced ? undefined : fadeUp}
            className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)] sm:text-sm"
          >
            Discover. Connect. Belong.
          </motion.p>
          <motion.h1
            variants={prefersReduced ? undefined : fadeUp}
            className="font-display text-4xl leading-[1.05] text-balance sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Where will your next unforgettable weekend begin?
          </motion.h1>
          <motion.p
            variants={prefersReduced ? undefined : fadeUp}
            className="long-form mt-5 max-w-xl text-base leading-relaxed text-white/92 sm:text-lg"
          >
            Panora Go — curated tourism across Panora Zimbabwe. Discover
            places worth the weekend.
          </motion.p>

          <motion.div
            variants={prefersReduced ? undefined : fadeUp}
            className="mt-8 hidden max-w-xl md:block"
          >
            <PlaceSearch
              large
              placeholder="Where do you want to go this weekend?"
            />
          </motion.div>

          <motion.div
            variants={prefersReduced ? undefined : fadeUp}
            className="mt-6"
          >
            <QuickVibes
              onLight
              className="max-lg:flex-nowrap max-lg:overflow-x-auto scrollbar-hide pb-1 max-lg:[&>li]:shrink-0"
            />
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
            <Link href="/discover?vibe=Weekend%20Away">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-white/35 text-white hover:bg-white/10 hover:text-white"
              >
                See this week
              </Button>
            </Link>
          </motion.div>
        </motion.div>
          </div>
          <div className="hidden flex-col justify-center py-6 pr-4 pl-6 lg:flex">
            <TrendingHeroPanel title={trendingTitle} places={trendingPlaces} />
          </div>
        </div>
        {/* END HERO LAYOUT WRAPPER */}
      </div>
    </section>
  );
}
