"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type WeekendCountdownProps = {
  className?: string;
};

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  live: boolean;
};

/** Next Friday at 17:00 local time. */
function getNextWeekendStart(from = new Date()): Date {
  const target = new Date(from);
  target.setSeconds(0, 0);
  target.setMinutes(0);
  target.setHours(17);

  const day = from.getDay();
  let daysUntilFriday = (5 - day + 7) % 7;

  if (daysUntilFriday === 0) {
    const nowMinutes = from.getHours() * 60 + from.getMinutes();
    if (nowMinutes >= 17 * 60) {
      daysUntilFriday = 7;
    }
  }

  target.setDate(from.getDate() + daysUntilFriday);
  return target;
}

function getParts(ms: number): Parts {
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, live: true };
  }
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, live: false };
}

function Unit({
  value,
  label,
  pulse,
}: {
  value: number;
  label: string;
  pulse?: boolean;
}) {
  const padded = String(value).padStart(2, "0");
  return (
    <motion.span
      key={`${label}-${padded}`}
      initial={pulse ? { opacity: 0.55, y: 4 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex min-w-[2.75rem] flex-col items-center sm:min-w-[3.25rem]"
    >
      <span className="font-display text-2xl leading-none tracking-tight text-white sm:text-3xl md:text-4xl">
        {padded}
      </span>
      <span className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent)] sm:text-xs">
        {label}
      </span>
    </motion.span>
  );
}

export function WeekendCountdown({ className }: WeekendCountdownProps) {
  const prefersReduced = useReducedMotion();
  const [parts, setParts] = useState<Parts>(() =>
    getParts(getNextWeekendStart().getTime() - Date.now()),
  );

  useEffect(() => {
    const tick = () => {
      setParts(getParts(getNextWeekendStart().getTime() - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, prefersReduced ? 60_000 : 1000);
    return () => window.clearInterval(id);
  }, [prefersReduced]);

  return (
    <div
      className={cn(
        "glass-strong inline-flex max-w-full flex-col gap-3 rounded-[var(--radius-lg)] border border-white/15 px-5 py-4 shadow-[var(--shadow-gold)] sm:px-6 sm:py-5",
        className,
      )}
      aria-live="polite"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] sm:text-sm">
        {parts.live ? "The weekend is here" : "Weekend starts in"}
      </p>

      {parts.live ? (
        <p className="font-display text-2xl text-white sm:text-3xl">
          Go make a memory.
        </p>
      ) : (
        <div className="flex items-end gap-2 sm:gap-3">
          <Unit value={parts.days} label="Days" />
          <span className="pb-5 font-display text-2xl text-white/40 sm:text-3xl" aria-hidden>
            :
          </span>
          <Unit value={parts.hours} label="Hrs" />
          <span className="pb-5 font-display text-2xl text-white/40 sm:text-3xl" aria-hidden>
            :
          </span>
          <Unit value={parts.minutes} label="Min" />
          {!prefersReduced ? (
            <>
              <span className="pb-5 font-display text-2xl text-white/40 sm:text-3xl" aria-hidden>
                :
              </span>
              <Unit value={parts.seconds} label="Sec" pulse />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
