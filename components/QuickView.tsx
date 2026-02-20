"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import type { Product } from "../lib/models/products";

type QuickViewProps = {
  product: Product | null;
  selectedSize?: string;
  onSizeChange: (size: string) => void;
  onClose: () => void;
  onAddToCart: (size: string) => void;
  addToCartLabel: string;
};

export default function QuickView({
  product,
  selectedSize,
  onSizeChange,
  onClose,
  onAddToCart,
  addToCartLabel,
}: QuickViewProps) {
  const [localSize, setLocalSize] = useState<string>(selectedSize ?? "");

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!product) return;
    setLocalSize(selectedSize ?? product.sizes[0] ?? "");
  }, [product, selectedSize]);

  const displayPrice = useMemo(() => {
    if (!product) return "";
    return `৳ ${product.price.toLocaleString("en-BD")}`;
  }, [product]);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view for ${product.name}`}
    >
      <div
        className="animate-modalFade relative mx-6 w-full max-w-3xl rounded-2xl bg-white p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-sm opacity-70 transition hover:opacity-100"
        >
          Close
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[var(--brand-surface)]">
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          </div>

          <div>
            <h2 className="text-2xl font-medium text-[var(--brand-primary)]">{product.name}</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--brand-primary)]">{displayPrice}</p>

            <div className="mt-6">
              <p className="text-sm font-medium text-ink">Select Size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setLocalSize(size)}
                    className={clsx(
                      "min-h-[40px] rounded-full border px-4 py-1 text-sm font-medium transition",
                      localSize === size
                        ? "border-accent bg-accent text-white"
                        : "border-[#e5d7cc] bg-white text-ink"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => {
                  if (!localSize) return;
                  onSizeChange(localSize);
                  onAddToCart(localSize);
                  onClose();
                }}
              >
                {addToCartLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
