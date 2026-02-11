"use client";

import clsx from "clsx";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "../lib/products";

const sizes = ["M", "L", "XL"] as const;

const easeLuxury: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
  onAddToCart,
  onOpenDetails,
  showBadge,
  buyNowLabel,
  addingLabel,
  addedLabel,
  addState,
  statusLabel,
  stockLabel,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [product.id, product.image]);

  const imageSrc = useMemo(() => {
    if (!product.image || !product.image.trim()) return null;
    return toOptimizedImageKitUrl(product.image);
  }, [product.image]);

  const sizeMissing = !selectedSize;
  const ctaLabel = addState === "loading" ? addingLabel : addState === "success" ? addedLabel : buyNowLabel;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: easeLuxury }}
      className="group relative"
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
    >
      <button
        type="button"
        className="interactive-feedback relative w-full overflow-hidden rounded-[32px] bg-[#f7f7f7] shadow-sm transition-all duration-700 hover:shadow-2xl"
        onClick={onOpenDetails}
        aria-label={`Open details for ${product.name}`}
      >
        {imageSrc && !imageFailed ? (
          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 1.5, ease: easeLuxury }}>
            <Image
              src={imageSrc}
              alt={product.name}
              width={720}
              height={960}
              className="aspect-[3/4] w-full object-cover"
              onError={() => setImageFailed(true)}
              priority={false}
            />
          </motion.div>
        ) : (
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-b from-[#f3f4f6] via-[#eceff2] to-[#e5e7eb]" />
        )}

        <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-white/60 px-4 py-1.5 backdrop-blur-md">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black">{product.category}</span>
        </div>

        {showBadge ? (
          <div className="absolute right-6 top-6 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
            {showBadge}
          </div>
        ) : null}
      </button>

      <div className="mt-6 px-2">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-heading text-[18px] leading-tight text-black">{product.name}</h3>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gray-400">
              {statusLabel} • {stockLabel}
            </p>
          </div>
          <div className="text-right">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-gray-400">Price</span>
            <span className="text-xl font-light text-black">৳{product.price}</span>
          </div>
        </div>

        <AnimatePresence>
          {(isActive || sizeMissing) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35, ease: easeLuxury }}
              className="mb-6 flex gap-3"
            >
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onSizeChange(size)}
                  className={clsx(
                    "h-10 w-10 rounded-full border text-[11px] transition-all duration-300",
                    selectedSize === size
                      ? "scale-110 border-black bg-black text-white shadow-lg"
                      : "border-gray-200 text-gray-500 hover:border-black hover:text-black"
                  )}
                >
                  {size}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onBuyNow}
          disabled={sizeMissing}
          className={clsx(
            "group/cta relative w-full overflow-hidden rounded-full bg-black py-4 transition-all duration-500",
            sizeMissing ? "cursor-not-allowed opacity-60" : "hover:bg-zinc-800 active:scale-[0.98]"
          )}
        >
          <div className="flex items-center justify-center gap-2 text-white">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em]">{ctaLabel}</span>
            <ShoppingBag size={14} className="transition-transform group-hover/cta:translate-x-1" />
          </div>
        </button>
      </div>

      <button
        type="button"
        aria-label="Quick add to cart"
        onClick={onAddToCart}
        disabled={sizeMissing || addState === "loading"}
        className={clsx(
          "interactive-feedback absolute bottom-[82px] right-8 z-20 hidden h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/95 text-lg text-charcoal shadow-soft transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] md:flex",
          sizeMissing || addState === "loading"
            ? "cursor-not-allowed opacity-60"
            : "opacity-0 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100"
        )}
      >
        +
      </button>
    </motion.article>
  );
}
