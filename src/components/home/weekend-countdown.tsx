"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type WeekendCountdownProps = {
  className?: string;
};

/** Next Friday at 17:00 local time. */
function getNextWeekendStart(from = new Date()): Date {
  const target = new Date(from);
  target.setSeconds(0, 0);
  target.setMinutes(0);
  target.setHours(17);

  const day = from.getDay(); // 0 Sun … 5 Fri … 6 Sat
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

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Weekend starts now";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return `Weekend starts in ${days}d ${hours}h ${minutes}m`;
}

export function WeekendCountdown({ className }: WeekendCountdownProps) {
  const [label, setLabel] = useState(() =>
    formatCountdown(getNextWeekendStart().getTime() - Date.now()),
  );
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const tick = () => {
      setLabel(formatCountdown(getNextWeekendStart().getTime() - Date.now()));
    };
    tick();
    if (reducedMotion) return;
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  return (
    <p
      className={cn(
        "text-sm font-medium tracking-wide text-[var(--accent)]",
        className,
      )}
      aria-live="polite"
    >
      {label}
    </p>
  );
}
