import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function SiteLoading() {
  return (
    <div className="gradient-mesh" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="container-panora space-y-8 py-[var(--space-section)]">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" rounded="full" />
          <Skeleton className="h-10 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
