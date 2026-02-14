"use client";

import Image from "next/image";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
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
  sizeErrorLabel: string;
  isRouting?: boolean;
};

export default function ProductCard({
  product,
  selectedSize,
  onSizeChange,
  onAddToCart,
  onOpenDetails,
  addToCartLabel,
  addingLabel,
  addedLabel,
  addState,
  isRouting = false,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [product.id, product.image]);

  useEffect(() => {
    if (!selectedSize) {
      onSizeChange(product.sizes[0] ?? "M");
    }
  }, [onSizeChange, product.sizes, selectedSize]);

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

  const handleAddClick = () => {
    if (!product.id) return;
    onAddToCart();
  };

  return (
    <div className="group overflow-hidden rounded-xl bg-white shadow-sm transition duration-200 hover:shadow-md">
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
            className="object-cover transition duration-300 group-hover:scale-105"
            onError={() => setImageFailed(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="h-full w-full bg-neutral-200" />
        )}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-neutral-900">{product.name}</h3>

        <p className="text-[15px] font-semibold tracking-tight text-neutral-900">
          ৳{product.price.toLocaleString("en-BD")}
        </p>

        <button
          type="button"
          onClick={handleAddClick}
          className={clsx(
            "w-full rounded-lg bg-black py-2.5 text-[14px] text-white transition hover:opacity-90",
            (addState === "loading" || isRouting) && "cursor-not-allowed opacity-70"
          )}
          disabled={addState === "loading" || isRouting}
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}
