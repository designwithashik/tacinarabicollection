"use client";

import clsx from "clsx";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "../lib/products";

const sizes = ["M", "L", "XL"] as const;

const toOptimizedImageKitUrl = (source: string) => {
  if (!source.startsWith("https://ik.imagekit.io/")) return source;

  const [base] = source.split("?");
  const hasTr = /\/tr:/.test(base);
  const transform = "w-1080,h-1350,c-at_max,q-90,f-webp";

  return hasTr
    ? base.replace(/\/tr:[^/]+\//, `/tr:${transform}/`)
    : base.replace("https://ik.imagekit.io/", `https://ik.imagekit.io/tr:${transform}/`);
};

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
  onSizeChange,
  onBuyNow,
  onOpenDetails,
  showBadge,
  buyNowLabel,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const [showSizes, setShowSizes] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [product.id, product.image]);

  const imageSrc = useMemo(() => {
    if (!product.image || !product.image.trim()) return null;
    return toOptimizedImageKitUrl(product.image);
  }, [product.image]);

  const sizeMissing = !selectedSize;

  return (
    <motion.article
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="group flex flex-col"
      onMouseEnter={() => setShowSizes(true)}
      onMouseLeave={() => setShowSizes(false)}
    >
      <button
        type="button"
        className="interactive-feedback relative w-full overflow-hidden rounded-2xl bg-[#f9f9f9]"
        onClick={onOpenDetails}
        aria-label={`Open details for ${product.name}`}
      >
        {imageSrc && !imageFailed ? (
          <Image
            src={imageSrc}
            alt={product.name}
            width={720}
            height={960}
            className="aspect-[3/4] h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="aspect-[3/4] h-full w-full bg-[#f1f1f1]" />
        )}

        {showBadge ? (
          <span className="absolute right-4 top-4 rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
            {showBadge}
          </span>
        ) : null}
      </button>

      <div className="mt-4 flex flex-col space-y-1 px-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-900">{product.name}</h3>
          <span className="text-sm font-semibold text-zinc-900">৳{product.price}</span>
        </div>

        <p className="pb-2 text-xs uppercase tracking-[0.3em] text-zinc-400">{product.category}</p>

        {(showSizes || sizeMissing) && (
          <div className="mb-3 flex gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSizeChange(size)}
                className={clsx(
                  "h-8 w-8 rounded-full border text-[10px] transition-all duration-300",
                  selectedSize === size
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onBuyNow}
          disabled={sizeMissing}
          className={clsx(
            "w-full rounded-lg border py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
            sizeMissing
              ? "cursor-not-allowed border-zinc-200 text-zinc-400"
              : "border-zinc-200 text-zinc-800 hover:bg-zinc-900 hover:text-white"
          )}
        >
          {buyNowLabel}
        </button>
      </div>
    </motion.article>
  );
}
