"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";

export type HeroProduct = {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string | null;
  price?: number;
};

type HeroCarouselProps = {
  addToCart: (product: HeroProduct) => void;
  buyNow?: (product: HeroProduct) => void;
  initialProducts?: HeroProduct[];
};

export default function HeroCarousel({ addToCart, buyNow, initialProducts = [] }: HeroCarouselProps) {
  const handleAddToCart = useCallback((product: HeroProduct) => {
    addToCart(product);
  }, [addToCart]);

  const [heroProducts, setHeroProducts] = useState<HeroProduct[]>(initialProducts.slice(0, 3));
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadHeroProducts = async () => {
      try {
        const res = await fetch("/api/products?hero=true", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as HeroProduct[];
        if (Array.isArray(data) && data.length > 0) {
          setHeroProducts(data.slice(0, 3));
        }
      } catch {
        setHeroProducts((current) => current);
      }
    };

    void loadHeroProducts();
  }, []);

  useEffect(() => {
    if (heroProducts.length < 2) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [heroProducts.length]);

  useEffect(() => {
    setCurrentIndex((prev) => {
      if (heroProducts.length === 0) return 0;
      return prev % heroProducts.length;
    });
  }, [heroProducts.length]);

  if (heroProducts.length === 0) {
    return null;
  }

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
  };

  return (
    <div className="relative overflow-hidden w-full">
      <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-2xl md:rounded-3xl">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {heroProducts.map((product) => (
            <div key={product.id} className="w-full flex-shrink-0 relative">
              <img
                src={product.imageUrl || product.image || "/images/product-1.svg"}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

              <div className="absolute inset-0 z-20 flex items-end justify-center px-6 pb-10 md:items-center md:pb-0">
                <div className="max-w-xl text-center text-white">
                  <h2 className="text-2xl font-medium tracking-wide md:text-4xl">{product.name}</h2>

                  <p className="mt-3 text-sm text-white/80 md:text-base">
                    A composed expression of modern Arabic-inspired lifestyle—crafted for elegant everyday living.
                  </p>

                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      className="btn-primary relative z-30"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {heroProducts.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/85 p-2 text-neutral-800 shadow-md transition-all duration-300 hover:scale-105"
            onClick={goPrev}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/85 p-2 text-neutral-800 shadow-md transition-all duration-300 hover:scale-105"
            onClick={goNext}
          >
            ›
          </button>
        </>
      ) : null}

      {buyNow ? (
        <button
          type="button"
          className="absolute right-6 top-6 z-30 rounded-full border border-white/50 bg-black/40 px-3 py-1 text-xs text-white shadow-md transition-all duration-300 hover:scale-105"
          onClick={() => buyNow(heroProducts[currentIndex])}
        >
          Buy Now
        </button>
      ) : null}

      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {heroProducts.map((product, index) => (
          <button
            key={`dot-${product.id}`}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            className={clsx(
              "h-2.5 w-2.5 rounded-full shadow-sm transition-all duration-300 hover:scale-105",
              index === currentIndex
                ? "bg-[var(--brand-primary)]/70"
                : "bg-[var(--brand-secondary)]/35 opacity-60 hover:opacity-100"
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
