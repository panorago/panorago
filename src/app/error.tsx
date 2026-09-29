"use client";

import { PanoraLogo } from "@/components/brand/panora-logo";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="gradient-mesh flex min-h-[70dvh] flex-col items-center justify-center px-6 py-20 text-center">
      <PanoraLogo variant="icon" href={null} tone="auto" priority />
      <h1 className="mt-8 font-display text-4xl md:text-5xl">
        Something interrupted the journey.
      </h1>
      <p className="long-form mt-4 max-w-md text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
        Panora hit an unexpected error. You can try again, or head back to
        discovering places.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="rounded-full"
          onClick={() => reset()}
        >
          Try again
        </Button>
        <Button href="/" variant="outline" size="lg" className="rounded-full">
          Go home
        </Button>
      </div>
    </div>
  );
}
