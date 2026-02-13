"use client";
// Client component required for interactive product card buttons.

import Image from "next/image";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "../lib/products";
import QuickView from "./QuickView";

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
  const [imageFailed, setImageFailed] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    setImageFailed(false);
  }, [product.id, product.image]);

  const imageSrc = useMemo(() => {
    if (!product.image || !product.image.trim()) return null;
    return product.image;
  }, [product.image]);

  const sizeMissing = !selectedSize;
  const addLabel =
    addState === "loading"
      ? addingLabel
      : addState === "success"
        ? addedLabel
        : addToCartLabel;

  const canQuickAdd = !sizeMissing && addState !== "loading";
  const stockCount = (product as Product & { stock?: number }).stock;
  const originalPrice = (product as Product & { originalPrice?: number; compareAtPrice?: number }).originalPrice
    ?? (product as Product & { compareAtPrice?: number }).compareAtPrice;

  return (
    <div className="group relative flex min-h-[620px] h-full flex-col overflow-hidden rounded-2xl border border-[var(--brand-secondary)]/10 bg-[var(--brand-surface)] transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
      <div className="relative overflow-hidden">
        <div
        role="button"
        tabIndex={0}
        className="interactive-feedback relative w-full overflow-hidden bg-base"
        onClick={onOpenDetails}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenDetails();
          }
        }}
        >
          {imageSrc && !imageFailed ? (
            <Image
              src={imageSrc}
              alt={product.name}
              width={520}
              height={650}
              className="aspect-[4/5] w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-[#f6efe3] via-[#f2e6d3] to-[#e8dcc6]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.65),transparent_45%),radial-gradient(circle_at_70%_75%,rgba(200,169,107,0.3),transparent_42%)]" />
              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/40 bg-white/45 p-3 text-left backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/70">Tacin Arabi</p>
                <p className="mt-1 font-heading text-sm font-semibold text-charcoal/85">Luxury Placeholder</p>
              </div>
            </div>
          )}

        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-2xl border border-white/30 bg-white/35 p-3 text-left backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/80">{product.category}</p>
          <p className="mt-1 font-heading text-base font-semibold text-charcoal transition-transform duration-[240ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-[-1px]">
            {product.name}
          </p>
          <p className="mt-1 text-xs font-semibold text-charcoal/85 transition-transform duration-[240ms] delay-75 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-[-1px]">
            {stockLabel}
          </p>
        </div>

        {showBadge ? (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
            {showBadge}
          </span>
        ) : null}
        <span className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink">
          {statusLabel}
        </span>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setQuickViewProduct(product);
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition duration-300 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm"
        >
          Quick View
        </button>
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-all duration-500 group-hover:bg-black/5" />
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-medium leading-snug tracking-wide text-[var(--brand-primary)] transition group-hover:opacity-90">
              {product.name}
            </h3>
            <p className="mt-1 text-sm text-support">{product.category}</p>
            <p className="mt-1 text-xs font-semibold text-accent">{stockLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-support">{priceLabel}</p>
            {typeof stockCount === "number" && stockCount <= 5 ? (
              <span className="mt-1 inline-flex rounded-full bg-[var(--brand-secondary)]/15 px-3 py-1 text-xs tracking-wide text-[var(--brand-secondary)]">
                Limited
              </span>
            ) : null}
            {typeof originalPrice === "number" && originalPrice > product.price ? (
              <p className="text-sm line-through text-[var(--brand-muted)]">৳ {originalPrice.toLocaleString()}</p>
            ) : null}
            <p className="mt-2 text-base font-semibold tracking-wide text-[var(--brand-primary)]">৳ {product.price.toLocaleString()}</p>
          </div>
        </div>

      <div>
        <p className="text-sm font-medium text-ink">Select Size</p>
        <div className="mt-2 flex gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              className={clsx(
                "interactive-feedback min-h-[44px] rounded-full border px-4 py-1 text-sm font-medium transition",
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

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink">Qty</p>
          <div className="mt-2 flex items-center gap-2 rounded-full border border-[#e5d7cc] bg-white px-3 py-1">
            <button
              type="button"
              className="interactive-feedback min-h-[28px] min-w-[28px] text-base font-semibold text-ink"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            >
              -
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-semibold">{quantity}</span>
            <button
              type="button"
              className="interactive-feedback min-h-[28px] min-w-[28px] text-base font-semibold text-ink"
              onClick={() => onQuantityChange(quantity + 1)}
            >
              +
            </button>
          </div>
          {quantityFeedback ? (
            <p className="mt-2 text-xs font-semibold text-accent">{quantityFeedback}</p>
          ) : null}
        </div>
        <div className="mt-2 flex flex-col gap-2 pt-2">
          <button
            type="button"
            className={clsx(
              "interactive-feedback btn-secondary min-h-[44px] w-full text-[10px] font-semibold uppercase tracking-[0.2em]",
              sizeMissing && "cursor-not-allowed border-[#d9cdc0] text-muted"
            )}
            onClick={onBuyNow}
            disabled={sizeMissing}
          >
            {buyNowLabel}
          </button>
          <button
            type="button"
            className={clsx(
              "interactive-feedback btn-primary w-full min-h-[44px]",
              sizeMissing || addState === "loading"
                ? "cursor-not-allowed border-[#d9cdc0] bg-[#e9dfd4] text-muted"
                : "",
              addState === "success" && "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-[#1f1f1f]"
            )}
            onClick={onAddToCart}
            disabled={sizeMissing || addState === "loading"}
          >
            {addLabel}
          </button>
        </div>
      </div>
      </div>
      <button
        type="button"
        aria-label="Quick add to cart"
        onClick={onAddToCart}
        disabled={!canQuickAdd}
        className={clsx(
          "interactive-feedback absolute bottom-6 right-6 z-20 hidden h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/95 text-lg text-charcoal shadow-soft transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] md:flex",
          canQuickAdd
            ? "opacity-0 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100"
            : "cursor-not-allowed opacity-60"
        )}
      >
        +
      </button>

      {quickViewProduct ? (
        <QuickView
          product={quickViewProduct}
          selectedSize={selectedSize}
          onSizeChange={onSizeChange}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={(size) => {
            onSizeChange(size);
            onAddToCart();
          }}
          addToCartLabel={addToCartLabel}
        />
      ) : null}
    </div>
  );
}
