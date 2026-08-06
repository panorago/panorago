import Link from "next/link";

import { PanoraLogo } from "@/components/brand/panora-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="gradient-mesh flex min-h-[70dvh] flex-col items-center justify-center px-6 py-20 text-center">
      <PanoraLogo variant="icon" href={null} />
      <h1 className="mt-8 font-display text-4xl md:text-5xl">
        This place isn&apos;t on the map yet.
      </h1>
      <p className="mt-4 max-w-md text-[var(--foreground-muted)]">
        The page you are looking for may have moved, or the weekend has not
        been curated. Let&apos;s get you back to discovering.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button variant="accent" size="lg" className="rounded-full">
            Go home
          </Button>
        </Link>
        <Link href="/discover">
          <Button variant="outline" size="lg" className="rounded-full">
            Discover places
          </Button>
        </Link>
        <Link href="/enquiry">
          <Button variant="ghost" size="lg" className="rounded-full">
            Enquire with Panora
          </Button>
        </Link>
      </div>
    </div>
  );
}
