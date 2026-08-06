import { AdminChrome } from "@/components/admin/admin-chrome";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminChrome>{children}</AdminChrome>;
}
