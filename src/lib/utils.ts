import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function isLocalhostUrl(value: string) {
  return /localhost|127\.0\.0\.1/i.test(value);
}

function isVercelAppUrl(value: string) {
  return /(^|\.)vercel\.app$/i.test(
    value.replace(/^https?:\/\//i, "").split("/")[0] ?? "",
  );
}

/** Public site. Enquiry QR codes and PDFs must not use *.vercel.app. */
export const PUBLIC_SITE_ORIGIN = "https://panorago.co.zw";

/**
 * Canonical origin for share links, QR codes, and tickets.
 * Never localhost or *.vercel.app — those are not the public site.
 */
export function resolveSiteOrigin(baseOverride?: string | null) {
  const override = baseOverride?.trim().replace(/\/$/, "") ?? "";
  if (override && !isLocalhostUrl(override) && !isVercelAppUrl(override)) {
    return override;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  if (configured && !isLocalhostUrl(configured) && !isVercelAppUrl(configured)) {
    return configured;
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/$/, "");
    if (origin && !isLocalhostUrl(origin) && !isVercelAppUrl(origin)) {
      return origin;
    }
  }

  return PUBLIC_SITE_ORIGIN;
}

export function absoluteUrl(path = "", baseOverride?: string | null) {
  const base = resolveSiteOrigin(baseOverride);
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Request host for auth callbacks. Verify links ignore *.vercel.app hosts. */
export function siteOriginFromRequest(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = (forwardedHost ?? request.headers.get("host") ?? "")
    .split(",")[0]
    ?.trim();
  if (host) {
    const protoHeader = request.headers.get("x-forwarded-proto");
    const proto =
      protoHeader?.split(",")[0]?.trim() ||
      (isLocalhostUrl(host) ? "http" : "https");
    return `${proto}://${host}`;
  }
  try {
    return new URL(request.url).origin;
  } catch {
    return resolveSiteOrigin();
  }
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
