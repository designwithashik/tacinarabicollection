"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import clsx from "clsx";

import type { CarouselItem } from "@/lib/siteContent";

type HeroCarouselProps = {
  initialSlides?: CarouselItem[];
};

const SWIPE_THRESHOLD = 48;

export default function HeroCarousel({ initialSlides = [] }: HeroCarouselProps) {
  const [slides, setSlides] = useState<CarouselItem[]>(
    initialSlides.filter((item) => item.active !== false).sort((a, b) => a.order - b.order)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

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
    setCurrentIndex((prev) => {
      if (slides.length === 0) return 0;
      return prev % slides.length;
    });
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  if (slides.length === 0) {
    return null;
  }

  const goTo = (index: number) => {
    const safeIndex = ((index % slides.length) + slides.length) % slides.length;
    setCurrentIndex(safeIndex);
  };

  const goPrev = () => goTo(currentIndex - 1);
  const goNext = () => goTo(currentIndex + 1);

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const x = event.touches[0]?.clientX;
    touchStartX.current = typeof x === "number" ? x : null;
    touchCurrentX.current = touchStartX.current;
  };

  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const x = event.touches[0]?.clientX;
    if (typeof x === "number") {
      touchCurrentX.current = x;
    }
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchCurrentX.current === null) {
      touchStartX.current = null;
      touchCurrentX.current = null;
      return;
    }

    const delta = touchStartX.current - touchCurrentX.current;

    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      if (delta > 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex will-change-transform"
        style={{
          transform: `translate3d(-${currentIndex * 100}%, 0, 0)`,
          transition: "transform 900ms cubic-bezier(.22,1,.36,1)",
        }}
      >
        {slides.map((slide, index) => (
          <article
            key={slide.id}
            className={clsx(
              "relative w-full flex-shrink-0 aspect-[16/9] md:aspect-[21/9] overflow-hidden transition-transform duration-[900ms]",
              index === currentIndex ? "scale-100" : "scale-[0.985]"
            )}
          >
            <img
              src={slide.imageUrl || "/images/product-1.svg"}
              alt={slide.title || "Carousel slide"}
              className="absolute inset-0 h-full w-full object-cover brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

            <div className="absolute inset-0 z-20 flex items-center justify-center md:justify-start">
              <div className="flex flex-col gap-4 max-w-xl px-6 md:px-16 text-center md:text-left text-white">
                <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-white/80">Featured Collection</p>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">{slide.title}</h2>
                <p className="text-base md:text-lg opacity-90">{slide.subtitle}</p>
                <div>
                  <a
                    className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-white text-black font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
                    href={slide.buttonLink || "/"}
                  >
                    {slide.buttonText || "Shop Now"}
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            className="absolute top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-110 left-3"
            onClick={goPrev}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="absolute top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-110 right-3"
            onClick={goNext}
          >
            ›
          </button>
        </>
      ) : null}

      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={`dot-${slide.id}`}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            className={clsx(
              "transition-all duration-300 rounded-full",
              index === currentIndex ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/50"
            )}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </div>
  );
}
