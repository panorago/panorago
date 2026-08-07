"use client";

import { Button } from "@/components/ui/button";
import {
  buildEnquiryMessage,
  ticketDownloadUrl,
  whatsappUrl,
} from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  Download,
  Home,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useId, useRef, useState } from "react";

const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Business",
  "Family",
  "Holiday",
  "Weekend Escape",
  "Other",
] as const;

export type EnquiryFormFields = {
  placeId?: string | null;
  placeName: string;
  venueAddress?: string | null;
};

type SuccessState = {
  code: string;
  customerNumber: string;
  qrDataUrl: string | null;
  ticketPdfBase64: string | null;
};

type EnquiryBookingFormProps = EnquiryFormFields & {
  compact?: boolean;
  onSubmitted?: (result: SuccessState) => void;
};

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export function EnquiryBookingForm({
  placeId,
  placeName,
  venueAddress,
  compact,
  onSubmitted,
}: EnquiryBookingFormProps) {
  const formId = useId();
  const reduceMotion = useReducedMotion();
  const submittingLock = useRef(false);
  const clientTokenRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `tok-${Math.random().toString(36).slice(2)}`,
  );

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [specialRequest, setSpecialRequest] = useState("");
  const [budget, setBudget] = useState("");
  const [occasion, setOccasion] = useState<(typeof OCCASIONS)[number] | "">(
    "",
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const panoraWhatsapp =
    process.env.NEXT_PUBLIC_PANORA_WHATSAPP ?? "263715708327";

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "First name is required";
    if (!surname.trim()) next.surname = "Surname is required";
    if (!phone.trim() || phone.trim().length < 6)
      next.phone = "Enter a valid phone number";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email";
    }
    const adultsNum = Number(adults);
    const childrenNum = Number(children);
    if (!Number.isFinite(adultsNum) || adultsNum < 0 || adultsNum > 99) {
      next.adults = "0–99";
    }
    if (!Number.isFinite(childrenNum) || childrenNum < 0 || childrenNum > 99) {
      next.children = "0–99";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submitEnquiry(event: FormEvent) {
    event.preventDefault();
    if (submittingLock.current) return;
    setError(null);
    if (!validate()) return;

    submittingLock.current = true;
    setSubmitting(true);

    try {
      const adultsNum = Number(adults);
      const childrenNum = Number(children);
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: placeId ?? null,
          place_name: placeName,
          venue_address: venueAddress ?? null,
          first_name: firstName.trim(),
          surname: surname.trim(),
          preferred_date: date || null,
          adults: Number.isFinite(adultsNum) ? adultsNum : 2,
          children: Number.isFinite(childrenNum) ? childrenNum : 0,
          phone: phone.trim(),
          email: email.trim() || null,
          budget: budget || null,
          special_request: specialRequest || null,
          occasion: occasion || null,
          channel: "web",
          client_token: clientTokenRef.current,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        code?: string;
        booking_reference?: string;
        customer_number?: string;
        qr_data_url?: string | null;
        ticket_pdf_base64?: string | null;
      };

      if (!res.ok) {
        setError(data.error ?? "Could not send enquiry. Please try again.");
        return;
      }

      const code = data.booking_reference ?? data.code ?? "";
      const ticketPdfBase64 = data.ticket_pdf_base64 ?? null;
      const next: SuccessState = {
        code,
        customerNumber: data.customer_number ?? code,
        qrDataUrl: data.qr_data_url ?? null,
        ticketPdfBase64,
      };
      setSuccess(next);
      onSubmitted?.(next);

      if (ticketPdfBase64 && typeof window !== "undefined") {
        try {
          sessionStorage.setItem(`panora-ticket-${code}`, ticketPdfBase64);
        } catch {
          // ignore quota
        }
      }
    } catch {
      setError("Network error. Your details were not lost — please retry.");
    } finally {
      setSubmitting(false);
      submittingLock.current = false;
    }
  }

  function openWhatsAppFollowUp() {
    if (!success) return;
    const text = [
      buildEnquiryMessage({
        placeName,
        date,
        adults,
        children,
        phone,
        budget,
        specialRequest,
        firstName,
        surname,
        occasion: occasion || undefined,
        customerNumber: success.customerNumber,
      }),
      "",
      `Reference: ${success.code}`,
      `Customer Number: ${success.customerNumber}`,
    ].join("\n");
    window.open(whatsappUrl(panoraWhatsapp, text), "_blank", "noopener,noreferrer");
  }

  function downloadTicket() {
    if (!success) return;
    const filename = `panora-go-${success.customerNumber || success.code}.pdf`;

    const fromMemory =
      success.ticketPdfBase64 ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem(`panora-ticket-${success.code}`)
        : null);

    if (fromMemory) {
      try {
        const binary = atob(fromMemory);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      } catch {
        // fall through to API
      }
    }

    window.location.href = ticketDownloadUrl(success.code, {
      placeName,
      date: date || undefined,
      adults,
      children,
      phone: phone || undefined,
      specialRequest: specialRequest || undefined,
      name: `${firstName} ${surname}`.trim(),
      customerNumber: success.customerNumber,
      occasion: occasion || undefined,
      address: venueAddress || undefined,
    });
  }

  if (success) {
    return (
      <motion.div
        className="space-y-4"
        id={`${formId}-success`}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Thank you
          </p>
          <h3 className="mt-2 font-display text-2xl leading-tight">
            Your enquiry has been received
          </h3>
          <p className="long-form mt-3 text-sm leading-relaxed text-[var(--foreground)]">
            Thank you for choosing Panora Go. Our Concierge Team is contacting{" "}
            <span className="font-medium">{placeName}</span> to confirm
            availability. We will reach out shortly using your preferred contact
            method. Please keep your Panora Customer Number for all follow-ups.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Customer number
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-wide text-[var(--accent)]">
            {success.customerNumber}
          </p>
          <p className="mt-1 text-xs text-muted">Reference {success.code}</p>
          {success.qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={success.qrDataUrl}
              alt="Enquiry QR code"
              className="mt-4 mx-auto h-36 w-36 rounded-lg border border-[var(--border)] bg-white p-2"
            />
          ) : null}
        </div>

        <div className="grid gap-2">
          <Button
            type="button"
            variant="accent"
            className="w-full rounded-full"
            onClick={downloadTicket}
          >
            <Download className="h-4 w-4" />
            Download Ticket
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-full"
            onClick={openWhatsAppFollowUp}
          >
            <MessageCircle className="h-4 w-4" />
            Open WhatsApp
          </Button>
          <Link href="/" className="block">
            <Button type="button" variant="outline" className="w-full rounded-full">
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
          <Link href="/discover" className="block">
            <Button type="button" variant="ghost" className="w-full rounded-full">
              <Compass className="h-4 w-4" />
              Explore More Places
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={submitEnquiry} id={formId} noValidate>
      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">First name</span>
          <input
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={fieldClass}
            aria-invalid={Boolean(fieldErrors.firstName)}
          />
          {fieldErrors.firstName ? (
            <span className="text-xs text-red-500">{fieldErrors.firstName}</span>
          ) : null}
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Surname</span>
          <input
            required
            autoComplete="family-name"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            className={fieldClass}
            aria-invalid={Boolean(fieldErrors.surname)}
          />
          {fieldErrors.surname ? (
            <span className="text-xs text-red-500">{fieldErrors.surname}</span>
          ) : null}
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted">Phone number</span>
        <input
          required
          type="tel"
          autoComplete="tel"
          placeholder="+263…"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={fieldClass}
          aria-invalid={Boolean(fieldErrors.phone)}
        />
        {fieldErrors.phone ? (
          <span className="text-xs text-red-500">{fieldErrors.phone}</span>
        ) : null}
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted">Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
          aria-invalid={Boolean(fieldErrors.email)}
        />
        {fieldErrors.email ? (
          <span className="text-xs text-red-500">{fieldErrors.email}</span>
        ) : null}
      </label>

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
        <span className="text-xs font-medium text-muted">Occasion</span>
        <select
          value={occasion}
          onChange={(e) =>
            setOccasion(e.target.value as (typeof OCCASIONS)[number] | "")
          }
          className={fieldClass}
        >
          <option value="">Select occasion</option>
          {OCCASIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
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
        <span className="text-xs font-medium text-muted">Special requests</span>
        <textarea
          rows={3}
          placeholder="Anniversary table, dietary needs, transfer…"
          value={specialRequest}
          onChange={(e) => setSpecialRequest(e.target.value)}
          className={`${fieldClass} resize-y`}
        />
      </label>

      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="accent"
        className="w-full rounded-full"
        disabled={submitting}
      >
        <MessageCircle className="h-4 w-4" />
        {submitting ? "Sending…" : "Enquire Now"}
      </Button>
      <p className="text-center text-[11px] text-muted">
        No instant bookings — Panora confirms with the venue first.
      </p>
    </form>
  );
}
