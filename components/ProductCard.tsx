"use client";

import Image from "next/image";
import clsx from "clsx";
import type { Product } from "../lib/products";

const sizes = ["M", "L", "XL"] as const;

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
  selectedSize,
  quantity,
  onSizeChange,
  onQuantityChange,
  onBuyNow,
  onAddToCart,
  onOpenDetails,
  showBadge,
  priceLabel,
  buyNowLabel,
  addToCartLabel,
  addingLabel,
  addedLabel,
  addState,
  quantityFeedback,
  statusLabel,
  stockLabel,
}: Props) {
  const sizeMissing = !selectedSize;
  const addLabel =
    addState === "loading"
      ? addingLabel
      : addState === "success"
      ? addedLabel
      : addToCartLabel;

  return (
    <div className="flex min-h-[560px] h-full flex-col rounded-3xl border border-[#efe1d8] bg-card p-4 shadow-soft">
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
          className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        {showBadge ? (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
            {showBadge}
          </span>
        ) : null}
        <span className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink">
          {statusLabel}
        </span>
      </button>
      <div className="mt-4 flex items-start justify-between gap-3">
      </button>
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-ink">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-muted">{product.category}</p>
          <p className="mt-1 text-xs font-semibold text-accent">{stockLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-muted">{priceLabel}</p>
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
                "min-h-[44px] rounded-full border px-4 py-1 text-sm font-medium transition",
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
              className="min-h-[28px] min-w-[28px] text-base font-semibold text-ink"
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
              className="min-h-[28px] min-w-[28px] text-base font-semibold text-ink"
              className="text-base font-semibold text-ink"
              onClick={() => onQuantityChange(quantity + 1)}
            >
              +
            </button>
          </div>
          {quantityFeedback ? (
            <p className="mt-2 text-xs font-semibold text-accent">
              {quantityFeedback}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className={clsx(
              "min-h-[44px] rounded-full px-5 py-2 text-sm font-semibold transition",
              "rounded-full px-5 py-2 text-sm font-semibold transition",
              sizeMissing
                ? "cursor-not-allowed bg-[#e6d8ce] text-muted"
                : "bg-accent text-white"
            )}
            onClick={onBuyNow}
            disabled={sizeMissing}
          >
            {buyNowLabel}
            Buy Now
          </button>
          <button
            type="button"
            className={clsx(
              "min-h-[44px] rounded-full border px-5 py-2 text-sm font-semibold transition",
              sizeMissing || addState === "loading"
              "rounded-full border px-5 py-2 text-sm font-semibold transition",
              sizeMissing
                ? "cursor-not-allowed border-[#e6d8ce] text-muted"
                : "border-accent text-accent"
            )}
            onClick={onAddToCart}
            disabled={sizeMissing || addState === "loading"}
          >
            {addLabel}
            disabled={sizeMissing}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
