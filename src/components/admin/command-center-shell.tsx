"use client";

import { AdminRealtimeProvider } from "@/components/admin/admin-realtime-provider";
import { PanoraLogo } from "@/components/brand/panora-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { logoutAdmin } from "@/lib/admin/actions";
import { globalAdminSearch } from "@/lib/admin/command";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion/variants";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Home,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  Ticket,
  Users,
  X,
  Layers,
  FilePlus2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  useCallback,
  useEffect,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
} from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/places", label: "Places", icon: MapPin },
  { href: "/admin/enquiries", label: "Enquiries", icon: CalendarCheck },
  { href: "/admin/stories", label: "The Story Continues", icon: BookOpen },
  { href: "/admin/collections", label: "Collections", icon: FolderKanban },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/homepage", label: "Homepage", icon: Layers },
  { href: "/admin/tickets", label: "Tickets", icon: Ticket },
  { href: "/admin/submissions", label: "Submissions", icon: FilePlus2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

type SearchHit = {
  places: {
    id: string;
    name: string;
    slug: string;
    city: string;
    published: boolean;
  }[];
  bookings: {
    id: string;
    booking_reference: string;
    customer_number: string;
    customer_name: string;
    venue_name: string;
    status: string;
  }[];
  stories: {
    id: string;
    author_name: string;
    body: string;
    published: boolean;
  }[];
};

export function CommandCenterShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const isLogin = pathname.startsWith("/admin/login");
  /** White/gold on navy Command Center; navy mark in light admin; auto before theme resolves. */
  const logoTone =
    resolvedTheme === "light"
      ? ("on-light" as const)
      : resolvedTheme === "dark"
        ? ("on-dark" as const)
        : ("auto" as const);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const runSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setHits(null);
      return;
    }
    startTransition(async () => {
      const result = await globalAdminSearch(value);
      setHits(result as SearchHit);
      setSearchOpen(true);
    });
  }, []);

  if (isLogin) {
    return (
      <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </div>
    );
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebarWidth = collapsed ? 88 : 280;

  const navLinks = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
      {NAV.map((item) => {
        const active = isActive(item.href, "exact" in item ? item.exact : false);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              "group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition",
              active
                ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]"
                : "text-muted hover:bg-[var(--glass)] hover:text-[var(--foreground)]",
              collapsed && "justify-center px-2",
            )}
          >
            {active && (
              <motion.span
                layoutId={reduceMotion ? undefined : "admin-nav-active"}
                className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-[var(--accent)]"
              />
            )}
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const footerLinks = (
    <div className="space-y-2 border-t border-[var(--border)] p-3">
      <Link
        href="/"
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-muted transition hover:bg-[var(--glass)] hover:text-[var(--foreground)]",
          collapsed && "justify-center px-2",
        )}
      >
        <Home className="h-4 w-4 shrink-0" />
        {!collapsed && "View site"}
      </Link>
      <form action={logoutAdmin}>
        <button
          type="submit"
          className={cn(
            "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-muted transition hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </form>
    </div>
  );

  return (
    <AdminRealtimeProvider>
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <motion.aside
        className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[var(--border)] bg-[var(--glass-strong)] backdrop-blur-2xl lg:flex"
        animate={{ width: sidebarWidth }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 320, damping: 32 }
        }
      >
        <div
          className={cn(
            "flex items-center gap-3 border-b border-[var(--border)] px-4 py-5",
            collapsed && "justify-center px-2",
          )}
        >
          <PanoraLogo
            variant={collapsed ? "icon" : "full"}
            href="/admin"
            tone={logoTone}
            priority
            imageClassName={collapsed ? "h-9 w-auto" : "h-8 w-auto"}
          />
          {!collapsed && (
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Command Center
            </p>
          )}
        </div>
        {navLinks}
        {footerLinks}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-elevated)] text-muted shadow-[var(--shadow)] hover:text-[var(--accent)]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-[var(--overlay)] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[min(88vw,300px)] flex-col border-r border-[var(--border)] bg-[var(--background-elevated)] lg:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: motionTokens.duration.base,
                      ease: motionTokens.ease.premium,
                    }
              }
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <PanoraLogo
                  variant="full"
                  href="/admin"
                  tone={logoTone}
                  priority
                  imageClassName="h-8 w-auto"
                />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full p-2 text-muted hover:bg-[var(--glass)]"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="border-b border-[var(--border)] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                    Command Center
                  </p>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
                  {NAV.map((item) => {
                    const active = isActive(
                      item.href,
                      "exact" in item ? item.exact : false,
                    );
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition",
                          active
                            ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]"
                            : "text-muted hover:bg-[var(--glass)]",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                {footerLinks}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div
        className="min-h-dvh transition-[margin] duration-300 ease-out lg:ml-[var(--cc-sidebar)]"
        style={
          {
            ["--cc-sidebar" as string]: `${sidebarWidth}px`,
          } as CSSProperties
        }
      >
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--glass-strong)] backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              className="rounded-full border border-[var(--border)] p-2 text-muted hover:bg-[var(--glass)] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => runSearch(e.target.value)}
                onFocus={() => hits && setSearchOpen(true)}
                placeholder="Search places, enquiries, stories…"
                className="w-full rounded-full border border-[var(--border)] bg-[var(--background)] py-2.5 pr-4 pl-10 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
              />
              {searchOpen && hits && (
                <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-elevated)] p-3 shadow-[var(--shadow)]">
                  {pending && (
                    <p className="px-2 py-1 text-xs text-muted">Searching…</p>
                  )}
                  {!hits.places.length &&
                    !hits.bookings.length &&
                    !hits.stories.length && (
                      <p className="px-2 py-3 text-sm text-muted">No matches.</p>
                    )}
                  {hits.places.length > 0 && (
                    <div className="mb-3">
                      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Places
                      </p>
                      {hits.places.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="block w-full rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm hover:bg-[var(--glass)]"
                          onClick={() => {
                            router.push(`/admin/places/${p.id}`);
                            setSearchOpen(false);
                          }}
                        >
                          {p.name}
                          <span className="ml-2 text-xs text-muted">{p.city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {hits.bookings.length > 0 && (
                    <div className="mb-3">
                      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Enquiries
                      </p>
                      {hits.bookings.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className="block w-full rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm hover:bg-[var(--glass)]"
                          onClick={() => {
                            router.push(`/admin/enquiries/${b.id}`);
                            setSearchOpen(false);
                          }}
                        >
                          {b.customer_name}
                          <span className="ml-2 text-xs text-muted">
                            {b.customer_number}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {hits.stories.length > 0 && (
                    <div>
                      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Stories
                      </p>
                      {hits.stories.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="block w-full rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm hover:bg-[var(--glass)]"
                          onClick={() => {
                            router.push("/admin/stories");
                            setSearchOpen(false);
                          }}
                        >
                          {s.author_name}
                          <span className="ml-2 line-clamp-1 text-xs text-muted">
                            {s.body}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
    </AdminRealtimeProvider>
  );
}
