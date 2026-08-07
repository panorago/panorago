import type { Metadata } from "next";
import type { ReactNode } from "react";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Add your place",
  description:
    "List your restaurant, lodge, or experience on Panora Go — Zimbabwe tourism discovery for hosts who want curated visibility.",
  alternates: {
    canonical: absoluteUrl("/add-your-place"),
  },
};

export default function AddYourPlaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
