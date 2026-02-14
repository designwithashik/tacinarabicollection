"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  initialProducts?: HeroProduct[];
};

export default function HeroCarousel({ addToCart, initialProducts = [] }: HeroCarouselProps) {
  const router = useRouter();
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

  const handleAddToCart = useCallback(
    (product: HeroProduct) => {
      addToCart(product);
    },
    [addToCart]
  );

  const handleBuyNow = useCallback(
    (product: HeroProduct) => {
      if (!product) return;

      let defaultSize: string | null = null;
      if (product.sizes && product.sizes.length > 0) {
        defaultSize = product.sizes.includes("M") ? "M" : product.sizes[0];
      }

      addToCart(product, defaultSize);
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
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((product, index) => (
          <div key={product.id} className="relative min-w-full h-full overflow-hidden">
            <Image
              src={product.imageUrl || product.image || "/images/product-1.svg"}
              alt={product.title || product.name}
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />

            <div className="absolute inset-0 z-20 flex items-end md:items-center justify-center px-6 pb-8 md:pb-0">
              <div className="text-center text-white max-w-xl">
                <h2 className="text-2xl md:text-4xl font-medium tracking-wide">
                  {product.title || product.name}
                </h2>
                <p className="mt-3 text-sm md:text-base text-white/90">
                  {product.subtitle || ""}
                </p>

                <div className="mt-5 flex justify-center">
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
                      className="w-full mt-3 border border-white text-white bg-white/15 backdrop-blur-sm hover:bg-white hover:text-[var(--brand-primary)] transition-all duration-300 py-2 rounded-lg font-medium"
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

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 z-30">
        {slides.map((product, index) => (
          <button
            key={`dot-${product.id}`}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            className={clsx(
              "h-2.5 w-2.5 rounded-full transition-opacity duration-300",
              index === currentSlide
                ? "bg-[var(--brand-primary)]/80"
                : "bg-white/50 hover:opacity-100 opacity-70"
            )}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
