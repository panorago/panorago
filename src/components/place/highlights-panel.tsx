import { cn } from "@/lib/utils";
import type { PlaceAmenityFlags, PlaceHighlights } from "@/types";
import {
  Accessibility,
  Baby,
  BatteryCharging,
  Camera,
  Car,
  Clock,
  Flame,
  Music,
  PawPrint,
  Shield,
  Signal,
  Sparkles,
  Sun,
  Trees,
  Waves,
  Wifi,
  Shirt,
  Volume2,
  Wallet,
  type LucideIcon,
} from "lucide-react";

interface HighlightsPanelProps {
  highlights: PlaceHighlights;
  amenities: PlaceAmenityFlags;
  className?: string;
}

const highlightItems: {
  key: keyof PlaceHighlights;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "goldenHour", label: "Golden hour", icon: Sun },
  { key: "bestTime", label: "Best time", icon: Clock },
  { key: "dressVibe", label: "Dress vibe", icon: Shirt },
  { key: "noiseLevel", label: "Noise level", icon: Volume2 },
  { key: "averageSpend", label: "Average spend", icon: Wallet },
  { key: "openingHours", label: "Opening hours", icon: Clock },
];

const amenityDefs: {
  key: keyof PlaceAmenityFlags;
  label: string;
  icon: LucideIcon;
  truthy?: boolean;
}[] = [
  { key: "power", label: "Grid power", icon: BatteryCharging },
  { key: "solar", label: "Solar backup", icon: Sun },
  { key: "borehole", label: "Borehole water", icon: Waves },
  { key: "wifi", label: "Wi‑Fi", icon: Wifi },
  { key: "starlink", label: "Starlink", icon: Signal },
  { key: "parking", label: "Parking", icon: Car },
  { key: "security", label: "Security", icon: Shield },
  { key: "swimming", label: "Swimming", icon: Waves },
  { key: "fireplace", label: "Fireplace", icon: Flame },
  { key: "outdoorSeating", label: "Outdoor seating", icon: Trees },
  { key: "music", label: "Music", icon: Music },
  { key: "photography", label: "Photo-friendly", icon: Camera },
  { key: "petFriendly", label: "Pet friendly", icon: PawPrint },
  { key: "kidFriendly", label: "Kid friendly", icon: Baby },
  { key: "wheelchairAccess", label: "Wheelchair access", icon: Accessibility },
];

export function HighlightsPanel({
  highlights,
  amenities,
  className,
}: HighlightsPanelProps) {
  const activeHighlights = highlightItems.filter((item) => {
    const value = highlights[item.key];
    return typeof value === "string" && value.length > 0;
  });

  const activeAmenities = amenityDefs.filter((item) => amenities[item.key] === true);

  const phoneSignal = amenities.phoneSignal;
  const roadCondition = amenities.roadCondition;
  const perfectFor = highlights.perfectFor ?? [];
  const paymentMethods = highlights.paymentMethods ?? [];

  return (
    <div className={cn("space-y-8", className)}>
      {activeHighlights.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeHighlights.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--glass)] p-4"
            >
              <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                  {label}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--foreground)]">
                {highlights[key] as string}
              </p>
            </div>
          ))}
        </div>
      )}

      {perfectFor.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2 text-[var(--accent)]">
            <Sparkles className="h-4 w-4" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em]">
              Perfect for
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {perfectFor.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--border-strong)] bg-[var(--background-elevated)] px-3.5 py-1.5 text-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {paymentMethods.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Payment
          </h3>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="rounded-full bg-[var(--secondary)] px-3.5 py-1.5 text-sm text-[var(--secondary-foreground)]"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      )}

      {(activeAmenities.length > 0 || phoneSignal || roadCondition) && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Amenities & conditions
          </h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {activeAmenities.map(({ key, label, icon: Icon }) => (
              <li
                key={key}
                className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2.5 text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                {label}
              </li>
            ))}
            {phoneSignal && (
              <li className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2.5 text-sm">
                <Signal className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                Signal: {phoneSignal}
              </li>
            )}
            {roadCondition && (
              <li className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2.5 text-sm">
                <Car className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                Road: {roadCondition}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
