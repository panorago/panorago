import { CommandCenterShell } from "@/components/admin/command-center-shell";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <CommandCenterShell>{children}</CommandCenterShell>;
}
