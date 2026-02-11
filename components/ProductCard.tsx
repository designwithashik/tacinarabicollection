"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product } from "../lib/products";

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

const toOptimizedImageKitUrl = (source: string) => {
  if (!source.startsWith("https://ik.imagekit.io/")) return source;

  const [base] = source.split("?");
  const hasTr = /\/tr:/.test(base);
  const transform = "w-1080,h-1350,c-at_max,q-90,f-webp";

  return hasTr
    ? base.replace(/\/tr:[^/]+\//, `/tr:${transform}/`)
    : base.replace("https://ik.imagekit.io/", `https://ik.imagekit.io/tr:${transform}/`);
};

export default function ProductCard({
  product,
  selectedSize,
  quantity,
  onQuantityChange,
  onBuyNow,
  onAddToCart,
  onOpenDetails,
  showBadge,
  buyNowLabel,
  addToCartLabel,
  addingLabel,
  addedLabel,
  addState,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const imageUrl = useMemo(
    () => toOptimizedImageKitUrl(product.image || "https://placehold.co/600x800?text=No+Image"),
    [product.image]
  );

  const isInteractive = isHovered || isTouched;
  const addLabel = addState === "loading" ? addingLabel : addState === "success" ? addedLabel : addToCartLabel;

  return (
    <article
      className="group flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={() => {
          setIsTouched((prev) => !prev);
          onOpenDetails();
        }}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-zinc-100 text-left"
        aria-label={`Open ${product.name}`}
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = "https://placehold.co/600x800?text=Image+Error";
          }}
        />

        {showBadge ? (
          <span className="absolute right-3 top-3 rounded-full bg-zinc-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
            {showBadge}
          </span>
        ) : null}

        <AnimatePresence>
          {isInteractive ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/90 p-2 shadow-lg backdrop-blur-md">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onQuantityChange(Math.max(1, quantity - 1));
                  }}
                  className="rounded-lg p-1 transition-colors hover:bg-zinc-100"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-xs font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onQuantityChange(quantity + 1);
                  }}
                  className="rounded-lg p-1 transition-colors hover:bg-zinc-100"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onBuyNow();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-white shadow-xl transition-all hover:bg-zinc-800 active:scale-95"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest">{buyNowLabel}</span>
                <ShoppingBag size={14} />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onAddToCart();
                }}
                className={clsx(
                  "w-full rounded-xl border bg-white/95 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
                  addState === "loading"
                    ? "cursor-not-allowed border-zinc-200 text-zinc-400"
                    : "border-zinc-200 text-zinc-800 hover:bg-zinc-100"
                )}
                disabled={addState === "loading"}
              >
                {addLabel}
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </button>

      <div className="mt-4 flex items-start justify-between px-1">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-tight text-zinc-900">{product.name}</h3>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{product.category}</p>
          {selectedSize ? <p className="text-[10px] text-zinc-500">Size {selectedSize}</p> : null}
        </div>
        <span className="text-sm font-bold text-zinc-900">৳{product.price}</span>
      </div>
    </article>
  );
}
