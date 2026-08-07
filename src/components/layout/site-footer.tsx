import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { PanoraLogo } from "@/components/brand/panora-logo";
import { cn } from "@/lib/utils";

const EXPLORE_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/map", label: "Map" },
  { href: "/discover?vibe=Weekend%20Away", label: "Weekend escapes" },
  { href: "/saved", label: "Wishlist" },
  { href: "/enquiry", label: "Enquire" },
  { href: "/add-your-place", label: "Add your place" },
] as const;

const COMPANY_LINKS = [
  { href: "/the-panora-way", label: "The Panora Way" },
  { href: "/about", label: "About Panora" },
  { href: "/add-your-place", label: "List your place" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

function SocialGlyph({
  type,
  className,
}: {
  type: "instagram" | "facebook" | "tiktok" | "x";
  className?: string;
}) {
  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  if (type === "facebook") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden
      >
        <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z" />
      </svg>
    );
  }
  if (type === "tiktok") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden
      >
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.16 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52V6.79a4.85 4.85 0 0 1-1.01-.1z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.727-8.835L1.254 2.25H8.08l4.251 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const whatsapp = process.env.NEXT_PUBLIC_PANORA_WHATSAPP ?? "263715708327";
  const phoneDisplay =
    process.env.NEXT_PUBLIC_PANORA_PHONE_DISPLAY ?? "+263 71 553 5982";
  const phone = process.env.NEXT_PUBLIC_PANORA_PHONE ?? "+263715535982";
  const email = process.env.NEXT_PUBLIC_PANORA_EMAIL ?? "info@panora.co.zw";

  const socials = [
    {
      label: "Instagram",
      href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
      type: "instagram" as const,
    },
    {
      label: "Facebook",
      href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
      type: "facebook" as const,
    },
    {
      label: "TikTok",
      href: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK,
      type: "tiktok" as const,
    },
    {
      label: "X",
      href: process.env.NEXT_PUBLIC_SOCIAL_X,
      type: "x" as const,
    },
  ];

  return (
    <footer
      className={cn(
        "border-t border-[var(--border)] bg-[var(--background-elevated)]",
        className,
      )}
    >
      <div className="container-panora py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 space-y-5">
            <PanoraLogo variant="icon" tone="auto" alt="PGO" />
            <p className="long-form max-w-sm text-sm leading-relaxed text-[var(--foreground-muted)]">
              Zimbabwe&apos;s premium lifestyle discovery platform. We sell
              experiences, memories, weekends, and anticipation — hand-curated
              places with insider notes, never generic listings.
            </p>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Discover. Connect. Belong.
            </p>
          </div>

          <div className="min-w-0">
            <h2 className="font-display text-lg">Explore</h2>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="focus-ring text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h2 className="font-display text-lg">Company</h2>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="focus-ring text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h2 className="font-display text-lg">Concierge</h2>
            <ul className="mt-4 space-y-3 text-sm text-[var(--foreground-muted)]">
              <li>
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  className="focus-ring inline-flex items-center gap-2 transition-colors hover:text-[var(--foreground)]"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4 text-[var(--accent)]" />
                  WhatsApp · 0715 708 327
                </a>
              </li>
              <li>
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="focus-ring inline-flex items-center gap-2 transition-colors hover:text-[var(--foreground)]"
                >
                  <Phone className="h-4 w-4 text-[var(--accent)]" />
                  Call · {phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${email}`}
                  className="focus-ring inline-flex min-w-0 items-center gap-2 break-all transition-colors hover:text-[var(--foreground)]"
                >
                  <Mail className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                  {email}
                </a>
              </li>
              <li className="inline-flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span>Harare, Zimbabwe · Southern Africa</span>
              </li>
            </ul>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                Follow Panora
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {socials.map((social) => {
                  const href = social.href?.trim();
                  const ready = Boolean(href);
                  const className = cn(
                    "focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--glass)] text-[var(--foreground)] transition",
                    ready
                      ? "hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      : "cursor-default opacity-55",
                  );
                  return (
                    <li key={social.label}>
                      {ready ? (
                        <a
                          href={href}
                          aria-label={social.label}
                          title={social.label}
                          className={className}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <SocialGlyph type={social.type} className="h-4 w-4" />
                        </a>
                      ) : (
                        <span
                          aria-label={`${social.label} (link coming soon)`}
                          title={`${social.label} — link coming soon`}
                          className={className}
                        >
                          <SocialGlyph type={social.type} className="h-4 w-4" />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                Social links launching soon — icons are ready for your URLs.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--foreground-muted)]">
            © {year} Panora Go. Premium lifestyle discovery for Zimbabwe.
          </p>
          <p className="text-xs text-[var(--foreground-muted)]">
            No booking fees · Manual concierge · Panora Verified places
          </p>
        </div>
      </div>
    </footer>
  );
}
