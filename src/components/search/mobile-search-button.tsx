"use client";

import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { MobileSearchOverlay } from "@/components/search/mobile-search-overlay";
import { cn } from "@/lib/utils";

type MobileSearchButtonProps = {
  onDark?: boolean;
};

export function MobileSearchButton({ onDark = false }: MobileSearchButtonProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className={cn(
          "focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border md:hidden",
          onDark
            ? "border-white/25 bg-white/12 text-[var(--brand-gold)]"
            : "border-[var(--border)] bg-[var(--glass)] text-[var(--accent)]",
        )}
        aria-label="Search"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" strokeWidth={2} />
      </button>
      <MobileSearchOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
