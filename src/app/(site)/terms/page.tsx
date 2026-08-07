import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for Panora Go lifestyle discovery.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  const email = process.env.NEXT_PUBLIC_PANORA_EMAIL ?? "info@panora.co.zw";

  return (
    <div className="gradient-mesh">
      <Reveal className="container-narrow py-[var(--space-section)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Legal
        </p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Terms</h1>
        <div className="long-form mt-8 space-y-5 text-sm leading-relaxed text-[var(--foreground-muted)]">
          <p>
            Panora Go is a curated discovery and concierge enquiry platform. We
            do not process payments or confirmed bookings on this site. Venue
            availability, pricing, and conditions are confirmed directly during
            enquiry.
          </p>
          <p>
            Content is provided for inspiration. Stories and notes reflect
            editorial curation; experiences may vary. Panora Verified signals
            indicate checks we perform — they are not guarantees of future
            conditions.
          </p>
          <p>
            By using Panora Go you agree to communicate respectfully with our
            team and partner venues, and not to misuse enquiry channels.
          </p>
          <p>
            Contact:{" "}
            <a
              href={`mailto:${email}`}
              className="text-[var(--accent)] underline-offset-2 hover:underline"
            >
              {email}
            </a>
            . Read our{" "}
            <Link
              href="/privacy"
              className="text-[var(--accent)] hover:underline"
            >
              Privacy
            </Link>{" "}
            policy.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
