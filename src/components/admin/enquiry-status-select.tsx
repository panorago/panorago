"use client";

import { useAdminRealtime } from "@/components/admin/admin-realtime-provider";
import {
  BOOKING_STATUS_COLORS,
  type BookingStatus,
} from "@/lib/bookings/codes";
import { updateBookingStatusAction } from "@/lib/bookings/admin-actions";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "unavailable",
  "cancelled",
  "completed",
];

type EnquiryStatusSelectProps = {
  bookingId: string;
  initialStatus: BookingStatus;
};

export function EnquiryStatusSelect({
  bookingId,
  initialStatus,
}: EnquiryStatusSelectProps) {
  const router = useRouter();
  const { lastBookingChange, revision } = useAdminRealtime();
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (!lastBookingChange?.id || lastBookingChange.id !== bookingId) return;
    if (!lastBookingChange.status) return;
    const next = lastBookingChange.status as BookingStatus;
    if (STATUSES.includes(next)) setStatus(next);
  }, [lastBookingChange, revision, bookingId]);

  const colors = BOOKING_STATUS_COLORS[status];

  function onChange(next: BookingStatus) {
    setError(null);
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", bookingId);
      formData.set("status", next);
      const result = await updateBookingStatusAction(formData);
      if (!result.ok) {
        setError(result.error);
        setStatus(prev);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <select
        disabled={pending}
        value={status}
        onChange={(e) => onChange(e.target.value as BookingStatus)}
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium outline-none ${colors.className}`}
        aria-label="Enquiry status"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {BOOKING_STATUS_COLORS[s].label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="text-[11px] text-[var(--danger)]">{error}</span>
      ) : null}
    </div>
  );
}
