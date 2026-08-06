import { SiteShell } from "@/components/layout/site-shell";
import type { ReactNode } from "react";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
