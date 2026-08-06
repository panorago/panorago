"use client";

import { EnquiryBookingForm } from "@/components/place/enquiry-booking-form";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

type EnquireModalProps = {
  placeId?: string | null;
  placeName: string;
  venueAddress?: string | null;
  /** Controlled open (desktop CTA / FAB) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Show floating mobile FAB trigger */
  showFab?: boolean;
  /** Desktop inline trigger button */
  showDesktopTrigger?: boolean;
};

export function EnquireModal({
  placeId,
  placeName,
  venueAddress,
  open: controlledOpen,
  onOpenChange,
  showFab = true,
  showDesktopTrigger = true,
}: EnquireModalProps) {
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen != null;
  const open = isControlled ? controlledOpen : internalOpen;

  function setOpen(next: boolean) {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setOpen identity
  }, [open]);

  return (
    <>
      {showDesktopTrigger ? (
        <Button
          type="button"
          variant="accent"
          className="hidden rounded-full md:inline-flex"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="h-4 w-4" />
          Enquire Now
        </Button>
      ) : null}

      {showFab ? (
        <button
          type="button"
          aria-label="Enquire now"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="focus-ring fixed right-[var(--fab-edge)] bottom-[var(--fab-bottom)] z-40 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[var(--shadow-gold)] md:hidden"
        >
          <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          <span className="pr-0.5">Enquire</span>
        </button>
      ) : null}

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-3 backdrop-blur-md sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              className="relative mb-[calc(var(--bottom-nav-height)+0.25rem)] max-h-[min(92dvh,720px)] w-full max-w-lg overflow-y-auto rounded-[var(--radius-xl)] border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--glass)_92%,transparent)] p-6 shadow-[var(--shadow)] backdrop-blur-2xl sm:mb-0"
              initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Concierge enquiry
                  </p>
                  <h2 id={titleId} className="mt-1 font-display text-2xl leading-tight">
                    Plan your visit to {placeName}
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    No instant bookings — Panora confirms with the venue first,
                    then issues your ticket.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)]"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6">
                <EnquiryBookingForm
                  placeId={placeId}
                  placeName={placeName}
                  venueAddress={venueAddress}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
