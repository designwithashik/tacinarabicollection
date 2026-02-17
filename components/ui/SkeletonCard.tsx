export default function SkeletonCard() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="skeleton-shimmer aspect-[3/4] w-full rounded-lg" />
      <div className="mt-3 space-y-2">
        <div className="skeleton-shimmer h-4 w-2/3 rounded-full" />
        <div className="skeleton-shimmer h-3 w-1/3 rounded-full" />
        <div className="skeleton-shimmer h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
