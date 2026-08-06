import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { BackToTop } from "@/components/layout/back-to-top";
import { cn } from "@/lib/utils";

type SiteShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
  hideFooter?: boolean;
};

export function SiteShell({
  children,
  className,
  mainClassName,
  hideFooter = false,
}: SiteShellProps) {
  return (
    <div className={cn("relative flex min-h-dvh flex-col", className)}>
      <SiteHeader />
      <main
        className={cn(
          "flex-1 pt-[var(--nav-height)]",
          "pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-0",
          mainClassName,
        )}
      >
        {children}
      </main>
      {hideFooter ? null : <SiteFooter />}
      <BottomNav />
      <BackToTop />
    </div>
  );
}
