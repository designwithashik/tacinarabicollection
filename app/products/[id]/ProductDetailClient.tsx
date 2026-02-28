"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "../../../lib/products";
import useCart from "../../../hooks/useCart";

type Props = {
  product: Product;
};

const whatsappNumber = "8801522119189";

export default function ProductDetailClient({ product }: Props) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "M");
  const [checkoutQty, setCheckoutQty] = useState(1);
  const { setCartItems } = useCart();

  const formattedPrice = useMemo(
    () => `৳ ${product.price.toLocaleString("en-BD")}`,
    [product.price],
  );

  const checkoutTotal = useMemo(
    () => product.price * Math.max(1, Math.floor(checkoutQty)),
    [product.price, checkoutQty],
  );

  const addToCartWithQuantity = (quantity: number) => {
    if (!selectedSize) return;
    const safeQty = Math.max(1, Math.floor(quantity));

    setCartItems((prev) => {
      const next = [...prev];
      const existingIndex = next.findIndex(
        (item) => item.id === product.id && item.size === selectedSize,
      );

      if (existingIndex >= 0) {
        const existing = next[existingIndex];
        next[existingIndex] = {
          ...existing,
          quantity: existing.quantity + safeQty,
        };
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
          quantity: safeQty,
          imageUrl: product.image,
          image: product.image,
        },
      ];
    });
  };

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `I want to order ${product.name} | Size: ${selectedSize} | Qty: ${checkoutQty}`,
  )}`;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 md:px-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-8">
          <section className="grid gap-7 md:grid-cols-2 md:gap-9">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--bg-main)] ring-1 ring-black/5">
              <Image src={product.image} alt={product.name} fill className="object-cover" priority />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">Product</p>
              <h1 className="mt-2 text-2xl font-semibold text-black sm:text-3xl">{product.name}</h1>
              <p className="mt-3 text-xl font-semibold text-black">{formattedPrice}</p>

              <div className="mt-6">
                <p className="text-sm font-medium text-black">Select Size</p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-[var(--border-soft)] text-black hover:border-black/60"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4 text-sm text-black">
                <p>Cash on Delivery available nationwide</p>
                <p className="mt-1">Free pick-up: DU • Shahbag • Mirpur 10</p>
                <p className="mt-1">7-Day easy exchange policy</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-black sm:text-lg">Quick Checkout for this item</h2>
            <p className="mt-1 text-sm text-black/70">
              Choose quantity and add directly to cart before continuing checkout.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="text-xs font-semibold text-black/75">
                Quantity
                <div className="mt-1 flex w-fit items-center rounded-full border border-black/15">
                  <button
                    type="button"
                    className="h-9 w-9 text-lg text-black"
                    onClick={() => setCheckoutQty((prev) => Math.max(1, prev - 1))}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold text-black">{checkoutQty}</span>
                  <button
                    type="button"
                    className="h-9 w-9 text-lg text-black"
                    onClick={() => setCheckoutQty((prev) => prev + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </label>

              <p className="text-sm font-semibold text-black">
                Subtotal: ৳{checkoutTotal.toLocaleString("en-BD")}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => addToCartWithQuantity(checkoutQty)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-black/90"
              >
                Add to cart
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-black px-5 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
              >
                Checkout on WhatsApp
              </a>
              <Link
                href="/"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/20 px-5 py-2 text-sm font-semibold text-black transition hover:border-black/40"
              >
                Continue shopping
              </Link>
            </div>
          </section>

          <section className="space-y-4 text-sm text-black/90">
            <div>
              <h2 className="font-medium text-black">Product Details</h2>
              <p className="mt-1 whitespace-pre-line">
                {product.description?.trim()
                  ? product.description
                  : "Product description will be available soon."}
              </p>
            </div>
            <div>
              <h2 className="font-medium text-black">Delivery &amp; Exchange</h2>
              <p className="mt-1">
                Nationwide delivery with an easy 7-day exchange process for a confident shopping experience.
              </p>
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-black/60">Actions</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => addToCartWithQuantity(1)}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90"
            >
              Add to cart
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
            >
              Order on WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}
