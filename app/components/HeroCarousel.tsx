"use client";

import { useEffect, useState } from "react";
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

  // Phase1.8: Auto-scroll slides every 4 seconds.
  useEffect(() => {
    if (heroProducts.length < 2 || prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
    }, 4000);

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
    <div className="relative w-full overflow-hidden rounded-xl">
      {/* Phase1.8: Horizontal slide animation wrapper. */}
      <motion.div
        className="flex"
        animate={{ x: `-${currentIndex * 100}%` }}
        transition={{ type: "tween", duration: prefersReducedMotion ? 0 : 1, ease: "easeInOut" }}
      >
        {heroProducts.map((product) => (
          <div
            key={product.id}
            className="relative h-[350px] min-w-full overflow-hidden rounded-xl sm:h-[450px]"
          >
            <img
              src={product.imageUrl || product.image || "/images/product-1.svg"}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/25" />

            {/* Phase1.8: Slide text and direct add-to-cart action. */}
            <div className="absolute bottom-4 left-4 text-white sm:bottom-6 sm:left-6">
              <h2 className="text-lg font-bold sm:text-2xl">{product.name}</h2>
              <button
                type="button"
                className="interactive-feedback btn-primary mt-3 text-xs uppercase tracking-[0.16em]"
                onClick={() => addToCart(product)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Phase1.8: Navigation dots. */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {heroProducts.map((product, index) => (
          <button
            key={`dot-${product.id}`}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            className={clsx(
              "h-3 w-3 rounded-full transition-colors",
              index === currentIndex ? "bg-white" : "bg-white/50"
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
