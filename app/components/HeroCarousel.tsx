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
    <div className="relative w-full overflow-hidden rounded-[20px] min-h-[58vh] md:min-h-[65vh] lg:min-h-[70vh] flex items-center">
      {/* Phase1.8: Horizontal slide animation wrapper. */}
      <motion.div
        className="flex h-full"
        animate={{ x: `-${currentIndex * 100}%` }}
        transition={{ type: "tween", duration: prefersReducedMotion ? 0 : 0.7, ease: "easeInOut" }}
      >
        {heroProducts.map((product) => (
          <div
            key={product.id}
            className="relative min-h-[58vh] md:min-h-[65vh] lg:min-h-[70vh] min-w-full overflow-hidden rounded-[20px]"
          >
            <img
              src={product.imageUrl || product.image || "/images/product-1.svg"}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[var(--brand-bg)]/30 backdrop-blur-[1px]" />

            {/* Editorial text and composed CTA treatment. */}
            <div className="absolute inset-0 flex items-center px-6 md:px-12">
              <div>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-wide leading-tight text-[var(--brand-primary)]">
                  {product.name}
                </h2>
                <p className="mt-6 text-base md:text-lg text-[var(--brand-muted)] max-w-xl">
                  A composed expression of modern Arabic-inspired lifestyle—crafted for elegant everyday living.
                </p>
                <button
                  type="button"
                  className="interactive-feedback btn-primary mt-8"
                  onClick={() => addToCart(product)}
                >
                  Add to Cart
                </button>
                <a
                  href="#product-grid"
                  className="mt-4 inline-block text-sm tracking-wide transition-opacity duration-300 hover:opacity-80 text-[var(--brand-primary)]"
                >
                  Explore the Collection
                </a>
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
