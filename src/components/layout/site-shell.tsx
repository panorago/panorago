import type { ReactNode } from "react";

import { BackToTopDynamic } from "@/components/layout/back-to-top-dynamic";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
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
    <div
      className={cn(
        "relative flex min-h-dvh min-w-0 flex-col overflow-x-clip",
        className,
      )}
    >
      <SiteHeader />
      <main
        id="main-content"
        className={cn(
          "min-w-0 flex-1 pt-[var(--nav-height)]",
          "pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-0",
          mainClassName,
        )}
      >
        {children}
      </main>
      {hideFooter ? null : <SiteFooter />}
      <BottomNav />
      <BackToTopDynamic />
    </div>
  );
}
