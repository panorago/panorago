import {
  BOOKING_STATUS_COLORS,
  isBookingReference,
  isCustomerNumber,
  normalizeTicketCode,
  type BookingStatus,
} from "@/lib/bookings/codes";
import {
  getBookingForVerify,
  markVerified,
  type PublicBookingView,
} from "@/lib/bookings/verify";
import { PanoraLogo } from "@/components/brand/panora-logo";
import { absoluteUrl } from "@/lib/utils";
import { BadgeCheck, CalendarDays, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

type PageProps = {
  params: Promise<{ customerNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { customerNumber } = await params;
  const decoded = normalizeTicketCode(customerNumber);
  return {
    title: `Verify ${decoded} — Panora Go`,
    description: "Panora Go concierge ticket verification",
    robots: { index: false, follow: false },
  };
}

export default async function VerifyPage({ params, searchParams }: PageProps) {
  const { customerNumber: raw } = await params;
  const query = await searchParams;
  const customerNumber = normalizeTicketCode(raw);

  const hints = {
    guest: firstParam(query.guest),
    venue: firstParam(query.venue),
    date: firstParam(query.date),
    ref: firstParam(query.ref),
    status: firstParam(query.status),
  };

  const lookupKey =
    isCustomerNumber(customerNumber) || isBookingReference(customerNumber)
      ? customerNumber
      : hints.ref && isBookingReference(normalizeTicketCode(hints.ref))
        ? normalizeTicketCode(hints.ref)
        : customerNumber;

  const booking =
    isCustomerNumber(lookupKey) || isBookingReference(lookupKey)
      ? await getBookingForVerify(lookupKey)
      : null;

  if (!booking) {
    const recognizable =
      isCustomerNumber(customerNumber) ||
      isBookingReference(customerNumber) ||
      Boolean(hints.guest || hints.venue || hints.ref);

    if (recognizable) {
      return (
        <OfflineTicketCard
          customerNumber={
            isCustomerNumber(customerNumber)
              ? customerNumber
              : hints.ref && isCustomerNumber(normalizeTicketCode(hints.ref))
                ? normalizeTicketCode(hints.ref)
                : customerNumber
          }
          hints={hints}
        />
      );
    }

    return (
      <Shell>
        <h1 className="mt-6 font-display text-3xl">Ticket not found</h1>
        <p className="mt-3 text-sm text-muted">
          We could not verify{" "}
          <span className="font-semibold text-[var(--accent)]">
            {customerNumber || "this code"}
          </span>
          . Check the Panora Customer Number on your PDF ticket or contact
          Panora Concierge.
        </p>
        <HomeLink />
      </Shell>
    );
  }

  const verifiedAt =
    booking.verifiedAt ?? (await markVerified(booking.customerNumber));
  const verificationTimestamp = formatWhen(verifiedAt);

  return <FoundTicketCard booking={booking} scannedAt={verificationTimestamp} />;
}

function FoundTicketCard({
  booking,
  scannedAt,
}: {
  booking: PublicBookingView;
  scannedAt: string;
}) {
  const statusMeta =
    BOOKING_STATUS_COLORS[booking.status] ?? BOOKING_STATUS_COLORS.pending;
  const headline = statusHeadline(booking.status);

  return (
    <main className="gradient-mesh min-h-dvh px-4 py-12 md:py-20">
      <div className="mx-auto max-w-lg overflow-hidden rounded-[var(--radius-xl)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--glass)_88%,transparent)] shadow-[var(--shadow)] backdrop-blur-2xl">
        <div className="bg-[var(--brand-navy)] px-8 py-8 text-center text-white">
          <div className="flex justify-center">
            <PanoraLogo
              variant="icon"
              href={null}
              tone="on-dark"
              priority
              imageClassName="h-[72px] w-auto"
            />
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Discover · Connect · Belong
          </p>
          <h1 className="mt-2 font-display text-3xl">Ticket verification</h1>
          <div
            className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${headline.className}`}
          >
            <BadgeCheck className="h-4 w-4" />
            {headline.label}
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
            Scanned at {scannedAt}
            <br />
            <span className="opacity-70">
              {absoluteUrl(`/verify/${booking.customerNumber}`)}
            </span>
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

function OfflineTicketCard({
  customerNumber,
  hints,
}: {
  customerNumber: string;
  hints: {
    guest: string | null;
    venue: string | null;
    date: string | null;
    ref: string | null;
    status: string | null;
  };
}) {
  const statusKey = (hints.status as BookingStatus) || "pending";
  const statusMeta =
    BOOKING_STATUS_COLORS[statusKey] ?? BOOKING_STATUS_COLORS.pending;

  return (
    <main className="gradient-mesh min-h-dvh px-4 py-12 md:py-20">
      <div className="mx-auto max-w-lg overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--glass)_88%,transparent)] shadow-[var(--shadow)] backdrop-blur-2xl">
        <div className="bg-[var(--brand-navy)] px-8 py-8 text-center text-white">
          <div className="flex justify-center">
            <PanoraLogo
              variant="icon"
              href={null}
              tone="on-dark"
              priority
              imageClassName="h-[72px] w-auto"
            />
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Discover · Connect · Belong
          </p>
          <h1 className="mt-2 font-display text-3xl">Ticket verification</h1>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,#c29b62_22%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
            Ticket recognised
          </div>
        </div>

        <div className="space-y-5 px-8 py-8">
          <p className="text-sm text-muted">
            This code is valid, but we could not load the live booking record
            (offline, seed, or sync delay). Present your Customer Number to
            Concierge.
          </p>

          {(hints.guest || hints.venue || hints.date) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {hints.guest ? (
                <Info label="Guest" value={hints.guest} />
              ) : null}
              {hints.venue ? (
                <Info
                  icon={<MapPin className="h-4 w-4 text-[var(--accent)]" />}
                  label="Venue"
                  value={hints.venue}
                />
              ) : null}
              {hints.date ? (
                <Info
                  icon={
                    <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
                  }
                  label="Visit date"
                  value={hints.date}
                />
              ) : null}
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
          )}

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Customer number
            </p>
            <p className="mt-1 font-mono text-xl font-semibold tracking-wide text-[var(--accent)]">
              {customerNumber}
            </p>
            {hints.ref ? (
              <p className="mt-2 text-xs text-muted">Reference {hints.ref}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <HomeLink />
          </div>
        </div>
      </div>
    </main>
  );
}

function statusHeadline(status: BookingStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "confirmed":
      return {
        label: "Confirmed",
        className:
          "bg-[color-mix(in_srgb,#22c55e_22%,transparent)] text-[#4ade80]",
      };
    case "pending":
      return {
        label: "Pending confirmation",
        className:
          "bg-[color-mix(in_srgb,#c29b62_22%,transparent)] text-[var(--accent)]",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className:
          "bg-[color-mix(in_srgb,#ef4444_22%,transparent)] text-[#f87171]",
      };
    case "unavailable":
      return {
        label: "Unavailable",
        className:
          "bg-[color-mix(in_srgb,#f97316_22%,transparent)] text-[#fb923c]",
      };
    case "completed":
      return {
        label: "Completed",
        className:
          "bg-[color-mix(in_srgb,#3b82f6_22%,transparent)] text-[#60a5fa]",
      };
    default:
      return {
        label: "Ticket found",
        className:
          "bg-[color-mix(in_srgb,#c29b62_22%,transparent)] text-[var(--accent)]",
      };
  }
}

function formatWhen(value: string | null) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="gradient-mesh min-h-dvh px-4 py-16">
      <div className="mx-auto max-w-lg rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--glass)] p-8 text-center shadow-[var(--shadow)] backdrop-blur-xl">
        <div className="flex justify-center">
          <PanoraLogo
            variant="icon"
            href={null}
            tone="auto"
            imageClassName="h-16 w-auto"
          />
        </div>
        {children}
      </div>
    </main>
  );
}

function HomeLink() {
  return (
    <Link
      href="/"
      className="mt-8 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-navy)]"
    >
      Return Home
    </Link>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
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
