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
  adults?: number | string;
  children?: number | string;
  /** @deprecated Prefer adults / children */
  guests?: string;
  phone?: string;
  budget?: string;
  specialRequest?: string;
  firstName?: string;
  surname?: string;
  occasion?: string;
  customerNumber?: string;
}) {
  const adults =
    params.adults === "" || params.adults == null
      ? "—"
      : String(params.adults);
  const children =
    params.children === "" || params.children == null
      ? "—"
      : String(params.children);
  const guestLine =
    params.adults != null || params.children != null
      ? [`Adults: ${adults}`, `Children: ${children}`]
      : [`Guests: ${params.guests || "—"}`];
  const name =
    [params.firstName, params.surname].filter(Boolean).join(" ").trim() ||
    null;

  const lines = [
    "Hello Panora Go.",
    "",
    "I'd like to enquire about",
    params.placeName,
    "",
    ...(name ? [`Name: ${name}`] : []),
    ...(params.customerNumber
      ? [`Customer Number: ${params.customerNumber}`]
      : []),
    `Date: ${params.date || "—"}`,
    ...guestLine,
    `Occasion: ${params.occasion || "—"}`,
    `Phone: ${params.phone || "—"}`,
    `Budget: ${params.budget || "—"}`,
    `Special Request: ${params.specialRequest || "—"}`,
  ];
  return lines.join("\n");
}

export function ticketDownloadUrl(
  code: string,
  params: {
    placeName?: string;
    date?: string;
    adults?: number | string;
    children?: number | string;
    phone?: string;
    specialRequest?: string;
    name?: string;
    customerNumber?: string;
    occasion?: string;
    address?: string;
  },
) {
  const qs = new URLSearchParams();
  if (params.placeName) qs.set("place", params.placeName);
  if (params.date) qs.set("date", params.date);
  if (params.adults != null && params.adults !== "")
    qs.set("adults", String(params.adults));
  if (params.children != null && params.children !== "")
    qs.set("children", String(params.children));
  if (params.phone) qs.set("phone", params.phone);
  if (params.specialRequest) qs.set("special_request", params.specialRequest);
  if (params.name) qs.set("name", params.name);
  if (params.customerNumber) qs.set("customer_number", params.customerNumber);
  if (params.occasion) qs.set("occasion", params.occasion);
  if (params.address) qs.set("address", params.address);
  const query = qs.toString();
  return `/api/enquiries/${encodeURIComponent(code)}/ticket${query ? `?${query}` : ""}`;
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
