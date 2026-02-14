"use client";
// Client component required for interactive product card buttons.

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Product } from "../lib/products";

type AddState = "idle" | "loading" | "success";

type Props = {
  product: Product;
  onAddToCart: () => void;
  addToCartLabel: string;
  addingLabel: string;
  addedLabel: string;
  addState: AddState;
  isRouting?: boolean;
};

export default function ProductCard({
  product,
  onAddToCart,
  addToCartLabel,
  addingLabel,
  addedLabel,
  addState,
  isRouting = false,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);

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

  return (
    <div className="group overflow-hidden rounded-xl bg-white shadow-sm transition duration-200 hover:shadow-md">
      <div className="relative aspect-[3/4] overflow-hidden">
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
          <div className="h-full w-full bg-neutral-100" />
        )}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-neutral-900">
          {product.name}
        </h3>

        <p className="text-[15px] font-semibold tracking-tight text-neutral-900">৳{product.price.toLocaleString()}</p>

        <button
          type="button"
          onClick={onAddToCart}
          className="w-full rounded-lg bg-black py-2.5 text-[14px] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={addState === "loading" || isRouting}
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}
