"use client";

import { Button } from "@/components/ui/button";
import {
  buildEnquiryMessage,
  mailtoUrl,
  telUrl,
  whatsappUrl,
} from "@/lib/utils";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { FormEvent, useState } from "react";

interface EnquiryPanelProps {
  placeName: string;
}

export function EnquiryPanel({ placeName }: EnquiryPanelProps) {
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [callConfirm, setCallConfirm] = useState(false);

  const panoraWhatsapp =
    process.env.NEXT_PUBLIC_PANORA_WHATSAPP ?? "+263780000000";
  const panoraEmail =
    process.env.NEXT_PUBLIC_PANORA_EMAIL ?? "hello@panorago.zw";
  const panoraPhone =
    process.env.NEXT_PUBLIC_PANORA_PHONE ?? "+263780000000";
  const panoraPhoneDisplay =
    process.env.NEXT_PUBLIC_PANORA_PHONE_DISPLAY ?? panoraPhone;

  function message() {
    return buildEnquiryMessage({
      placeName,
      date,
      guests,
      phone,
      budget,
      specialRequest,
    });
  }

  function openWhatsApp(event: FormEvent) {
    event.preventDefault();
    window.open(whatsappUrl(panoraWhatsapp, message()), "_blank", "noopener,noreferrer");
  }

  function openEmail(event: FormEvent) {
    event.preventDefault();
    window.location.href = mailtoUrl(
      panoraEmail,
      `Enquiry — ${placeName}`,
      message(),
    );
  }

  function confirmCall() {
    window.location.href = telUrl(panoraPhone);
    setCallConfirm(false);
  }

  const fieldClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

  return (
    <aside className="surface-card sticky top-24 rounded-[var(--radius-lg)] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        Enquire with Panora
      </p>
      <h2 className="mt-2 font-display text-2xl leading-tight">
        Plan your visit to {placeName}
      </h2>
      <p className="mt-2 text-sm text-muted">
        Share a few details and we&apos;ll help you book with confidence.
      </p>

      <form className="mt-6 space-y-3" onSubmit={openWhatsApp}>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Preferred date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Guests</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 2 adults"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Your phone</span>
          <input
            type="tel"
            placeholder="+263…"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Budget</span>
          <input
            type="text"
            placeholder="e.g. $40–60 pp"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Special request</span>
          <textarea
            rows={3}
            placeholder="Anniversary table, dietary needs, transfer…"
            value={specialRequest}
            onChange={(e) => setSpecialRequest(e.target.value)}
            className={`${fieldClass} resize-y`}
          />
        </label>

        <div className="grid gap-2 pt-2">
          <Button type="submit" variant="accent" className="w-full rounded-full">
            <MessageCircle className="h-4 w-4" />
            WhatsApp enquiry
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={openEmail}
          >
            <Mail className="h-4 w-4" />
            Email enquiry
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-full"
            onClick={() => setCallConfirm(true)}
          >
            <Phone className="h-4 w-4" />
            Call Panora
          </Button>
        </div>
      </form>

      {callConfirm && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="call-confirm-title"
        >
          <div className="surface-card w-full max-w-sm rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow)]">
            <h3 id="call-confirm-title" className="font-display text-xl">
              Call Panora Go?
            </h3>
            <p className="mt-2 text-sm text-muted">
              We&apos;ll dial{" "}
              <span className="font-medium text-[var(--foreground)]">
                {panoraPhoneDisplay}
              </span>{" "}
              so our team can help with {placeName}.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCallConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="accent" className="flex-1" onClick={confirmCall}>
                Call now
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
