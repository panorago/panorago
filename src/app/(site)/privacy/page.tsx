import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Panora Go handles your information with care.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  const email = process.env.NEXT_PUBLIC_PANORA_EMAIL ?? "info@panora.co.zw";

  return (
    <div className="gradient-mesh">
      <Reveal className="container-narrow py-[var(--space-section)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Legal
        </p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Privacy</h1>
        <div className="mt-8 space-y-5 text-sm leading-relaxed text-[var(--foreground-muted)]">
          <p>
            Panora Go collects only what we need to help you discover and
            enquire about places — such as enquiry details you submit, optional
            experience stories you post, and basic analytics if enabled.
          </p>
          <p>
            Saved places may be stored in your browser (local storage) so your
            wishlist works without an account. We do not sell personal data.
          </p>
          <p>
            Enquiries are handled by our concierge team via WhatsApp, email, or
            phone. Message content is used solely to assist your request.
          </p>
          <p>
            Questions:{" "}
            <a
              href={`mailto:${email}`}
              className="text-[var(--accent)] underline-offset-2 hover:underline"
            >
              {email}
            </a>
            .
          </p>
          <p>
            See also{" "}
            <Link href="/terms" className="text-[var(--accent)] hover:underline">
              Terms
            </Link>
            .
          </p>
        </div>
      </Reveal>
    </div>
  );
}
