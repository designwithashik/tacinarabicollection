"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const handleAddToCart = useCallback(
    (product: HeroProduct) => {
      addToCart(product);
    },
    [addToCart],
  );

  const [heroProducts, setHeroProducts] = useState<HeroProduct[]>(initialProducts.slice(0, 3));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

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
    setCurrentIndex((prev) => {
      if (heroProducts.length === 0) return 0;
      return prev % heroProducts.length;
    });
  }, [heroProducts.length]);

  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (heroProducts.length < 2 || isPaused) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
    }, 6000);

    intervalRef.current = interval;

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [heroProducts.length, isPaused]);

  if (heroProducts.length === 0) {
    return null;
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="flex will-change-transform"
        style={{
          transform: `translate3d(-${currentIndex * 100}%, 0, 0)`,
          transition: "transform 900ms cubic-bezier(.22,1,.36,1)",
        }}
      >
        {heroProducts.map((product, index) => (
          <div
            key={product.id}
            className={clsx(
              "relative w-full flex-shrink-0 aspect-[16/9] md:aspect-[21/9] overflow-hidden transition-transform duration-900",
              index === currentIndex ? "scale-100" : "scale-[0.985]",
            )}
          >
            <img
              src={product.imageUrl || product.image || "/images/product-1.svg"}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

            <div className="absolute inset-0 z-20 flex items-end justify-center px-6 pb-10 md:items-center md:pb-0">
              <div className="max-w-xl text-center text-white">
                <h2 className="text-2xl font-medium tracking-wide md:text-4xl">{product.name}</h2>

                <p className="mt-3 text-sm text-white/80 md:text-base">
                  A composed expression of modern Arabic-inspired lifestyle—crafted for elegant everyday living.
                </p>

                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-white text-black font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
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

      {buyNow ? (
        <button
          type="button"
          className="absolute right-6 top-6 rounded-full border border-white/50 bg-black/30 px-3 py-1 text-xs text-white"
          onClick={() => buyNow(heroProducts[currentIndex])}
        >
          Buy Now
        </button>
      ) : null}

      {heroProducts.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            className="absolute top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-110 left-3 md:left-4"
            onClick={() =>
              setCurrentIndex((prev) => (prev - 1 + heroProducts.length) % heroProducts.length)
            }
          >
            <span aria-hidden>‹</span>
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="absolute top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-110 right-3 md:right-4"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % heroProducts.length)}
          >
            <span aria-hidden>›</span>
          </button>
        </>
      ) : null}

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {heroProducts.map((product, index) => (
          <button
            key={`dot-${product.id}`}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            className={clsx(
              "transition-all duration-300",
              index === currentIndex
                ? "w-6 h-2 rounded-full bg-white"
                : "w-2 h-2 rounded-full bg-white/50",
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
