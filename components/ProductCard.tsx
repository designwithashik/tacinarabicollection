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
    <div className="group flex min-h-[560px] h-full flex-col rounded-3xl border border-[#efe1d8] bg-white p-4 shadow-[0_18px_32px_rgba(18,18,18,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(18,18,18,0.12)]">
      <button
        type="button"
        className="relative w-full overflow-hidden rounded-2xl border border-[#f0e4da] bg-[#f6efe8]"
        onClick={onOpenDetails}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.6),rgba(255,255,255,0))]" />
        <Image
          src={product.image}
          alt={product.name}
          width={480}
          height={360}
          className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.06]"
        />
        {showBadge ? (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
            {showBadge}
          </span>
        ) : null}
        <span className="absolute left-3 bottom-3 rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          {statusLabel}
        </span>
        <span className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink">
          {stockLabel}
        </span>
      </button>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-ink">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-muted">{product.category}</p>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#f6efe8] px-3 py-1 text-[11px] font-semibold text-ink">
            🚚 Delivery in 2-4 days
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-muted">{priceLabel}</p>
          <p className="text-lg font-semibold text-ink">৳{product.price}</p>
          <p className="text-xs text-muted">Includes VAT</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#f0e4da] bg-[#fff7f0] p-3">
        <p className="text-sm font-semibold text-ink">Select Size</p>
        <div className="mt-2 flex gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              className={clsx(
                "min-h-[42px] rounded-xl border px-4 py-1 text-sm font-semibold transition",
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
          <p className="text-sm font-semibold text-ink">Qty</p>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#e5d7cc] bg-white px-3 py-1">
            <button
              type="button"
              className="min-h-[28px] min-w-[28px] text-base font-semibold text-ink"
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
              "min-h-[44px] rounded-xl px-5 py-2 text-sm font-semibold shadow-soft transition",
              sizeMissing
                ? "cursor-not-allowed bg-[#e6d8ce] text-muted"
                : "bg-ink text-white hover:brightness-110"
            )}
            onClick={onBuyNow}
            disabled={sizeMissing}
          >
            {buyNowLabel}
          </button>
          <button
            type="button"
            className={clsx(
              "min-h-[44px] rounded-xl border px-5 py-2 text-sm font-semibold transition",
              sizeMissing || addState === "loading"
                ? "cursor-not-allowed border-[#e6d8ce] text-muted"
                : "border-ink text-ink hover:bg-ink hover:text-white"
            )}
            onClick={onAddToCart}
            disabled={sizeMissing || addState === "loading"}
          >
            {addLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
