"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";

export type HeroProduct = {
  id: string;
  name: string;
  title?: string;
  subtitle?: string;
  image?: string;
  imageUrl?: string | null;
  price?: number;
  sizes?: string[];
};

type HeroCarouselProps = {
  addToCart: (product: HeroProduct, sizeOverride?: string | null) => void;
  buyNow: (product: HeroProduct, sizeOverride?: string | null) => void;
  initialProducts?: HeroProduct[];
};

export default function HeroCarousel({ addToCart, buyNow, initialProducts = [] }: HeroCarouselProps) {
  const [heroProducts, setHeroProducts] = useState<HeroProduct[]>(initialProducts.slice(0, 3));
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const slides = useMemo(() => heroProducts.slice(0, 3), [heroProducts]);

  const nextSlide = useCallback(() => {
    if (slides.length < 2) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length < 2) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const getDefaultSize = useCallback((product: HeroProduct) => {
    if (!product.sizes?.length) return null;
    return product.sizes.includes("M") ? "M" : product.sizes[0];
  }, []);

  const handleBuyNow = useCallback(
    (product: HeroProduct) => {
      if (!product) return;
      buyNow(product, getDefaultSize(product));
    },
    [buyNow, getDefaultSize]
  );

  const handleAddToCart = useCallback(
    (product: HeroProduct) => {
      if (!product) return;
      addToCart(product, getDefaultSize(product));
    },
    [addToCart, getDefaultSize]
  );

  useEffect(() => {
    const loadHeroProducts = async () => {
      try {
        const res = await fetch("/api/products?hero=true", { cache: "default" });
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
    setCurrentSlide((prev) => {
      if (slides.length === 0) return 0;
      return prev % slides.length;
    });
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length < 2) return;

    const interval = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isPaused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative w-full h-[38vh] sm:h-[45vh] md:h-[55vh] overflow-hidden rounded-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(event) => {
        setIsPaused(true);
        setTouchStart(event.targetTouches[0].clientX);
      }}
      onTouchEnd={(event) => {
        if (touchStart === null) {
          setIsPaused(false);
          return;
        }
        const diff = touchStart - event.changedTouches[0].clientX;
        if (diff > 40) nextSlide();
        if (diff < -40) prevSlide();
        setTouchStart(null);
        setIsPaused(false);
      }}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((product, index) => (
          <div key={product.id} className="relative h-full min-w-full overflow-hidden">
            <Image
              src={product.imageUrl || product.image || "/images/product-1.svg"}
              alt={product.title || product.name}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />

            <div className="absolute inset-0 z-20 flex items-end justify-center px-6 pb-8 md:items-center md:pb-0">
              <div className="max-w-xl space-y-3 text-center text-white">
                <h2 className="text-[22px] leading-tight font-medium tracking-wide md:text-4xl">
                  {product.title || product.name}
                </h2>
                <div className="mx-auto mt-3 h-[2px] w-10 bg-[var(--brand-accent)]" />
                <p className="text-[13px] text-white/90 md:text-[14px]">{product.subtitle || ""}</p>

                <div className="flex justify-center">
                  <div className="w-full max-w-xs">
                    <button
                      type="button"
                      className="btn-primary relative z-30 w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full rounded-lg border border-white bg-white/15 py-1.5 font-medium text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-[var(--brand-primary)]"
                      onClick={(event) => {
                        event.stopPropagation();
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
      </div>

      <button
        type="button"
        aria-label="Previous slide"
        onClick={prevSlide}
        className="absolute left-3 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/55 md:flex"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={nextSlide}
        className="absolute right-3 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/55 md:flex"
      >
        ›
      </button>

      <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {slides.map((product, index) => (
          <button
            key={`dot-${product.id}`}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            className={clsx(
              "h-2.5 w-2.5 rounded-full transition-opacity duration-300",
              index === currentSlide
                ? "bg-[var(--brand-primary)]/80"
                : "bg-white/50 opacity-70 hover:opacity-100"
            )}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
