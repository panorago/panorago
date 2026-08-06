"use client";

import { Button } from "@/components/ui/button";
import { mailtoUrl, telUrl, whatsappUrl } from "@/lib/utils";
import { Mail, MessageCircle, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

type EnquireFabProps = {
  placeName?: string;
};

export function EnquireFab({ placeName }: EnquireFabProps) {
  const [open, setOpen] = useState(false);

  const panoraWhatsapp =
    process.env.NEXT_PUBLIC_PANORA_WHATSAPP ?? "263715708327";
  const panoraEmail =
    process.env.NEXT_PUBLIC_PANORA_EMAIL ?? "info@panora.co.zw";
  const panoraPhone =
    process.env.NEXT_PUBLIC_PANORA_PHONE ?? "+263715535982";
  const panoraPhoneDisplay =
    process.env.NEXT_PUBLIC_PANORA_PHONE_DISPLAY ?? "+263 71 553 5982";

  const subject = placeName
    ? `Enquiry — ${placeName}`
    : "Enquiry — Panora Go";
  const body = placeName
    ? `Hello Panora Go.\n\nI'd like to enquire about\n${placeName}\n`
    : "Hello Panora Go.\n\nI'd like help planning a trip.\n";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Enquire now"
        onClick={() => setOpen(true)}
        className="focus-ring fixed right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[var(--shadow-gold)] md:hidden"
        style={{
          bottom:
            "calc(var(--bottom-nav-height) + 1rem + env(safe-area-inset-bottom))",
        }}
      >
        <MessageCircle className="h-6 w-6" strokeWidth={2} />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="enquire-fab-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="surface-card w-full max-w-md rounded-t-[var(--radius-lg)] rounded-b-[var(--radius-lg)] p-6 shadow-[var(--shadow)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Enquire with Panora
                </p>
                <h2 id="enquire-fab-title" className="mt-1 font-display text-xl">
                  {placeName ? `Plan your visit to ${placeName}` : "How can we help?"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)]"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-2">
              <Button
                variant="accent"
                className="w-full rounded-full"
                onClick={() => {
                  window.open(
                    whatsappUrl(panoraWhatsapp, body),
                    "_blank",
                    "noopener,noreferrer",
                  );
                  setOpen(false);
                }}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={() => {
                  window.location.href = mailtoUrl(panoraEmail, subject, body);
                  setOpen(false);
                }}
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button
                variant="secondary"
                className="w-full rounded-full"
                onClick={() => {
                  window.location.href = telUrl(panoraPhone);
                  setOpen(false);
                }}
              >
                <Phone className="h-4 w-4" />
                Call {panoraPhoneDisplay}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
