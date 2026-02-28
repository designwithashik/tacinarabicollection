"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import type { Product } from "../lib/products";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm sm:px-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view for ${product.name}`}
    >
      <div
        className="animate-modalFade relative w-full max-w-3xl rounded-2xl bg-white p-5 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-sm opacity-70 transition hover:opacity-100"
        >
          Close
        </button>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[var(--bg-main)]">
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          </div>

          <div>
            <h2 className="text-2xl font-medium text-black">{product.name}</h2>
            <p className="mt-2 text-lg font-semibold text-black">{displayPrice}</p>

            <div className="mt-6">
              <p className="text-sm font-medium text-black">Select Size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setLocalSize(size)}
                    className={clsx(
                      "min-h-[40px] rounded-full border px-4 py-1 text-sm font-medium transition",
                      localSize === size
                        ? "border-[var(--bar-maroon)] bg-[var(--bar-maroon)] text-white"
                        : "border-[var(--border-soft)] bg-white text-black",
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
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
              <Link
                href={`/products/${encodeURIComponent(product.id)}`}
                onClick={onClose}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
              >
                View full product
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
