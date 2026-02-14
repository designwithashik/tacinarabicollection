"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

export type HeroProduct = {
  id: string;
  name: string;
  title?: string;
  subtitle?: string;
  image?: string;
  imageUrl?: string | null;
  price?: number;
};

type HeroCarouselProps = {
  addToCart: (product: HeroProduct) => void;
  initialProducts?: HeroProduct[];
};

export default function HeroCarousel({ addToCart, initialProducts = [] }: HeroCarouselProps) {
  const router = useRouter();
  const handleAddToCart = useCallback((product: HeroProduct) => {
    addToCart(product);
  }, [addToCart]);
  // Phase1.8: State for dynamic hero products and active slide index.
  const [heroProducts, setHeroProducts] = useState<HeroProduct[]>(initialProducts.slice(0, 3));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
  }, [heroProducts.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);
  }, [heroProducts.length]);

  const handleBuyNow = useCallback((product: HeroProduct) => {
    addToCart(product);
    router.push("/checkout");
  }, [addToCart, router]);

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

  // Phase1.8: Auto-scroll slides every 5 seconds with pause support.
  useEffect(() => {
    if (isPaused || heroProducts.length < 2 || prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [heroProducts.length, isPaused, prefersReducedMotion]);

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
    <div
      className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl aspect-[16/10] md:aspect-[21/8]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(event) => setTouchStart(event.targetTouches[0].clientX)}
      onTouchEnd={(event) => {
        if (touchStart === null) return;
        const diff = touchStart - event.changedTouches[0].clientX;
        if (diff > 50) nextSlide();
        if (diff < -50) prevSlide();
        setTouchStart(null);
      }}
    >
      {/* Phase1.8: Horizontal slide animation wrapper. */}
      <motion.div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        transition={{ type: "tween", duration: prefersReducedMotion ? 0 : 0.7, ease: "easeInOut" }}
      >
        {heroProducts.map((product) => (
          <div
            key={product.id}
            className="relative min-w-full overflow-hidden h-full"
          >
            <div className="h-full pointer-events-none">
              <img
                src={product.imageUrl || product.image || "/images/product-1.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />

            <div className="absolute inset-0 z-20 flex items-end md:items-center justify-center px-6 pb-10 md:pb-0">
              <div className="text-center text-white max-w-xl">
                <h2 className="text-2xl md:text-4xl font-medium tracking-wide">
                  {product.title || product.name}
                </h2>

                <p className="mt-3 text-sm md:text-base text-white/80">
                  {product.subtitle || ""}
                </p>

                <div className="mt-5 flex justify-center">
                  <div className="w-full max-w-xs">
                    <button
                      type="button"
                      className="btn-primary relative z-30 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      className="btn-secondary w-full mt-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyNow(product);
                      }}
                    >
                      Buy Now
                    </button>
                  </div>
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
