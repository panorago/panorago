import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
};

const radiusMap = {
  sm: "rounded-[var(--radius-sm)]",
  md: "rounded-[var(--radius-md)]",
  lg: "rounded-[var(--radius-lg)]",
  xl: "rounded-[var(--radius-xl)]",
  full: "rounded-full",
} as const;

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse bg-[color-mix(in_srgb,var(--secondary)_85%,var(--accent)_8%)]",
        radiusMap[rounded],
        className,
      )}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "surface-card overflow-hidden rounded-[var(--radius-lg)] p-3",
        className,
      )}
    >
      <Skeleton className="aspect-[4/3] w-full" rounded="lg" />
      <div className="mt-4 space-y-3 px-1 pb-2">
        <Skeleton className="h-3 w-1/3" rounded="full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-20" rounded="full" />
          <Skeleton className="h-6 w-16" rounded="full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonImage({
  className,
  aspect = "aspect-[4/3]",
}: {
  className?: string;
  aspect?: string;
}) {
  return <Skeleton className={cn(aspect, "w-full", className)} rounded="lg" />;
}
