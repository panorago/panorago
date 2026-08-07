import { ExplorerProfileClient } from "@/components/auth/explorer-profile-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorer Profile",
  description:
    "Your Panora Go explorer profile — wishlist, preferences, and journey.",
  alternates: { canonical: "/explorer" },
  robots: { index: false, follow: true },
};

export default function ExplorerPage() {
  return <ExplorerProfileClient />;
}
