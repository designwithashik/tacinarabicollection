"use client";

import Image from "next/image";
import clsx from "clsx";
import type { Product } from "../lib/products";

const sizes = ["M", "L", "XL"] as const;

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
};

export default function ProductCard({
  product,
  selectedSize,
  quantity,
  onSizeChange,
  onQuantityChange,
  onBuyNow,
  onAddToCart,
  onOpenDetails,
  showBadge,
}: Props) {
  const sizeMissing = !selectedSize;

  return (
    <div className="rounded-3xl bg-card p-4 shadow-soft">
      <button
        type="button"
        className="group relative w-full overflow-hidden rounded-2xl bg-base"
        onClick={onOpenDetails}
      >
        <Image
          src={product.image}
          alt={product.name}
          width={480}
          height={360}
          className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        {showBadge ? (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
            {showBadge}
          </span>
        ) : null}
      </button>
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-ink">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-muted">{product.category}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-muted">Price</p>
          <p className="text-lg font-semibold text-ink">৳{product.price}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-ink">Select Size</p>
        <div className="mt-2 flex gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              className={clsx(
                "rounded-full border px-4 py-1 text-sm font-medium transition",
                selectedSize === size
                  ? "border-accent bg-accent text-white"
                  : "border-[#e5d7cc] bg-white text-ink"
              )}
              onClick={() => onSizeChange(size)}
            >
              {size}
            </button>
          ))}
        </div>
        {sizeMissing ? (
          <p className="mt-2 text-xs text-accent">Select a size to continue.</p>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink">Qty</p>
          <div className="mt-2 flex items-center gap-2 rounded-full border border-[#e5d7cc] bg-white px-3 py-1">
            <button
              type="button"
              className="text-base font-semibold text-ink"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            >
              -
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              className="text-base font-semibold text-ink"
              onClick={() => onQuantityChange(quantity + 1)}
            >
              +
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className={clsx(
              "rounded-full px-5 py-2 text-sm font-semibold transition",
              sizeMissing
                ? "cursor-not-allowed bg-[#e6d8ce] text-muted"
                : "bg-accent text-white"
            )}
            onClick={onBuyNow}
            disabled={sizeMissing}
          >
            Buy Now
          </button>
          <button
            type="button"
            className={clsx(
              "rounded-full border px-5 py-2 text-sm font-semibold transition",
              sizeMissing
                ? "cursor-not-allowed border-[#e6d8ce] text-muted"
                : "border-accent text-accent"
            )}
            onClick={onAddToCart}
            disabled={sizeMissing}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
