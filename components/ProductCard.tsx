"use client";

import type { Product } from "../lib/products";

type AddState = "idle" | "loading" | "success";

type Props = {
  product: Product;
  selectedSize?: string;
  quantity: number;
  onSizeChange: (size: string) => void;
  onQuantityChange: (quantity: number) => void;
  onBuyNow: () => void;
  onAddToCart: () => void;
  onOpenDetails: () => void;
  showBadge?: string;
  priceLabel: string;
  buyNowLabel: string;
  addToCartLabel: string;
  addingLabel: string;
  addedLabel: string;
  addState: AddState;
  quantityFeedback?: string | null;
  statusLabel: string;
  stockLabel: string;
};

export default function ProductCard({
  product,
  onBuyNow,
}: Props) {
  const imageUrl =
    product.image || "https://placehold.co/600x800?text=No+Image";

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-white">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-100">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-opacity duration-300"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src =
              "https://placehold.co/600x800?text=Image+Error";
          }}
        />
      </div>

      <div className="flex flex-col gap-1 py-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-tight text-zinc-900">
            {product.name}
          </h3>
          <span className="text-sm font-bold text-zinc-900">৳{product.price}</span>
        </div>

        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
          {product.category}
        </p>

        <button
          type="button"
          onClick={onBuyNow}
          className="mt-3 w-full rounded-lg bg-zinc-900 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-zinc-700"
        >
          Buy via WhatsApp
        </button>
      </div>
    </div>
  );
}
