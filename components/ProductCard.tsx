"use client";

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
  sizeErrorLabel: string;
  isRouting?: boolean;
};

export default function ProductCard({
  product,
  selectedSize,
  onSizeChange,
  onBuyNow,
  onAddToCart,
  onOpenDetails,
  showBadge,
  buyNowLabel,
  addToCartLabel,
  addingLabel,
  addedLabel,
  addState,
  sizeErrorLabel,
  isRouting = false,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showSizeError, setShowSizeError] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    setShowSizeError(false);
  }, [product.id, product.image]);

  const imageSrc = useMemo(() => {
    if (!product.image || !product.image.trim()) return null;
    return product.image;
  }, [product.image]);

  const addLabel =
    addState === "loading"
      ? addingLabel
      : addState === "success"
        ? addedLabel
        : addToCartLabel;

  const handleSizeChange = (size: string) => {
    setShowSizeError(false);
    onSizeChange(size);
  };

  const handleAddClick = () => {
    if (!product.id) return;
    if (!selectedSize) {
      setShowSizeError(true);
      return;
    }
    setShowSizeError(false);
    onAddToCart();
  };

  const handleBuyClick = () => {
    if (!product.id) return;
    if (!selectedSize) {
      setShowSizeError(true);
      return;
    }
    setShowSizeError(false);
    onBuyNow();
  };

  const stockCount = (product as Product & { stock?: number }).stock;
  const originalPrice =
    (product as Product & { originalPrice?: number; compareAtPrice?: number }).originalPrice ??
    (product as Product & { compareAtPrice?: number }).compareAtPrice;

  return (
    <div className="group flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--brand-secondary)]/10 bg-[var(--brand-surface)] transition-all duration-200 ease-out md:hover:-translate-y-1 md:hover:shadow-md">
      <div
        role="button"
        tabIndex={0}
        className="relative aspect-[3/4] overflow-hidden"
        onClick={onOpenDetails}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenDetails();
          }
        }}
      >
        <div className="relative w-full aspect-[3/4] overflow-hidden">
          {imageSrc && !imageFailed ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageFailed(true)}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#f6efe3] via-[#f2e6d3] to-[#e8dcc6]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.65),transparent_45%),radial-gradient(circle_at_70%_75%,rgba(200,169,107,0.3),transparent_42%)]" />
              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/40 bg-white/45 p-3 text-left backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/70">Tacin Arabi</p>
                <p className="mt-1 font-heading text-sm font-semibold text-charcoal/85">Luxury Placeholder</p>
              </div>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-2xl border border-white/30 bg-white/35 p-3 text-left backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/80">{product.category}</p>
          <p className="mt-0.5 font-heading text-sm sm:text-base font-semibold text-charcoal transition-transform duration-200 group-hover:translate-y-[-1px] break-words line-clamp-2">
            {product.name}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-charcoal/85 transition-transform duration-200 delay-75 group-hover:translate-y-[-1px]">
            {stockLabel}
          </p>
        </div>

        {showBadge ? (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-[var(--brand-accent)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            {showBadge}
          </span>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setQuickViewProduct(product);
          }}
          className="absolute right-2.5 top-2.5 rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-neutral-700 transition-all duration-200 ease-out hover:bg-white"
        >
          View
        </button>
      </div>

      <div className="flex flex-1 flex-col space-y-1.5 p-2.5 sm:p-3">
        <h3 className="text-sm font-medium leading-snug text-[var(--brand-primary)] line-clamp-2 break-words">
          {product.name}
        </h3>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] uppercase tracking-[0.15em] text-support">{priceLabel}</p>
            <p className="text-[14px] font-semibold text-neutral-900">৳ {product.price.toLocaleString()}</p>
            {typeof originalPrice === "number" && originalPrice > product.price ? (
              <p className="text-xs text-[var(--brand-muted)] line-through">৳ {originalPrice.toLocaleString()}</p>
            ) : null}
          </div>
          {typeof stockCount === "number" && stockCount <= 5 ? (
            <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-[var(--brand-secondary)]/15 whitespace-nowrap text-[var(--brand-secondary)]">
              Limited
            </span>
          ) : null}
        </div>

        <p className="text-[12px] sm:text-[13px] text-support break-words">{product.category}</p>

        <div>
          <p className="text-[13px] font-medium text-ink">Select Size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={clsx(
                  "interactive-feedback rounded-full border px-3 py-1 text-[12px] sm:text-[13px] font-medium transition-all duration-200 ease-out",
                  selectedSize === size
                    ? "border-accent bg-accent text-white"
                    : "border-[#e5d7cc] bg-white text-ink"
                )}
                onClick={() => handleSizeChange(size)}
              >
                {size}
              </button>
            ))}
          </div>
          {showSizeError ? (
            <p className="text-red-600 text-[12px] mt-1 transition-opacity duration-200">{sizeErrorLabel}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-[13px] font-medium text-ink">Qty</p>
            <div className="mt-2 flex items-center gap-2 rounded-full border border-[#e5d7cc] bg-white px-3 py-1">
              <button
                type="button"
                className="interactive-feedback px-1 text-base font-semibold text-ink"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <span className="text-center text-[13px] font-semibold">{quantity}</span>
              <button
                type="button"
                className="interactive-feedback px-1 text-base font-semibold text-ink"
                onClick={() => onQuantityChange(quantity + 1)}
              >
                +
              </button>
            </div>
            {quantityFeedback ? (
              <p className="mt-2 text-xs font-semibold text-accent">{quantityFeedback}</p>
            ) : null}
          </div>
          <button
            type="button"
            className={clsx(
              "interactive-feedback btn-secondary w-full sm:w-auto rounded-lg px-3 py-2 text-[13px] font-semibold uppercase tracking-[0.15em]",
              isRouting && "cursor-not-allowed border-[#d9cdc0] text-muted"
            )}
            onClick={handleBuyClick}
            disabled={isRouting}
          >
            {isRouting ? "Redirecting..." : buyNowLabel}
          </button>

          <button
            type="button"
            className={clsx(
              "interactive-feedback btn-primary w-full rounded-lg py-2 text-[13px]",
              addState === "loading" || isRouting
                ? "cursor-not-allowed border-[#d9cdc0] bg-[#e9dfd4] text-muted"
                : "",
              addState === "success" && "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-[#1f1f1f]"
            )}
            onClick={handleAddClick}
            disabled={addState === "loading" || isRouting}
          >
            {isRouting ? "Redirecting..." : (buyNowLabel === "Buy Now" ? "Buy" : buyNowLabel)}
          </button>
        </div>
      </div>

      {quickViewProduct ? (
        <QuickView
          product={quickViewProduct}
          selectedSize={selectedSize}
          onSizeChange={onSizeChange}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={(size) => {
            handleSizeChange(size);
            onAddToCart();
          }}
          addToCartLabel={addToCartLabel}
        />
      ) : null}
    </div>
  );
}
