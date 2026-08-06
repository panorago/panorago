import Link from "next/link";

import { PanoraLogo } from "@/components/brand/panora-logo";
import { cn } from "@/lib/utils";

const FOOTER_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/discover?vibe=Weekend%20Away", label: "Weekend escapes" },
  { href: "/enquiry", label: "Enquiry" },
  { href: "/saved", label: "Saved" },
] as const;

type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-[var(--border)] bg-[var(--background-elevated)]",
        className,
      )}
    >
      <div className="container-panora py-14 sm:py-16">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm space-y-4">
            <PanoraLogo variant="full" width={140} height={38} />
            <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
              Curated Zimbabwe lifestyle — places worth dressing for, evenings
              worth remembering, and weekends that feel like a secret.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-col gap-2.5 sm:items-end">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="focus-ring text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--foreground-muted)]">
            © {year} Panora Go. Crafted for Zimbabwe.
          </p>
          <p className="text-xs tracking-wide text-[var(--accent)]">
            Live beautifully. Discover intentionally.
          </p>
        </div>
      </div>
    </footer>
  );
}
