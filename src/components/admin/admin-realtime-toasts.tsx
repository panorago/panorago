"use client";

import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Toast = {
  id: string;
  title: string;
  body: string;
  href: string;
};

/**
 * Live Command Center toasts for new bookings / place submissions.
 * Uses Supabase Realtime when available; fails silently otherwise.
 */
export function AdminRealtimeToasts() {
  const reduceMotion = useReducedMotion();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const channel = supabase
      .channel("command-center-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as {
            id?: string;
            customer_name?: string;
            venue_name?: string;
            customer_number?: string;
          };
          const id = String(row.id ?? Date.now());
          setToasts((prev) =>
            [
              {
                id,
                title: "New enquiry",
                body: `${row.customer_name ?? "Guest"} · ${row.venue_name ?? "Venue"} (${row.customer_number ?? "—"})`,
                href: `/admin/enquiries/${id}`,
              },
              ...prev,
            ].slice(0, 4),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "place_submissions" },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as {
            id?: string;
            place_name?: string;
            submitter_name?: string;
          };
          const id = String(row.id ?? Date.now());
          setToasts((prev) =>
            [
              {
                id: `sub-${id}`,
                title: "Place submission",
                body: `${row.place_name ?? "Place"} from ${row.submitter_name ?? "someone"}`,
                href: "/admin/submissions",
              },
              ...prev,
            ].slice(0, 4),
          );
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(100vw-2rem,22rem)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            className="pointer-events-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass-strong)] p-4 shadow-[var(--shadow-gold)] backdrop-blur-xl"
            role="status"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)]">
                <Bell className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  {toast.title}
                </p>
                <p className="mt-1 text-sm text-[var(--foreground)]">
                  {toast.body}
                </p>
                <Link
                  href={toast.href}
                  className="mt-2 inline-block text-xs font-medium text-[var(--accent)] hover:underline"
                  onClick={() => dismiss(toast.id)}
                >
                  Open →
                </Link>
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                className="rounded-full p-1 text-muted hover:bg-[var(--glass)]"
                onClick={() => dismiss(toast.id)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
