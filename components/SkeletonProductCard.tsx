export default function SkeletonProductCard() {
  return (
    <div className="rounded-3xl border border-[#f1e6dd] bg-card p-4 shadow-soft">
      <div className="skeleton-shimmer aspect-[4/3] w-full rounded-2xl" />
      <div className="mt-4 space-y-2">
        <div className="skeleton-shimmer h-4 w-2/3 rounded-full" />
        <div className="skeleton-shimmer h-3 w-1/3 rounded-full" />
        <div className="skeleton-shimmer h-8 w-full rounded-full" />
      </div>
    </div>
  );
}
