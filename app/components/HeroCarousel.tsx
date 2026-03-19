"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import Image from "next/image";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { CarouselItem } from "@/lib/siteContent";

type HeroCarouselProps = {
  initialSlides?: CarouselItem[];
};

const SWIPE_THRESHOLD = 48;
const AUTOPLAY_MS = 7000;

const overlayMap = {
  light: "from-black/48 via-black/18 to-black/10",
  medium: "from-black/68 via-black/30 to-black/14",
  strong: "from-black/82 via-black/42 to-black/20",
} as const;

const textAlignMap = {
  left: {
    container: "items-start text-left",
    layout: "justify-center md:justify-start",
    cta: "justify-start",
  },
  center: {
    container: "items-center text-center",
    layout: "justify-center",
    cta: "justify-center",
  },
  right: {
    container: "items-end text-right",
    layout: "justify-center md:justify-end",
    cta: "justify-end",
  },
} as const;

const progressTransition = {
  duration: AUTOPLAY_MS / 1000,
  ease: [0.22, 1, 0.36, 1] as const,
};

const contentTransition = {
  duration: 0.95,
  ease: [0.22, 1, 0.36, 1] as const,
};

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
  const shouldReduceMotion = useReducedMotion();

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

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(interval);
  }, [slides.length, isPaused]);

  const slide = slides[currentIndex];

  const activeChips = useMemo(
    () => slide?.metadataChips?.map((chip) => chip.trim()).filter(Boolean) ?? [],
    [slide?.metadataChips],
  );

  if (slides.length === 0 || !slide) {
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

  const overlayIntensity = slide.overlayIntensity ?? "medium";
  const textAlign = slide.textAlign ?? "left";
  const alignmentClasses = textAlignMap[textAlign];
  const hasSecondaryCta = Boolean(slide.secondaryButtonText?.trim() && slide.secondaryButtonLink?.trim());

  return (
    <div
      className="relative w-full overflow-hidden rounded-[1.75rem]"
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
      <div className="relative aspect-[16/10] min-h-[420px] overflow-hidden bg-neutral-950 md:aspect-[21/9] md:min-h-[560px]">
        <AnimatePresence mode="wait">
          <motion.article
            key={slide.id}
            className="absolute inset-0"
            aria-hidden={false}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0.35, scale: 1.015 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0.2, scale: 0.992 }}
            transition={contentTransition}
          >
            <motion.div
              className="absolute inset-0"
              animate={
                shouldReduceMotion
                  ? { scale: 1, x: 0, y: 0 }
                  : { scale: 1.08, x: textAlign === "right" ? -18 : textAlign === "center" ? 0 : 18, y: -10 }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: AUTOPLAY_MS / 1000 + 1.5, ease: [0.22, 1, 0.36, 1] }
              }
            >
              <Image
                src={slide.imageUrl || "/images/product-1.svg"}
                alt={slide.title || "Carousel slide"}
                fill
                priority={currentIndex === 0}
                className="absolute inset-0 h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 1400px"
              />
            </motion.div>

            <div
              className={clsx(
                "absolute inset-0 bg-gradient-to-r",
                overlayMap[overlayIntensity],
              )}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_38%)]" />

            <div
              className={clsx(
                "absolute inset-0 z-20 flex px-4 py-6 sm:px-6 sm:py-8 md:px-12 lg:px-16",
                alignmentClasses.layout,
              )}
            >
              <div
                className={clsx(
                  "flex max-w-2xl flex-col gap-4 self-center text-white md:gap-5",
                  alignmentClasses.container,
                )}
              >
                {slide.campaignLabel ? (
                  <motion.span
                    className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-white/90 backdrop-blur-md"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ ...contentTransition, delay: 0.08 }}
                  >
                    {slide.campaignLabel}
                  </motion.span>
                ) : null}

                <motion.h2
                  className="max-w-[14ch] text-[clamp(1.95rem,5.2vw,4.85rem)] font-semibold leading-[0.96] tracking-[-0.03em] text-balance"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ ...contentTransition, delay: 0.14 }}
                >
                  {slide.title}
                </motion.h2>

                <motion.p
                  className="max-w-[52ch] text-[clamp(0.95rem,2vw,1.15rem)] leading-relaxed text-white/84"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ ...contentTransition, delay: 0.22 }}
                >
                  {slide.subtitle}
                </motion.p>

                {activeChips.length ? (
                  <motion.div
                    className={clsx("flex flex-wrap gap-2", alignmentClasses.cta)}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ ...contentTransition, delay: 0.3 }}
                  >
                    {activeChips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-white/16 bg-black/20 px-3 py-1.5 text-xs font-medium text-white/86 backdrop-blur-sm"
                      >
                        {chip}
                      </span>
                    ))}
                  </motion.div>
                ) : null}

                <motion.div
                  className={clsx("flex flex-wrap gap-3 pt-1", alignmentClasses.cta)}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ ...contentTransition, delay: 0.38 }}
                >
                  <a
                    className="interactive-feedback inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-black shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_28px_60px_rgba(0,0,0,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                    href={slide.buttonLink || "/"}
                  >
                    {slide.buttonText || "Shop Collection"}
                  </a>

                  {hasSecondaryCta ? (
                    <a
                      className="interactive-feedback inline-flex min-h-12 items-center justify-center rounded-full border border-white/28 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-500 hover:-translate-y-0.5 hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                      href={slide.secondaryButtonLink}
                    >
                      {slide.secondaryButtonText}
                    </a>
                  ) : null}
                </motion.div>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-black/20 text-white backdrop-blur-md transition-all duration-500 hover:scale-105 hover:bg-black/32 sm:flex md:h-11 md:w-11"
            onClick={goPrev}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-black/20 text-white backdrop-blur-md transition-all duration-500 hover:scale-105 hover:bg-black/32 sm:flex md:h-11 md:w-11"
            onClick={goNext}
          >
            ›
          </button>
        </>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/45 to-transparent px-4 pb-4 pt-12 sm:px-6 md:px-10 md:pb-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/62">
              Featured story
            </p>
            <p className="mt-1 text-sm text-white/84">
              {String(currentIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </p>
          </div>

          <div className="flex w-full max-w-2xl gap-2" aria-label="Slide progress">
            {slides.map((item, index) => {
              const isActive = index === currentIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={isActive}
                  className="group flex min-w-0 flex-1 flex-col gap-2 text-left"
                >
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/18">
                    <motion.div
                      key={`${item.id}-${isActive ? currentIndex : "idle"}`}
                      className={clsx(
                        "h-full rounded-full",
                        isActive ? "bg-white" : "bg-white/45",
                      )}
                      initial={shouldReduceMotion ? false : { width: isActive ? "0%" : "100%" }}
                      animate={{ width: isActive ? "100%" : "28%" }}
                      transition={isActive && !isPaused && !shouldReduceMotion ? progressTransition : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span
                    className={clsx(
                      "truncate text-xs transition-colors duration-300",
                      isActive ? "text-white" : "text-white/58 group-hover:text-white/80",
                    )}
                  >
                    {item.campaignLabel || item.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Slide {currentIndex + 1} of {slides.length}
      </p>
    </div>
  );
}
