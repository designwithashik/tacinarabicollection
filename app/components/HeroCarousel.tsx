"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

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
      className="relative w-full h-[38vh] sm:h-[45vh] md:h-[55vh] overflow-hidden"
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

            <div className="absolute inset-0 bg-black/25" />

            <div className="absolute inset-0 flex flex-col justify-center px-5 md:px-12">
              <div className="max-w-xl text-white">
                <h2 className="text-[22px] sm:text-3xl md:text-4xl font-semibold leading-tight">
                  {product.title || product.name}
                </h2>
                <p className="mt-2 text-[14px] opacity-90 md:text-base">{product.subtitle || ""}</p>

                <button
                  type="button"
                  className="mt-4 rounded-lg bg-black px-6 py-2.5 text-[14px] text-white hover:opacity-90"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleAddToCart(product);
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
