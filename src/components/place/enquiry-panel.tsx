"use client";

import { RelatedPlaces } from "@/components/place/related-places";
import { Button } from "@/components/ui/button";
import {
  buildEnquiryMessage,
  mailtoUrl,
  telUrl,
  ticketDownloadUrl,
  whatsappUrl,
} from "@/lib/utils";
import { Download, Mail, MessageCircle, Phone } from "lucide-react";
import { FormEvent, useState } from "react";

interface EnquiryPanelProps {
  placeName: string;
  placeSlug?: string;
}

export function EnquiryPanel({ placeName, placeSlug }: EnquiryPanelProps) {
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [callConfirm, setCallConfirm] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const panoraWhatsapp =
    process.env.NEXT_PUBLIC_PANORA_WHATSAPP ?? "263715708327";
  const panoraEmail =
    process.env.NEXT_PUBLIC_PANORA_EMAIL ?? "info@panora.co.zw";
  const panoraPhone =
    process.env.NEXT_PUBLIC_PANORA_PHONE ?? "+263715535982";
  const panoraPhoneDisplay =
    process.env.NEXT_PUBLIC_PANORA_PHONE_DISPLAY ?? "+263 71 553 5982";

  function message() {
    return buildEnquiryMessage({
      placeName,
      date,
      adults: adults === "" ? undefined : Number(adults),
      children: children === "" ? undefined : Number(children),
      phone,
      budget,
      specialRequest,
    });
  }

  async function registerEnquiry(channel: "whatsapp" | "email" | "call" | "web") {
    try {
      setSubmitting(true);
      const adultsNum = adults === "" ? null : Number(adults);
      const childrenNum = children === "" ? null : Number(children);
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_name: placeName,
          preferred_date: date || null,
          adults: Number.isFinite(adultsNum) ? adultsNum : null,
          children: Number.isFinite(childrenNum) ? childrenNum : null,
          phone: phone || null,
          budget: budget || null,
          special_request: specialRequest || null,
          channel,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { code?: string };
        if (data.code) setCode(data.code);
        return data.code ?? null;
      }
    } catch {
      // continue with channel open
    } finally {
      setSubmitting(false);
    }
    return null;
  }

  async function openWhatsApp(event: FormEvent) {
    event.preventDefault();
    const enquiryCode = await registerEnquiry("whatsapp");
    const text = enquiryCode
      ? `${message()}\n\nReference: ${enquiryCode}`
      : message();
    window.open(whatsappUrl(panoraWhatsapp, text), "_blank", "noopener,noreferrer");
  }

  async function openEmail(event: FormEvent) {
    event.preventDefault();
    const enquiryCode = await registerEnquiry("email");
    const text = enquiryCode
      ? `${message()}\n\nReference: ${enquiryCode}`
      : message();
    window.location.href = mailtoUrl(
      panoraEmail,
      `Enquiry — ${placeName}${enquiryCode ? ` (${enquiryCode})` : ""}`,
      text,
    );
  }

  function confirmCall() {
    void registerEnquiry("call");
    window.location.href = telUrl(panoraPhone);
    setCallConfirm(false);
  }

  const fieldClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

  const ticketHref = code
    ? ticketDownloadUrl(code, {
        placeName,
        date: date || undefined,
        adults,
        children,
        phone: phone || undefined,
        specialRequest: specialRequest || undefined,
      })
    : null;

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

      {code ? (
        <div className="mt-5 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-4 py-3">
          <p className="text-sm">
            Reference:{" "}
            <span className="font-semibold text-[var(--accent)]">{code}</span>
          </p>
          {ticketHref ? (
            <a
              href={ticketHref}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
              download
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF ticket
            </a>
          ) : null}
        </div>
      ) : null}

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
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted">Adults</span>
            <input
              type="number"
              min={0}
              max={99}
              inputMode="numeric"
              value={adults}
              onChange={(e) => setAdults(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted">Children</span>
            <input
              type="number"
              min={0}
              max={99}
              inputMode="numeric"
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
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
          <Button
            type="submit"
            variant="accent"
            className="w-full rounded-full"
            disabled={submitting}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp enquiry
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={openEmail}
            disabled={submitting}
          >
            <Mail className="h-4 w-4" />
            Email enquiry
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-full"
            onClick={() => setCallConfirm(true)}
            disabled={submitting}
          >
            <Phone className="h-4 w-4" />
            Call Panora
          </Button>
        </div>
      </form>

      {code ? (
        <RelatedPlaces excludeSlug={placeSlug} limit={4} />
      ) : null}

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
