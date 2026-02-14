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

  const originalPrice =
    (product as Product & { originalPrice?: number; compareAtPrice?: number }).originalPrice ??
    (product as Product & { compareAtPrice?: number }).compareAtPrice;

  return (
    <div className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-200 hover:shadow-md">
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
        {imageSrc && !imageFailed ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition duration-300 ease-out group-hover:scale-105"
            onError={() => setImageFailed(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-[#f6efe3] via-[#f2e6d3] to-[#e8dcc6]" />
        )}

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

      <div className="space-y-2 p-3">
        <p className="text-[10px] uppercase tracking-widest text-[var(--brand-accent)]">New Arrival</p>

        <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-[var(--brand-primary)]">{product.name}</h3>

        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold text-[var(--brand-primary)] tracking-tight">৳ {product.price.toLocaleString()}</span>
          {typeof originalPrice === "number" && originalPrice > product.price ? (
            <span className="text-[11px] text-neutral-500 line-through">৳ {originalPrice.toLocaleString()}</span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleSizeChange(size)}
              className={clsx(
                "rounded-md border border-neutral-300 px-2 py-1 text-[11px] transition-all duration-200 ease-out",
                selectedSize === size ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white" : "text-neutral-700"
              )}
            >
              {size}
            </button>
          ))}
        </div>

        {showSizeError ? (
          <p className="mt-1 text-[12px] text-red-600 transition-opacity duration-200">{sizeErrorLabel}</p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className={clsx(
              "flex-1 rounded-md bg-[var(--brand-primary)] py-2 text-[13px] text-white transition hover:opacity-90",
              (addState === "loading" || isRouting) && "cursor-not-allowed bg-neutral-400"
            )}
            onClick={handleAddClick}
            disabled={addState === "loading" || isRouting}
          >
            {addLabel === addToCartLabel ? "Add" : addLabel}
          </button>

          <button
            type="button"
            className={clsx(
              "flex-1 rounded-md border border-[var(--brand-primary)] py-2 text-[13px] text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)] hover:text-white",
              isRouting && "cursor-not-allowed opacity-70"
            )}
            onClick={handleBuyClick}
            disabled={isRouting}
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
