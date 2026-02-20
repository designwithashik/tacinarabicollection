"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import clsx from "clsx";
import type { Product } from "../../../lib/models/products";
import useCart from "../../../hooks/useCart";

type Props = {
  product: Product;
};

const whatsappNumber = "8801522119189";

export default function ProductDetailClient({ product }: Props) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const { setCartItems } = useCart();

  const formattedPrice = useMemo(
    () => `৳ ${product.price.toLocaleString("en-BD")}`,
    [product.price]
  );

  const oldPrice = null;


  const buildCartItem = (size: string) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    size,
    color: product.colors[0] ?? "",
    quantity: 1,
    imageUrl: product.image,
    image: product.image,
  });

  const handleAddToCart = (sizeOverride?: string) => {
    if (!product.id) return;
    const sizeToUse = sizeOverride ?? selectedSize;
    if (!sizeToUse) {
      setSizeError(true);
      return;
    }

    setSizeError(false);
    setCartItems((prev) => {
      const next = [...prev];
      const existingIndex = next.findIndex(
        (item) => item.id === product.id && item.size === sizeToUse
      );

      if (existingIndex >= 0) {
        const existing = next[existingIndex];
        next[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        return next;
      }

      return [...next, buildCartItem(sizeToUse)];
    });
  };

  const handleBuyNow = () => {
    if (isRouting || !product.id) return;
    if (!selectedSize) {
      setSizeError(true);
      return;
    }

    handleAddToCart(selectedSize);
    setIsRouting(true);

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      `I want to order ${product.name} (Size: ${selectedSize}) now.`
    )}`;

    window.setTimeout(() => {
      window.location.href = whatsappUrl;
    }, 180);
  };

  return (
    <main
      className={clsx(
        "max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8 transition-opacity duration-300 ease-in-out",
        isRouting && "opacity-80"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 grid md:grid-cols-2 gap-8">
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[var(--brand-surface)]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition duration-500 hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="space-y-5">
          <h1 className="text-xl md:text-2xl font-medium leading-tight text-[var(--brand-primary)]">{product.name}</h1>

          <div className="mb-4">
            <p className="text-lg md:text-xl font-semibold text-neutral-900">{formattedPrice}</p>
            {oldPrice ? <p className="text-[13px] line-through text-neutral-500">{oldPrice}</p> : null}
          </div>

          <div className="pt-1">
            <p className="text-[13px] font-medium text-ink">Select Size</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setSizeError(false);
                  }}
                  className={`px-4 py-2 rounded-lg border border-neutral-300 text-[13px] transition-all duration-200 ease-out ${
                    selectedSize === size
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "hover:border-neutral-900"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {sizeError ? (
              <p className="text-red-600 text-[12px] mt-1 transition-opacity duration-200">
                Please select a size first
              </p>
            ) : null}

            <div className="mt-4 text-[13px] text-neutral-600 space-y-1">
              <p>✓ Cash on Delivery Available</p>
              <p>✓ Nationwide Delivery</p>
              <p>✓ WhatsApp Order Support</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleAddToCart()}
            className="btn-primary w-full py-2 text-[13px] rounded-lg font-semibold mt-4"
          >
            Add to Cart
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isRouting}
            className={clsx(
              "w-full border border-neutral-900 text-neutral-900 py-2 text-[13px] rounded-lg mt-3 transition-all duration-200 ease-out",
              isRouting
                ? "cursor-not-allowed opacity-70"
                : "hover:bg-neutral-900 hover:text-white"
            )}
          >
            {isRouting ? "Redirecting..." : "Buy Now"}
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden z-50">
        <button
          type="button"
          onClick={() => handleAddToCart()}
          className="btn-primary w-full py-2 text-[13px] rounded-lg font-semibold"
        >
          Add to Cart
        </button>
      </div>
    </main>
  );
}
