"use client";

import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Toast = {
  id: string;
  title: string;
  body: string;
  href: string;
};

type BookingRealtimeRow = {
  id?: string;
  customer_name?: string;
  venue_name?: string;
  customer_number?: string;
  status?: string;
  booking_reference?: string;
  qr_code_url?: string | null;
  ticket_pdf_url?: string | null;
};

type SubmissionRealtimeRow = {
  id?: string;
  place_name?: string;
  submitter_name?: string;
  status?: string;
};

type AdminRealtimeContextValue = {
  /** Monotonic counter bumped on every relevant DB change. */
  revision: number;
  lastBookingChange: BookingRealtimeRow | null;
};

const AdminRealtimeContext = createContext<AdminRealtimeContextValue>({
  revision: 0,
  lastBookingChange: null,
});

export function useAdminRealtime() {
  return useContext(AdminRealtimeContext);
}

const REFRESH_PATH_PREFIXES = [
  "/admin",
  "/admin/enquiries",
  "/admin/tickets",
  "/admin/bookings",
  "/admin/submissions",
  "/admin/places",
  "/admin/analytics",
] as const;

function shouldRefreshPath(pathname: string) {
  if (pathname === "/admin") return true;
  return REFRESH_PATH_PREFIXES.some(
    (prefix) => prefix !== "/admin" && pathname.startsWith(prefix),
  );
}

/**
 * Shared Command Center realtime bus:
 * - Live toasts for new enquiries / submissions / ticket status changes
 * - Debounced router.refresh() so dashboard, lists, and detail pages stay in sync
 */
export function AdminRealtimeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [revision, setRevision] = useState(0);
  const [lastBookingChange, setLastBookingChange] =
    useState<BookingRealtimeRow | null>(null);

  const pathnameRef = useRef(pathname);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStatusToastRef = useRef<string>("");

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const bumpAndRefresh = useCallback(() => {
    setRevision((n) => n + 1);
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      if (shouldRefreshPath(pathnameRef.current)) {
        router.refresh();
      }
    }, 280);
  }, [router]);

  const pushToast = useCallback((toast: Toast) => {
    setToasts((prev) => [toast, ...prev].slice(0, 4));
  }, []);

  useEffect(() => {
    let cancelled = false;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel("command-center-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as BookingRealtimeRow;
          const id = String(row.id ?? Date.now());
          setLastBookingChange(row);
          pushToast({
            id: `booking-ins-${id}`,
            title: "New enquiry",
            body: `${row.customer_name ?? "Guest"} · ${row.venue_name ?? "Venue"} (${row.customer_number ?? "—"})`,
            href: `/admin/enquiries/${id}`,
          });
          bumpAndRefresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as BookingRealtimeRow;
          const prev = payload.old as BookingRealtimeRow;
          setLastBookingChange(row);
          // Requires REPLICA IDENTITY FULL on bookings (migration 007/010)
          // so payload.old includes the previous status.
          const statusChanged =
            Boolean(row.status) &&
            prev.status !== undefined &&
            prev.status !== row.status;
          if (statusChanged && row.status) {
            const id = String(row.id ?? "unknown");
            const toastKey = `${id}:${row.status}`;
            if (lastStatusToastRef.current !== toastKey) {
              lastStatusToastRef.current = toastKey;
              pushToast({
                id: `booking-upd-${toastKey}-${Date.now()}`,
                title: `Ticket ${row.status}`,
                body: `${row.customer_name ?? "Guest"} · ${row.customer_number ?? row.booking_reference ?? "—"}`,
                href: row.id ? `/admin/enquiries/${row.id}` : "/admin/tickets",
              });
            }
          }
          bumpAndRefresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "place_submissions" },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as SubmissionRealtimeRow;
          const id = String(row.id ?? Date.now());
          pushToast({
            id: `sub-${id}`,
            title: "Place submission",
            body: `${row.place_name ?? "Place"} from ${row.submitter_name ?? "someone"}`,
            href: "/admin/submissions",
          });
          bumpAndRefresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "place_submissions" },
        () => {
          if (cancelled) return;
          bumpAndRefresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "places" },
        () => {
          if (cancelled) return;
          bumpAndRefresh();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [bumpAndRefresh, pushToast]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const value = useMemo(
    () => ({ revision, lastBookingChange }),
    [revision, lastBookingChange],
  );

  return (
    <AdminRealtimeContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(100vw-2rem,22rem)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              className="pointer-events-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass-strong)] p-4 shadow-[var(--shadow-gold)] backdrop-blur-xl"
              role="status"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)]">
                  <Bell className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                    {toast.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">
                    {toast.body}
                  </p>
                  <Link
                    href={toast.href}
                    className="mt-2 inline-block text-xs font-medium text-[var(--accent)] hover:underline"
                    onClick={() => dismiss(toast.id)}
                  >
                    Open →
                  </Link>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  className="rounded-full p-1 text-muted hover:bg-[var(--glass)]"
                  onClick={() => dismiss(toast.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AdminRealtimeContext.Provider>
  );
}
