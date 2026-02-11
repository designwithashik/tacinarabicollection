export default function CartSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-live="polite" aria-busy="true">
      {/* Placeholder rows keep cart layout stable while localStorage hydrates. */}
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={`cart-skeleton-${index}`}
          className="flex items-center gap-4 rounded-2xl border border-[#f0e4da] p-3"
        >
          <div className="skeleton-shimmer h-20 w-20 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-shimmer h-3 w-2/3 rounded-full" />
            <div className="skeleton-shimmer h-3 w-1/2 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
