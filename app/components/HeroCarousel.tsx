"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import Image from "next/image";
import clsx from "clsx";

import type { CarouselItem } from "@/lib/siteContent";

type HeroCarouselProps = {
  initialSlides?: CarouselItem[];
};

const SWIPE_THRESHOLD = 48;

export default function HeroCarousel({ initialSlides = [] }: HeroCarouselProps) {
  const [slides, setSlides] = useState<CarouselItem[]>(
    initialSlides
      .filter((item) => item.active !== false)
      .sort((a, b) => a.order - b.order),
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
          setSlides(
            data
              .filter((item) => item.active !== false)
              .sort((a, b) => a.order - b.order),
          );
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

  const onCarouselKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onKeyDown={onCarouselKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured collection"
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
              "relative w-full flex-shrink-0 aspect-[16/9] overflow-hidden md:aspect-[21/9] transition-transform duration-[900ms]",
              index === currentIndex ? "scale-100" : "scale-[0.985]",
            )}
            aria-hidden={index !== currentIndex}
          >
            <Image
              src={slide.imageUrl || "/images/product-1.svg"}
              alt={slide.title || "Carousel slide"}
              fill
              priority={index === 0}
              className="absolute inset-0 h-full w-full object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/35 to-white/20" />

            <div className="absolute inset-0 z-20 flex items-center justify-center md:justify-start">
              <div className="flex max-w-xl flex-col gap-4 px-6 text-center text-black md:px-16 md:text-left">
                <p className="text-[clamp(0.62rem,1.9vw,0.8rem)] uppercase tracking-[0.2em] text-black">
                  Featured Collection
                </p>
                <h2 className="line-clamp-3 break-words text-[clamp(1.1rem,5.8vw,3rem)] font-bold leading-[1.1]">
                  {slide.title}
                </h2>
                <p className="line-clamp-3 text-[clamp(0.82rem,3.3vw,1.125rem)] text-black md:line-clamp-none">
                  {slide.subtitle}
                </p>
                <div>
                  <a
                    className="interactive-feedback inline-flex items-center justify-center rounded-full bg-white px-7 py-3 font-semibold text-black shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
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
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/50"
            onClick={goPrev}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/50"
            onClick={goNext}
          >
            ›
          </button>
        </>
      ) : null}

      <div
        className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2"
        aria-label="Slide navigation"
      >
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentIndex}
            className={clsx(
              "h-2.5 rounded-full transition-all duration-300",
              index === currentIndex
                ? "w-8 bg-white shadow"
                : "w-2.5 bg-white/60 hover:bg-white/90",
            )}
            onClick={() => goTo(index)}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Slide {currentIndex + 1} of {slides.length}
      </p>
    </div>
  );
}
