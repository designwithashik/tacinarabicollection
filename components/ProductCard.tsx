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

  const stockCount = (product as Product & { stock?: number }).stock;
  const originalPrice =
    (product as Product & { originalPrice?: number; compareAtPrice?: number }).originalPrice ??
    (product as Product & { compareAtPrice?: number }).compareAtPrice;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-[var(--brand-secondary)]/10 bg-[var(--brand-surface)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
      <div className="relative overflow-hidden rounded-t-3xl">
        <div
          role="button"
          tabIndex={0}
          className="interactive-feedback relative w-full overflow-hidden"
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
              className="h-[360px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="relative h-[360px] w-full overflow-hidden bg-gradient-to-b from-[#f6efe3] via-[#f2e6d3] to-[#e8dcc6]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.65),transparent_45%),radial-gradient(circle_at_70%_75%,rgba(200,169,107,0.3),transparent_42%)]" />
              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/40 bg-white/45 p-3 text-left backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/70">Tacin Arabi</p>
                <p className="mt-1 font-heading text-sm font-semibold text-charcoal/85">Luxury Placeholder</p>
              </div>
            </div>
          )}

          {showBadge ? (
            <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
              {showBadge}
            </span>
          ) : null}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-xs opacity-0 backdrop-blur-sm transition duration-300 group-hover:opacity-100"
          >
            Quick View
          </button>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
      </div>

      <div className="space-y-4 p-6">
        <h3 className="text-lg font-medium leading-snug tracking-wide text-[var(--brand-primary)]">{product.name}</h3>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-support">{priceLabel}</p>
            {typeof originalPrice === "number" && originalPrice > product.price ? (
              <p className="text-sm text-[var(--brand-muted)] line-through">৳ {originalPrice.toLocaleString()}</p>
            ) : null}
            <p className="text-xl font-semibold text-[var(--brand-primary)]">৳ {product.price.toLocaleString()}</p>
          </div>

          {typeof stockCount === "number" && stockCount <= 5 ? (
            <span className="rounded-full bg-[var(--brand-secondary)]/15 px-3 py-1 text-xs uppercase tracking-wider text-[var(--brand-secondary)]">
              Limited
            </span>
          ) : null}
        </div>

        <button
          type="button"
          className={clsx(
            "interactive-feedback btn-primary mt-2 w-full",
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
