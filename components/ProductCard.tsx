"use client";
// Client component required for interactive product card buttons.

import Image from "next/image";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "../lib/products";
import QuickView from "./QuickView";

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

type ExtendedProduct = Product & {
  secondaryImage?: string;
  hoverImage?: string;
  images?: string[];
  originalPrice?: number;
  compareAtPrice?: number;
  stock?: number;
};

type BadgeTone = "accent" | "neutral" | "success" | "warning" | "danger";

type BadgeItem = {
  label: string;
  tone: BadgeTone;
};

const badgeToneClasses: Record<BadgeTone, string> = {
  accent: "border-transparent bg-[var(--bar-maroon)] text-white shadow-sm",
  neutral: "border-black/5 bg-white/92 text-neutral-900",
  success: "border-emerald-200/80 bg-emerald-50/95 text-emerald-800",
  warning: "border-amber-200/80 bg-amber-50/95 text-amber-800",
  danger: "border-rose-200/80 bg-rose-50/95 text-rose-700",
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
  sizeErrorLabel,
  isRouting = false,
}: Props) {
  const productData = product as ExtendedProduct;
  const [imageFailed, setImageFailed] = useState(false);
  const [secondaryImageFailed, setSecondaryImageFailed] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showSizeError, setShowSizeError] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    setSecondaryImageFailed(false);
    setShowSizeError(false);
  }, [product.id, product.image]);

  const primaryImageSrc = useMemo(() => {
    if (!product.image || !product.image.trim()) return null;
    return product.image;
  }, [product.image]);

  const secondaryImageSrc = useMemo(() => {
    const candidate =
      productData.secondaryImage ??
      productData.hoverImage ??
      productData.images?.find((image) => image && image !== product.image) ??
      null;

    if (!candidate || !candidate.trim() || candidate === product.image) return null;
    return candidate;
  }, [product.image, productData.hoverImage, productData.images, productData.secondaryImage]);

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

  const stockCount = productData.stock;
  const isOutOfStock = typeof stockCount === "number" && stockCount <= 0;
  const isLowStock = typeof stockCount === "number" && stockCount > 0 && stockCount <= 5;
  const availableSizes =
    Array.isArray(product.sizes) && product.sizes.length > 0
      ? product.sizes
      : ["M", "L", "XL"];
  const originalPrice = productData.originalPrice ?? productData.compareAtPrice;
  const hasDiscount = typeof originalPrice === "number" && originalPrice > product.price;
  const savingsAmount = hasDiscount ? originalPrice - product.price : 0;
  const savingsPercent = hasDiscount ? Math.round((savingsAmount / originalPrice) * 100) : 0;

  const badgeItems = useMemo<BadgeItem[]>(() => {
    const seen = new Set<string>();
    const items: BadgeItem[] = [];

    const pushBadge = (label: string | undefined, tone: BadgeTone) => {
      const trimmed = label?.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ label: trimmed, tone });
    };

    pushBadge(showBadge, "accent");

    if (isOutOfStock) {
      pushBadge("Out of Stock", "danger");
    } else if (isLowStock) {
      pushBadge(`Only ${stockCount} left`, "warning");
    }

    pushBadge(statusLabel, showBadge ? "neutral" : "accent");

    return items.slice(0, 2);
  }, [isLowStock, isOutOfStock, showBadge, statusLabel, stockCount]);

  const handleAddClick = () => {
    if (!product.id || isOutOfStock) return;
    if (!selectedSize) {
      setShowSizeError(true);
      return;
    }
    setShowSizeError(false);
    onAddToCart();
  };

  const handleBuyClick = () => {
    if (!product.id || isOutOfStock) return;
    if (!selectedSize) {
      setShowSizeError(true);
      return;
    }
    setShowSizeError(false);
    onBuyNow();
  };

  return (
    <div className="group flex w-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-[var(--border-soft)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(15,23,42,0.1)]">
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
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f8f5f1]">
          {primaryImageSrc && !imageFailed ? (
            <>
              <Image
                src={primaryImageSrc}
                alt={product.name}
                fill
                className={clsx(
                  "object-cover transition-all duration-700 ease-out",
                  secondaryImageSrc && !secondaryImageFailed
                    ? "scale-100 opacity-100 group-hover:scale-110 group-hover:opacity-0"
                    : "group-hover:scale-110",
                )}
                onError={() => setImageFailed(true)}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {secondaryImageSrc && !secondaryImageFailed ? (
                <Image
                  src={secondaryImageSrc}
                  alt={`${product.name} alternate view`}
                  fill
                  className="object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
                  onError={() => setSecondaryImageFailed(true)}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : null}
            </>
          ) : (
            <div className="relative h-full w-full overflow-hidden bg-[#fafafa]">
              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/40 bg-white/45 p-3 text-left backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/70">Tacin Arabi</p>
                <p className="mt-1 font-heading text-sm font-semibold text-charcoal/85">Luxury Placeholder</p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex max-w-[75%] flex-wrap gap-2">
            {badgeItems.map((badge) => (
              <span
                key={badge.label}
                className={clsx(
                  "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur-sm",
                  badgeToneClasses[badge.tone],
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>

          <button
            type="button"
            aria-label={`Quick view ${product.name}`}
            onClick={(event) => {
              event.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-white/92 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-900 shadow-sm backdrop-blur-sm transition duration-300 hover:bg-white sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-[10px] sm:opacity-70 sm:hover:opacity-100 sm:group-hover:opacity-100"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white">
              +
            </span>
            <span>Quick View</span>
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-[20px] border border-white/30 bg-white/38 p-3 text-left backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.24em] text-charcoal/70">{product.category}</p>
              <p className="mt-1 break-words font-heading text-sm font-semibold text-charcoal transition-transform duration-200 group-hover:-translate-y-0.5 line-clamp-2 sm:text-base">
                {product.name}
              </p>
            </div>
            <span
              className={clsx(
                "mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-1 text-[10px] font-semibold",
                isOutOfStock
                  ? "bg-rose-100/95 text-rose-700"
                  : isLowStock
                    ? "bg-amber-100/95 text-amber-800"
                    : "bg-white/80 text-charcoal/80",
              )}
            >
              {isOutOfStock ? "Sold Out" : isLowStock ? `${stockCount} left` : stockLabel}
            </span>
          </div>
        </div>

        <span className="sr-only">{badgeItems.map((badge) => badge.label).join(", ") || statusLabel}</span>
      </div>

      <div className="flex flex-1 flex-col space-y-4 p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            {priceLabel}
          </p>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h3 className="line-clamp-2 break-words font-heading text-[17px] font-semibold leading-[1.35] text-neutral-900 sm:text-[18px]">
                {product.name}
              </h3>
              <p className="break-words text-[13px] leading-[1.5] text-neutral-600">{product.category}</p>
            </div>

            <div className="shrink-0 text-right">
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-[22px] font-semibold leading-none tracking-[-0.02em] text-neutral-950">
                  ৳{product.price.toLocaleString()}
                </span>
                {hasDiscount ? (
                  <span className="text-[12px] font-medium text-[var(--text-secondary)] line-through">
                    ৳{originalPrice.toLocaleString()}
                  </span>
                ) : null}
              </div>
              {hasDiscount ? (
                <p className="mt-1 text-[11px] font-medium text-emerald-700">
                  You save ৳{savingsAmount.toLocaleString()} ({savingsPercent}%)
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-2xl bg-[var(--soft-beige)]/35 px-3 py-2">
          <span className="text-[12px] font-medium text-neutral-700">{stockLabel}</span>
          {hasDiscount ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Save {savingsPercent}%
            </span>
          ) : isLowStock ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800">
              Only {stockCount} left
            </span>
          ) : null}
        </div>

        <div>
          <p className="text-[13px] font-medium leading-[1.5] text-neutral-900">Select Size</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {availableSizes.map((size) => (
              <button
                key={size}
                type="button"
                className={clsx(
                  "interactive-feedback rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                  selectedSize === size
                    ? "border-[var(--bar-maroon)] bg-[var(--bar-maroon)] text-white shadow-sm"
                    : "border-[var(--border-soft)] bg-white text-black hover:border-neutral-300",
                )}
                onClick={() => handleSizeChange(size)}
                disabled={isOutOfStock}
              >
                {size}
              </button>
            ))}
          </div>
          {showSizeError ? (
            <p className="mt-1 text-[12px] leading-[1.4] text-rose-600 transition-opacity duration-200">{sizeErrorLabel}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border border-[var(--border-soft)] bg-white px-2 py-1.5">
            <button
              type="button"
              className="interactive-feedback h-8 w-8 text-[14px] font-semibold text-black"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={isOutOfStock}
            >
              -
            </button>
            <span className="min-w-8 px-1 text-center text-[12px] font-semibold">{quantity}</span>
            <button
              type="button"
              className="interactive-feedback h-8 w-8 text-[14px] font-semibold text-black"
              onClick={() => onQuantityChange(quantity + 1)}
              disabled={isOutOfStock}
            >
              +
            </button>
          </div>
          {quantityFeedback ? <p className="text-xs font-semibold text-accent">{quantityFeedback}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.15fr_0.95fr]">
          <button
            type="button"
            className="interactive-feedback min-h-[44px] rounded-xl bg-[var(--bar-maroon)] px-4 py-3 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
            onClick={handleBuyClick}
            disabled={isRouting || isOutOfStock}
          >
            {isOutOfStock ? "Out of stock" : isRouting ? "Redirecting..." : buyNowLabel}
          </button>

          <button
            type="button"
            className={clsx(
              "interactive-feedback min-h-[44px] rounded-xl border px-4 py-3 text-[13px] font-semibold transition",
              addState === "success"
                ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400",
            )}
            onClick={handleAddClick}
            disabled={addState === "loading" || isRouting || isOutOfStock}
          >
            {isOutOfStock ? "Out of stock" : addState === "loading" ? "Loading..." : addLabel}
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
            if (isOutOfStock) return;
            handleSizeChange(size);
            onAddToCart();
          }}
          addToCartLabel={addToCartLabel}
        />
      ) : null}
    </div>
  );
}
