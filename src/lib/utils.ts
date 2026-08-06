import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function formatDistance(km: number | null | undefined) {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatPriceGuide(value: string | null | undefined) {
  if (!value) return "Enquire";
  return value;
}

export function buildEnquiryMessage(params: {
  placeName: string;
  date?: string;
  guests?: string;
  phone?: string;
  budget?: string;
  specialRequest?: string;
}) {
  const lines = [
    "Hello Panora Go.",
    "",
    "I'd like to enquire about",
    params.placeName,
    "",
    `Date: ${params.date || "—"}`,
    `Guests: ${params.guests || "—"}`,
    `Phone: ${params.phone || "—"}`,
    `Budget: ${params.budget || "—"}`,
    `Special Request: ${params.specialRequest || "—"}`,
  ];
  return lines.join("\n");
}

export function whatsappUrl(phone: string, message: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function mailtoUrl(email: string, subject: string, body: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function telUrl(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}
