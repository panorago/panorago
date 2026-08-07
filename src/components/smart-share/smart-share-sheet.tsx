"use client";

import { AtmosphereBadges } from "@/components/smart-share/atmosphere-badges";
import {
  downloadSmartShareCard,
  type ShareCardRatio,
} from "@/components/smart-share/download-share-card";
import { ProgressiveImage } from "@/components/media/progressive-image";
import { Button } from "@/components/ui/button";
import { atmospheresForPlace } from "@/lib/panora/atmospheres";
import {
  smartShareFacebookUrl,
  smartShareMessage,
  smartSharePath,
  smartShareTelegramUrl,
  smartShareUrl,
  smartShareWhatsAppUrl,
  smartShareXUrl,
} from "@/lib/panora/smart-share";
import { motionTokens } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";
import type { Place } from "@/types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Copy,
  Download,
  Link2,
  MessageCircle,
  QrCode,
  Send,
  Share2,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

export type SmartSharePlace = Pick<
  Place,
  | "name"
  | "slug"
  | "city"
  | "location"
  | "country"
  | "heroImage"
  | "mood"
  | "category"
  | "amenities"
  | "story"
  | "contact"
>;

type SmartShareSheetProps = {
  place: SmartSharePlace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.851L1.99 2.25h7.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.91h2.4V9.84c0-2.37 1.4-3.69 3.56-3.69 1.03 0 2.12.19 2.12.19v2.34h-1.2c-1.18 0-1.55.74-1.55 1.49v1.78h2.64l-.42 2.91h-2.22V22c4.78-.75 8.44-4.91 8.44-9.93z" />
    </svg>
  );
}

export function SmartShareSheet({
  place,
  open,
  onOpenChange,
}: SmartShareSheetProps) {
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [downloading, setDownloading] = useState<ShareCardRatio | null>(null);

  const shareUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${smartSharePath(place.slug)}`;
    }
    return smartShareUrl(place.slug);
  }, [place.slug]);

  const atmospheres = useMemo(
    () => atmospheresForPlace(place, 4),
    [place],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void QRCode.toDataURL(shareUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 280,
      color: { dark: "#0A192F", light: "#FFFFFF" },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [open, shareUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    const text = smartShareMessage(place);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${place.name} — Panora Go`,
          text,
          url: shareUrl,
        });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await copyLink();
  }

  async function handleDownload(ratio: ShareCardRatio) {
    setDownloading(ratio);
    try {
      await downloadSmartShareCard({
        placeName: place.name,
        locationLine: `${place.location}, ${place.city}`,
        heroImage: place.heroImage,
        shareUrl,
        atmospheres,
        ratio,
      });
    } catch {
      /* CORS or canvas failure — fail quietly */
    } finally {
      setDownloading(null);
    }
  }

  const channels = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: smartShareWhatsAppUrl(place),
      icon: MessageCircle,
      className: "bg-[#25D366]/15 text-[#25D366]",
    },
    {
      id: "facebook",
      label: "Facebook",
      href: smartShareFacebookUrl(place.slug),
      icon: FacebookIcon,
      className: "bg-[#1877F2]/15 text-[#1877F2]",
    },
    {
      id: "x",
      label: "X",
      href: smartShareXUrl(place),
      icon: XIcon,
      className: "bg-white/10 text-white",
    },
    {
      id: "telegram",
      label: "Telegram",
      href: smartShareTelegramUrl(place.slug),
      icon: Send,
      className: "bg-[#26A5E4]/15 text-[#26A5E4]",
    },
  ] as const;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.duration.fast }}
        >
          <button
            type="button"
            aria-label="Close share sheet"
            className="absolute inset-0 bg-[var(--brand-navy)]/70 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="smart-share-title"
            className={cn(
              "relative z-10 w-full max-w-lg overflow-hidden rounded-t-[var(--radius-xl)] border border-[var(--brand-gold)]/30",
              "bg-[var(--brand-navy)] text-white shadow-[var(--shadow-gold)] sm:rounded-[var(--radius-xl)]",
            )}
            initial={
              reduceMotion ? false : { y: 40, opacity: 0, scale: 0.98 }
            }
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { y: 24, opacity: 0 }}
            transition={motionTokens.spring.soft}
          >
            <div className="relative h-36 overflow-hidden">
              <ProgressiveImage
                src={place.heroImage}
                alt=""
                fill
                sizes="512px"
                className="object-cover"
                containerClassName="absolute inset-0"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(10,25,47,0.2) 0%, rgba(10,25,47,0.92) 100%)",
                }}
              />
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/30 p-2 text-white backdrop-blur-md"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Panora SmartShare™
                </p>
                <h2
                  id="smart-share-title"
                  className="mt-1 font-display text-2xl leading-tight"
                >
                  {place.name}
                </h2>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <AtmosphereBadges
                atmospheres={atmospheres}
                onDark
                animated={false}
              />

              <p className="text-sm text-white/70">
                Know someone who would love this place? Share a Panora discovery
                link — never a bare map pin.
              </p>

              <div className="grid grid-cols-4 gap-2">
                {channels.map((channel) => (
                  <a
                    key={channel.id}
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border border-white/10 px-2 py-3 text-center transition hover:border-[var(--brand-gold)]/40",
                      channel.className,
                    )}
                  >
                    <channel.icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium text-white/85">
                      {channel.label}
                    </span>
                  </a>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/25 text-white hover:bg-white/10"
                  onClick={() => void copyLink()}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-[var(--brand-gold)]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/25 text-white hover:bg-white/10"
                  onClick={() => setShowQr((v) => !v)}
                >
                  <QrCode className="h-4 w-4" />
                  QR code
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  className="rounded-full"
                  onClick={() => void nativeShare()}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              <AnimatePresence>
                {showQr && qrDataUrl ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--brand-gold)]/25 bg-white/5 p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt={`QR code for ${place.name} on Panora Go`}
                        className="h-28 w-28 rounded-md bg-white p-1"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Scan to open</p>
                        <p className="mt-1 break-all font-mono text-[11px] text-white/55">
                          {shareUrl}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/25 text-white hover:bg-white/10"
                  disabled={downloading != null}
                  onClick={() => void handleDownload("square")}
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloading === "square" ? "…" : "Download picture"}
                </Button>
              </div>

              <p className="flex items-center gap-1.5 text-[11px] text-white/45">
                <Link2 className="h-3 w-3" />
                Links always open Panora — Maps stays at the end of the journey.
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
