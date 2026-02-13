"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  initialProducts?: HeroProduct[];
};

export default function HeroCarousel({ addToCart, initialProducts = [] }: HeroCarouselProps) {
  const handleAddToCart = useCallback((product: HeroProduct) => {
    addToCart(product);
  }, [addToCart]);
  // Phase1.8: State for dynamic hero products and active slide index.
  const [heroProducts, setHeroProducts] = useState<HeroProduct[]>(initialProducts.slice(0, 3));
  const [currentIndex, setCurrentIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Phase1.8: Fetch admin-controlled featured products.
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

  // Phase1.8: Auto-scroll slides every 6 seconds for calmer pacing.
  useEffect(() => {
    if (heroProducts.length < 2 || prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [heroProducts, prefersReducedMotion]);

  useEffect(() => {
    setCurrentIndex((prev) => {
      if (heroProducts.length === 0) return 0;
      return prev % heroProducts.length;
    });
  }, [heroProducts.length]);

  if (heroProducts.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden">
      {/* Phase1.8: Horizontal slide animation wrapper. */}
      <motion.div
        className="flex"
        animate={{ x: `-${currentIndex * 100}%` }}
        transition={{ type: "tween", duration: prefersReducedMotion ? 0 : 0.7, ease: "easeInOut" }}
      >
        {heroProducts.map((product) => (
          <div
            key={product.id}
            className="relative min-w-full overflow-hidden"
          >
            <img
              src={product.imageUrl || product.image || "/images/product-1.svg"}
              alt={product.name}
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

            <div className="absolute inset-0 flex items-end md:items-center justify-center px-6 pb-10 md:pb-0">
              <div className="text-center text-white max-w-xl">
                <h2 className="text-2xl md:text-4xl font-medium tracking-wide">
                  {product.name}
                </h2>

                <p className="mt-3 text-sm md:text-base text-white/80">
                  A composed expression of modern Arabic-inspired lifestyle—crafted for elegant everyday living.
                </p>

                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    className="btn-primary"
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
      </motion.div>

      {/* Phase1.8: Subtle navigation dots. */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {heroProducts.map((product, index) => (
          <button
            key={`dot-${product.id}`}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            className={clsx(
              "h-2.5 w-2.5 rounded-full transition-opacity duration-300",
              index === currentIndex
                ? "bg-[var(--brand-primary)]/70"
                : "bg-[var(--brand-secondary)]/35 hover:opacity-100 opacity-60"
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
