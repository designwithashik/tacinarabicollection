"use client";
// Client component required for interactive product card buttons.

import Image from "next/image";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "../lib/products";
import QuickView from "./QuickView";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

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
    <div className="group flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-200 ease-out hover:shadow-md">
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
          <Badge variant="popular" className="absolute left-3 top-3" />
        ) : null}
        <Badge variant="new" className="absolute right-3 top-3" />
        <span className="sr-only">{statusLabel}</span>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setQuickViewProduct(product);
          }}
          className="absolute right-3 top-12 rounded-full bg-white/90 px-2.5 py-1 text-[10px] opacity-0 backdrop-blur-sm transition duration-300 group-hover:opacity-100 sm:text-xs"
        >
          Quick View
        </button>
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-4">
        <div className="flex justify-between items-start gap-2">
          <h3 className="line-clamp-2 break-words text-[16px] font-medium leading-[1.4] text-neutral-900">
            {product.name}
          </h3>
          <span className="whitespace-nowrap text-[16px] font-medium leading-[1.4] text-neutral-900">
            ৳{product.price.toLocaleString()}
          </span>
        </div>

        {typeof originalPrice === "number" && originalPrice > product.price ? (
          <p className="text-[11px] text-[var(--brand-muted)] line-through">৳{originalPrice.toLocaleString()}</p>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <p className="break-words text-[13px] leading-[1.5] text-neutral-700">{product.category}</p>
          {typeof stockCount === "number" && stockCount <= 5 ? (
            <Badge variant="low-stock" className="whitespace-nowrap" />
          ) : null}
        </div>

        <div>
          <p className="text-[13px] font-medium leading-[1.5] text-neutral-900">Select Size</p>
          <div className="flex gap-1 flex-wrap mt-1">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={clsx(
                  "interactive-feedback text-[11px] px-2 py-1 rounded-md border transition",
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
            <p className="mt-1 text-[12px] leading-[1.4] text-rose-600 transition-opacity duration-200">{sizeErrorLabel}</p>
          ) : null}
        </div>

        <div className="flex gap-2 items-center mt-2">
          <div className="flex items-center border border-[#e5d7cc] rounded-md px-2 py-1 bg-white">
            <button
              type="button"
              className="interactive-feedback text-[12px] font-semibold text-ink"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            >
              -
            </button>
            <span className="px-2 text-[12px] font-semibold">{quantity}</span>
            <button
              type="button"
              className="interactive-feedback text-[12px] font-semibold text-ink"
              onClick={() => onQuantityChange(quantity + 1)}
            >
              +
            </button>
          </div>
          <Button
            type="button"
            className="flex-1 text-[13px]"
            onClick={handleBuyClick}
            disabled={isRouting}
          >
            {isRouting ? "Redirecting..." : buyNowLabel}
          </Button>
        </div>

        {quantityFeedback ? <p className="text-xs font-semibold text-accent">{quantityFeedback}</p> : null}

        <Button
          type="button"
          variant={addState === "success" ? "success" : "secondary"}
          className="mt-1 w-full text-[13px]"
          onClick={handleAddClick}
          disabled={addState === "loading" || isRouting}
          loading={addState === "loading"}
        >
          {addLabel}
        </Button>
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
