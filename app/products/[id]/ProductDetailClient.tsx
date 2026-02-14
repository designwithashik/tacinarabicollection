"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Product } from "../../../lib/products";
import useCart from "../../../hooks/useCart";

type Props = {
  product: Product;
};

const whatsappNumber = "8801522119189";

export default function ProductDetailClient({ product }: Props) {
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const { setCartItems } = useCart();

  const formattedPrice = useMemo(
    () => `৳ ${product.price.toLocaleString("en-BD")}`,
    [product.price]
  );

  const oldPrice = null;

  const getDefaultSize = () => {
    if (product.sizes.includes("M")) return "M";
    return product.sizes[0] ?? "M";
  };

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
    const sizeToUse = selectedSize || getDefaultSize();
    if (!selectedSize) {
      setSelectedSize(sizeToUse);
    }

    handleAddToCart(sizeToUse);

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      `I want to order ${product.name} (Size: ${sizeToUse}) now.`
    )}`;
    window.location.href = whatsappUrl;
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-10">
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
          <h1 className="text-3xl font-medium text-[var(--brand-primary)]">{product.name}</h1>

          <div className="mb-4">
            <p className="text-2xl font-semibold text-neutral-900">{formattedPrice}</p>
            {oldPrice ? <p className="text-sm line-through text-neutral-500">{oldPrice}</p> : null}
          </div>

          <div className="pt-1">
            <p className="text-sm font-medium text-ink">Select Size</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setSizeError(false);
                  }}
                  className={`px-4 py-2 rounded-lg border border-neutral-300 text-sm transition ${
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
              <p className="text-red-600 text-sm mt-2">
                Please select a size first
              </p>
            ) : null}

            <div className="mt-4 text-sm text-neutral-600 space-y-1">
              <p>✓ Cash on Delivery Available</p>
              <p>✓ Nationwide Delivery</p>
              <p>✓ WhatsApp Order Support</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleAddToCart()}
            className="btn-primary w-full py-3 text-base font-semibold mt-6"
          >
            Add to Cart
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className="w-full border border-neutral-900 text-neutral-900 py-3 rounded-lg mt-3 hover:bg-neutral-900 hover:text-white transition"
          >
            Buy Now
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden z-50">
        <button
          type="button"
          onClick={() => handleAddToCart()}
          className="btn-primary w-full py-3 text-base font-semibold"
        >
          Add to Cart
        </button>
      </div>
    </main>
  );
}
