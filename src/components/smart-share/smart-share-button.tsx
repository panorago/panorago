"use client";

import {
  SmartShareSheet,
  type SmartSharePlace,
} from "@/components/smart-share/smart-share-sheet";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Share2 } from "lucide-react";
import { useState } from "react";

type SmartShareButtonProps = {
  place: SmartSharePlace;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  iconOnly?: boolean;
};

export function SmartShareButton({
  place,
  label = "Share",
  variant = "outline",
  size = "sm",
  className,
  iconOnly = false,
}: SmartShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={iconOnly ? "icon" : size}
        className={cn("rounded-full", className)}
        onClick={() => setOpen(true)}
        aria-label={`Share ${place.name} with Panora SmartShare`}
      >
        <Share2 className="h-4 w-4" />
        {iconOnly ? null : label}
      </Button>
      <SmartShareSheet place={place} open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Hook-friendly controller for map cards that need an external trigger. */
export function useSmartShareSheet(place: SmartSharePlace | null) {
  const [open, setOpen] = useState(false);
  return {
    open,
    setOpen,
    openShare: () => setOpen(true),
    sheet:
      place != null ? (
        <SmartShareSheet place={place} open={open} onOpenChange={setOpen} />
      ) : null,
  };
}
