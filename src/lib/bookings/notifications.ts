import { absoluteUrl, whatsappUrl } from "@/lib/utils";

export type NotifyBookingInput = {
  bookingReference: string;
  customerNumber: string;
  customerName: string;
  email?: string | null;
  phone?: string | null;
  venueName: string;
  preferredDate?: string | null;
  adults: number;
  children: number;
  occasion?: string | null;
  status: "pending" | "confirmed" | string;
};

function supportContacts() {
  return {
    whatsapp: process.env.NEXT_PUBLIC_PANORA_WHATSAPP ?? "263715708327",
    email: process.env.NEXT_PUBLIC_PANORA_EMAIL ?? "info@panora.co.zw",
    phone:
      process.env.NEXT_PUBLIC_PANORA_PHONE_DISPLAY ??
      process.env.NEXT_PUBLIC_PANORA_PHONE ??
      "+263 71 553 5982",
  };
}

export function customerWhatsAppTemplate(input: NotifyBookingInput): string {
  const verify = absoluteUrl(`/verify/${input.customerNumber}`);
  return [
    `Hello ${input.customerName},`,
    "",
    "Thank you for choosing Panora Go.",
    `Your enquiry for ${input.venueName} has been received.`,
    "",
    `Customer Number: ${input.customerNumber}`,
    `Booking Reference: ${input.bookingReference}`,
    `Preferred date: ${input.preferredDate || "—"}`,
    `Guests: ${input.adults} adults, ${input.children} children`,
    "",
    `Verify your ticket: ${verify}`,
    "",
    "Our Concierge Team is contacting the venue to confirm availability.",
    "We will update you shortly.",
    "",
    "Discover · Connect · Belong",
    "— Panora Go",
  ].join("\n");
}

export function adminWhatsAppTemplate(input: NotifyBookingInput): string {
  return [
    "New Panora Go enquiry",
    "",
    `Venue: ${input.venueName}`,
    `Guest: ${input.customerName}`,
    `Phone: ${input.phone || "—"}`,
    `Email: ${input.email || "—"}`,
    `Date: ${input.preferredDate || "—"}`,
    `Adults/Children: ${input.adults}/${input.children}`,
    `Occasion: ${input.occasion || "—"}`,
    `Customer Number: ${input.customerNumber}`,
    `Reference: ${input.bookingReference}`,
    "",
    `Admin: ${absoluteUrl("/admin/bookings")}`,
  ].join("\n");
}

export function confirmationWhatsAppTemplate(input: NotifyBookingInput): string {
  const verify = absoluteUrl(`/verify/${input.customerNumber}`);
  return [
    `Hello ${input.customerName},`,
    "",
    `Great news — your visit to ${input.venueName} is CONFIRMED.`,
    "",
    `Customer Number: ${input.customerNumber}`,
    `Booking Reference: ${input.bookingReference}`,
    `Visit date: ${input.preferredDate || "—"}`,
    "",
    `Show this on arrival / verify: ${verify}`,
    "",
    "We look forward to helping you create unforgettable memories.",
    "— Panora Go Concierge",
  ].join("\n");
}

export function customerWhatsAppDeepLink(input: NotifyBookingInput): string {
  const contacts = supportContacts();
  return whatsappUrl(contacts.whatsapp, customerWhatsAppTemplate(input));
}

export function adminWhatsAppDeepLink(input: NotifyBookingInput): string {
  const contacts = supportContacts();
  return whatsappUrl(contacts.whatsapp, adminWhatsAppTemplate(input));
}

export function confirmationWhatsAppDeepLink(input: NotifyBookingInput): string {
  const phone = input.phone?.replace(/[^\d+]/g, "") || supportContacts().whatsapp;
  return whatsappUrl(phone, confirmationWhatsAppTemplate(input));
}

async function sendWithResend(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Panora Go <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.info("[bookings] Resend failed:", res.status, body);
      return { ok: false, error: `Resend ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resend error";
    console.info("[bookings] Resend exception:", message);
    return { ok: false, error: message };
  }
}

function enquiryEmailHtml(input: NotifyBookingInput): string {
  const verify = absoluteUrl(`/verify/${input.customerNumber}`);
  const contacts = supportContacts();
  return `
  <div style="font-family:Georgia,serif;background:#0A192F;color:#fff;padding:32px">
    <h1 style="color:#C29B62;margin:0 0 8px">Panora Go</h1>
    <p style="letter-spacing:0.12em;text-transform:uppercase;font-size:12px;color:#C29B62">Discover · Connect · Belong</p>
    <p>Hello ${escapeHtml(input.customerName)},</p>
    <p>Thank you for choosing Panora Go. Your enquiry for <strong>${escapeHtml(input.venueName)}</strong> has been received successfully.</p>
    <p>Our Concierge Team is currently contacting the venue to confirm availability. We will contact you shortly.</p>
    <div style="background:rgba(194,155,98,0.12);border:1px solid #C29B62;padding:16px;margin:24px 0;border-radius:8px">
      <p style="margin:0;font-size:12px;color:#C29B62">CUSTOMER NUMBER</p>
      <p style="margin:4px 0 0;font-size:22px;color:#C29B62"><strong>${escapeHtml(input.customerNumber)}</strong></p>
      <p style="margin:12px 0 0;font-size:13px">Reference ${escapeHtml(input.bookingReference)}</p>
    </div>
    <p><a href="${verify}" style="color:#C29B62">Verify your ticket</a></p>
    <p style="font-size:13px;color:#9eb0c4">WhatsApp · ${escapeHtml(contacts.phone)} · ${escapeHtml(contacts.email)} · panora.co.zw</p>
  </div>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Send guest email if possible; never throw — booking must survive notify failure. */
export async function notifyEnquiryCreated(
  input: NotifyBookingInput,
): Promise<{ emailSent: boolean; emailError?: string }> {
  if (!input.email) {
    return { emailSent: false, emailError: "No guest email" };
  }

  const text = customerWhatsAppTemplate(input);
  const result = await sendWithResend({
    to: input.email,
    subject: `Panora Go enquiry — ${input.customerNumber}`,
    html: enquiryEmailHtml(input),
    text,
  });

  if (!result.ok) {
    console.info(
      "[bookings] Email not sent (booking kept):",
      result.error,
    );
  }

  return { emailSent: result.ok, emailError: result.error };
}

export async function notifyBookingConfirmed(
  input: NotifyBookingInput,
): Promise<{ emailSent: boolean; emailError?: string }> {
  if (!input.email) {
    return { emailSent: false, emailError: "No guest email" };
  }

  const text = confirmationWhatsAppTemplate(input);
  const contacts = supportContacts();
  const html = `
  <div style="font-family:Georgia,serif;background:#0A192F;color:#fff;padding:32px">
    <h1 style="color:#C29B62">Panora Go — CONFIRMED</h1>
    <p>Hello ${escapeHtml(input.customerName)},</p>
    <p>Your visit to <strong>${escapeHtml(input.venueName)}</strong> is confirmed.</p>
    <p>Customer Number: <strong style="color:#C29B62">${escapeHtml(input.customerNumber)}</strong></p>
    <p>Reference: ${escapeHtml(input.bookingReference)}</p>
    <p><a href="${absoluteUrl(`/verify/${input.customerNumber}`)}" style="color:#C29B62">Verify ticket</a></p>
    <p style="font-size:13px;color:#9eb0c4">${escapeHtml(contacts.phone)} · ${escapeHtml(contacts.email)}</p>
  </div>`;

  const result = await sendWithResend({
    to: input.email,
    subject: `Confirmed — ${input.venueName} (${input.customerNumber})`,
    html,
    text,
  });

  if (!result.ok) {
    console.info(
      "[bookings] Confirmation email not sent (booking kept):",
      result.error,
    );
  }

  return { emailSent: result.ok, emailError: result.error };
}
