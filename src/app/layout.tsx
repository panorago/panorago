import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import Script from "next/script";
import { AppProviders } from "@/components/providers/app-providers";
import { absoluteUrl } from "@/lib/utils";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: "Panora Go — Unforgettable Places in Zimbabwe",
    template: "%s | Panora Go",
  },
  description:
    "Discover Zimbabwe's most unforgettable places — curated weekends, hidden escapes, and insider notes from Panora Go.",
  applicationName: "Panora Go",
  keywords: [
    "Panora Go",
    "Zimbabwe",
    "Harare",
    "Victoria Falls",
    "weekend escapes",
    "restaurants",
    "lodges",
  ],
  authors: [{ name: "Panora Go" }],
  openGraph: {
    type: "website",
    locale: "en_ZW",
    url: absoluteUrl("/"),
    siteName: "Panora Go",
    title: "Panora Go — Unforgettable Places in Zimbabwe",
    description:
      "Discover Zimbabwe's most unforgettable places — curated weekends, hidden escapes, and insider notes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Panora Go — Unforgettable Places in Zimbabwe",
    description:
      "Discover Zimbabwe's most unforgettable places — curated weekends, hidden escapes, and insider notes.",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logos/pgo-dark-icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
    shortcut: ["/icon.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a192f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--brand-navy)]"
        >
          Skip to content
        </a>
        <AppProviders>{children}</AppProviders>
        {plausibleDomain ? (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
