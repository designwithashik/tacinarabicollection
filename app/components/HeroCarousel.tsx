"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

import type { CarouselItem } from "@/lib/siteContent";

type HeroCarouselProps = {
  initialSlides?: CarouselItem[];
};

export default function HeroCarousel({ initialSlides = [] }: HeroCarouselProps) {
  const [slides, setSlides] = useState<CarouselItem[]>(
    initialSlides.filter((item) => item.active !== false).sort((a, b) => a.order - b.order)
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const res = await fetch("/api/content/carousel", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as CarouselItem[];
        if (Array.isArray(data)) {
          setSlides(data.filter((item) => item.active !== false).sort((a, b) => a.order - b.order));
        }
      } catch {
        setSlides([]);
      }
    };

    void loadSlides();
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    setCurrentIndex((prev) => {
      if (slides.length === 0) return 0;
      return prev % slides.length;
    });
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative overflow-hidden w-full">
      <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-2xl md:rounded-3xl">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="w-full flex-shrink-0 relative">
              <img
                src={slide.imageUrl || "/images/product-1.svg"}
                alt={slide.title || "Carousel slide"}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

              <div className="absolute inset-0 z-20 flex items-end justify-center px-6 pb-10 md:items-center md:pb-0">
                <div className="max-w-xl text-center text-white">
                  <h2 className="text-2xl font-medium tracking-wide md:text-4xl">{slide.title}</h2>

                  <p className="mt-3 text-sm text-white/80 md:text-base">{slide.subtitle}</p>

                  <div className="mt-5 flex justify-center">
                    <a
                      className="btn-primary relative z-30 inline-flex items-center justify-center"
                      href={slide.buttonLink || "/"}
                    >
                      {slide.buttonText || "Shop Now"}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
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

      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => (
          <button
            key={`dot-${slide.id}`}
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
