"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export type HeroProduct = {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string | null;
  price?: number;
  description?: string;
  heroTitle?: string;
  heroSubtitle?: string;
};

type HeroCarouselProps = {
  addToCart: (product: HeroProduct) => void;
  initialProducts?: HeroProduct[];
};

export default function HeroCarousel({ addToCart, initialProducts = [] }: HeroCarouselProps) {
  const router = useRouter();
  const [heroProducts, setHeroProducts] = useState<HeroProduct[]>(initialProducts.slice(0, 3));
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroProducts.length);
  }, [heroProducts.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);
  }, [heroProducts.length]);

  const handleAddToCart = useCallback(
    (product: HeroProduct) => {
      addToCart(product);
    },
    [addToCart]
  );

  const handleBuyNow = useCallback(
    (product: HeroProduct) => {
      addToCart(product);
      router.push("/checkout");
    },
    [addToCart, router]
  );

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
    if (heroProducts.length < 2 || isPaused) return;
    const interval = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroProducts.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isPaused, heroProducts.length]);

  useEffect(() => {
    setCurrentSlide((prev) => {
      if (heroProducts.length === 0) return 0;
      return prev % heroProducts.length;
    });
  }, [heroProducts.length]);

  if (heroProducts.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl aspect-[16/10] md:aspect-[21/8]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart === null) return;
        const diff = touchStart - e.changedTouches[0].clientX;
        if (diff > 50) nextSlide();
        if (diff < -50) prevSlide();
        setTouchStart(null);
      }}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {heroProducts.map((slide) => (
          <div key={slide.id} className="relative min-w-full h-full overflow-hidden">
            <img
              src={slide.imageUrl || slide.image || "/images/product-1.svg"}
              alt={slide.heroTitle || slide.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

            <div className="absolute inset-0 z-20 flex items-end md:items-center justify-center px-6 pb-10 md:pb-0">
              <div className="text-center text-white max-w-xl">
                <h2 className="text-2xl md:text-4xl font-medium tracking-wide">
                  {slide.heroTitle || slide.name}
                </h2>

                <p className="mt-3 text-sm md:text-base text-white/80">
                  {slide.heroSubtitle || slide.description || ""}
                </p>

                <div className="mt-5 flex flex-col justify-center">
                  <button
                    type="button"
                    className="btn-primary relative z-30"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(slide);
                    }}
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    className="btn-secondary w-full mt-3 relative z-30"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuyNow(slide);
                    }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {heroProducts.map((product, index) => (
          <button
            key={`dot-${product.id}`}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            className={clsx(
              "h-2.5 w-2.5 rounded-full transition-opacity duration-300",
              index === currentSlide
                ? "bg-[var(--brand-primary)]/70"
                : "bg-[var(--brand-secondary)]/35 hover:opacity-100 opacity-60"
            )}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
