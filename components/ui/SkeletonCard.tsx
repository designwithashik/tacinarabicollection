export default function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-[#f1e6dd] bg-card p-4 shadow-soft">
      <div className="relative overflow-hidden rounded-2xl bg-base">
        <div className="skeleton-shimmer aspect-[4/5] w-full" />
        <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/30 bg-white/35 p-3 backdrop-blur-sm">
          <div className="skeleton-shimmer h-3 w-1/2 rounded-full" />
          <div className="skeleton-shimmer mt-2 h-2.5 w-1/3 rounded-full" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="skeleton-shimmer h-4 w-2/3 rounded-full" />
        <div className="skeleton-shimmer h-3 w-1/3 rounded-full" />
      </div>

      <div className="mt-4 flex gap-2">
        <div className="skeleton-shimmer h-10 flex-1 rounded-full" />
        <div className="skeleton-shimmer h-10 flex-1 rounded-full" />
      </div>
    </div>
  );
}
