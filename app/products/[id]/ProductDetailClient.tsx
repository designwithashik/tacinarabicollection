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
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "M");
  const { cartItems, setCartItems } = useCart();

  const formattedPrice = useMemo(
    () => `৳ ${product.price.toLocaleString("en-BD")}`,
    [product.price]
  );

  const handleAddToCart = () => {
    if (!selectedSize) return;

    setCartItems((prev) => {
      const next = [...prev];
      const existingIndex = next.findIndex(
        (item) => item.id === product.id && item.size === selectedSize
      );

      if (existingIndex >= 0) {
        const existing = next[existingIndex];
        next[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        return next;
      }

      return [
        ...next,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          size: selectedSize,
          color: product.colors[0] ?? "",
          quantity: 1,
          imageUrl: product.image,
          image: product.image,
        },
      ];
    });
  };

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `I want to order ${product.name}`
  )}`;

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-10 md:px-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--brand-surface)]">
          <Image src={product.image} alt={product.name} fill className="object-cover" priority />
        </div>

        <div>
          <h1 className="text-3xl font-medium text-[var(--brand-primary)]">{product.name}</h1>
          <p className="mt-3 text-xl font-semibold text-[var(--brand-primary)]">{formattedPrice}</p>

          <div className="mt-6">
            <p className="text-sm font-medium text-ink">Select Size</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-lg border px-4 py-2 transition-all duration-300 ${
                    selectedSize === size
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                      : "border-[var(--brand-secondary)]/40 hover:border-[var(--brand-primary)]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleAddToCart} className="btn-primary mt-8 w-full md:w-auto">
            Add to Cart
          </button>

          <div className="mt-6 rounded-xl border border-[var(--brand-secondary)]/20 bg-[var(--brand-surface)] p-4 text-sm text-[var(--brand-primary)]">
            <p>Cash on Delivery available nationwide</p>
            <p className="mt-1">Free pick-up: DU • Shahbag • Mirpur 10</p>
            <p className="mt-1">7-Day easy exchange policy</p>
          </div>

          <section className="mt-8 space-y-4 text-sm text-[var(--brand-primary)]/85">
            <div>
              <h2 className="font-medium text-[var(--brand-primary)]">Why You’ll Love It</h2>
              <p className="mt-1">
                A composed silhouette designed for effortless styling across everyday and occasion wear.
              </p>
            </div>
            <div>
              <h2 className="font-medium text-[var(--brand-primary)]">Fabric &amp; Feel</h2>
              <p className="mt-1">
                Thoughtfully selected materials with a soft, breathable finish for comfort throughout the day.
              </p>
            </div>
            <div>
              <h2 className="font-medium text-[var(--brand-primary)]">Delivery &amp; Exchange</h2>
              <p className="mt-1">
                Nationwide delivery with an easy 7-day exchange process for a confident shopping experience.
              </p>
            </div>
          </section>
        </div>
      </div>

      <div className="hidden md:block fixed bottom-6 right-6 z-40">
        <button type="button" onClick={handleAddToCart} className="btn-primary px-6 py-3 shadow-lg">
          Add to Cart
        </button>
      </div>

      <div className="fixed bottom-6 left-6 z-40">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[var(--brand-primary)] px-4 py-3 text-white shadow-lg transition hover:bg-[var(--brand-primary)]/90"
        >
          WhatsApp
        </a>
      </div>
    </main>
  );
}
