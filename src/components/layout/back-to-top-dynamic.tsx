"use client";

import dynamic from "next/dynamic";

const BackToTopLazy = dynamic(
  () =>
    import("@/components/layout/back-to-top").then((m) => ({
      default: m.BackToTop,
    })),
  { ssr: false },
);

/** Defers scroll listener + framer chunk until after hydration. */
export function BackToTopDynamic() {
  return <BackToTopLazy />;
}
