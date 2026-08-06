import { BOOKING_STATUS_COLORS } from "@/lib/bookings/codes";
import {
  getBookingForVerify,
  markVerified,
} from "@/lib/bookings/verify";
import { absoluteUrl } from "@/lib/utils";
import { BadgeCheck, CalendarDays, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

type PageProps = {
  params: Promise<{ customerNumber: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { customerNumber } = await params;
  const decoded = decodeURIComponent(customerNumber).toUpperCase();
  return {
    title: `Verify ${decoded} — Panora Go`,
    description: "Panora Go concierge ticket verification",
    robots: { index: false, follow: false },
  };
}

export default async function VerifyPage({ params }: PageProps) {
  const { customerNumber: raw } = await params;
  const customerNumber = decodeURIComponent(raw).trim().toUpperCase();
  if (!customerNumber.startsWith("PGO-")) {
    notFound();
  }

  const booking = await getBookingForVerify(customerNumber);
  if (!booking) {
    return (
      <main className="gradient-mesh min-h-dvh px-4 py-16">
        <div className="mx-auto max-w-lg rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--glass)] p-8 text-center shadow-[var(--shadow)] backdrop-blur-xl">
          <Image
            src="/logos/pgo-dark-icon.png"
            alt="Panora Go"
            width={64}
            height={64}
            className="mx-auto dark:hidden"
          />
          <Image
            src="/logos/pgo-light-icon.png"
            alt="Panora Go"
            width={64}
            height={64}
            className="mx-auto hidden dark:block"
          />
          <h1 className="mt-6 font-display text-3xl">Ticket not found</h1>
          <p className="mt-3 text-sm text-muted">
            We could not verify{" "}
            <span className="font-semibold text-[var(--accent)]">
              {customerNumber}
            </span>
            . Check the number on your PDF ticket or contact Panora Concierge.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-navy)]"
          >
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  const verifiedAt =
    booking.verifiedAt ?? (await markVerified(booking.customerNumber));
  const verificationTimestamp = verifiedAt
    ? new Date(verifiedAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const statusMeta =
    BOOKING_STATUS_COLORS[booking.status] ?? BOOKING_STATUS_COLORS.pending;

  return (
    <main className="gradient-mesh min-h-dvh px-4 py-12 md:py-20">
      <div className="mx-auto max-w-lg overflow-hidden rounded-[var(--radius-xl)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--glass)_88%,transparent)] shadow-[var(--shadow)] backdrop-blur-2xl">
        <div className="bg-[var(--brand-navy)] px-8 py-8 text-center text-white">
          <Image
            src="/logos/pgo-light-icon.png"
            alt="Panora Go"
            width={72}
            height={72}
            className="mx-auto"
            priority
          />
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Discover · Connect · Belong
          </p>
          <h1 className="mt-2 font-display text-3xl">Ticket verification</h1>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,#22c55e_22%,transparent)] px-4 py-2 text-sm font-semibold text-[#4ade80]">
            <BadgeCheck className="h-4 w-4" />
            Verified
          </div>
        </div>

        <div className="space-y-5 px-8 py-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Guest
            </p>
            <p className="mt-1 font-display text-2xl">{booking.customerName}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Info
              icon={<MapPin className="h-4 w-4 text-[var(--accent)]" />}
              label="Venue"
              value={booking.venueName}
            />
            <Info
              icon={<CalendarDays className="h-4 w-4 text-[var(--accent)]" />}
              label="Visit date"
              value={booking.preferredDate || "To be confirmed"}
            />
            <Info
              icon={<Users className="h-4 w-4 text-[var(--accent)]" />}
              label="Guests"
              value={`${booking.adults} adults · ${booking.children} children`}
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Status
              </p>
              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Customer number
            </p>
            <p className="mt-1 font-mono text-xl font-semibold tracking-wide text-[var(--accent)]">
              {booking.customerNumber}
            </p>
            <p className="mt-2 text-xs text-muted">
              Reference {booking.bookingReference}
            </p>
          </div>

          <p className="text-center text-xs text-muted">
            Verified at {verificationTimestamp}
            <br />
            <span className="opacity-70">{absoluteUrl(`/verify/${booking.customerNumber}`)}</span>
          </p>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link
              href="/"
              className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:border-[var(--accent)]"
            >
              Return Home
            </Link>
            <Link
              href="/discover"
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--brand-navy)]"
            >
              Explore More Places
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
