"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

import type { FilterPanelItem, CarouselItem } from "@/lib/siteContent";

type HeroCarouselProps = {
  initialSlides?: CarouselItem[];
};

type CarouselProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  imageUrl?: string | null;
  category?: string;
  description?: string;
};

const SWIPE_THRESHOLD = 48;

const toActiveSlides = (items: CarouselItem[]) =>
  items.filter((item) => item.active !== false).sort((a, b) => a.order - b.order);

const toActiveFilters = (items: FilterPanelItem[]) =>
  items
    .filter((item) => item.active !== false)
    .sort((a, b) => a.order - b.order)
    .filter((item) => item.showOnLanding !== false);

const matchesFilter = (product: CarouselProduct, value: string) => {
  const normalizedFilter = value.trim().toLowerCase();
  if (!normalizedFilter || normalizedFilter === "all") return true;

  const category = String(product.category ?? "").toLowerCase();
  const name = product.name.toLowerCase();
  return category.includes(normalizedFilter) || name.includes(normalizedFilter);
};

export default function HeroCarousel({ initialSlides = [] }: HeroCarouselProps) {
  const [slides, setSlides] = useState<CarouselItem[]>(toActiveSlides(initialSlides));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [heroProducts, setHeroProducts] = useState<CarouselProduct[]>([]);
  const [filters, setFilters] = useState<FilterPanelItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");

  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const res = await fetch("/api/content/carousel", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as CarouselItem[];
        if (Array.isArray(data)) {
          setSlides(toActiveSlides(data));
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

  useEffect(() => {
    if (!isProductModalOpen || heroProducts.length > 0 || isLoadingProducts) return;

    const loadModalData = async () => {
      try {
        setIsLoadingProducts(true);

        const [productsRes, filtersRes] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/content/filters", { cache: "no-store" }),
        ]);

        if (productsRes.ok) {
          const productData = (await productsRes.json()) as CarouselProduct[];
          if (Array.isArray(productData)) {
            setHeroProducts(productData);
          }
        }

        if (filtersRes.ok) {
          const filterData = (await filtersRes.json()) as FilterPanelItem[];
          if (Array.isArray(filterData)) {
            const activeFilters = toActiveFilters(filterData);
            const hasAll = activeFilters.some(
              (item) => item.value.trim().toLowerCase() === "all",
            );
            setFilters(
              hasAll
                ? activeFilters
                : [
                    {
                      id: "all",
                      label: "All",
                      value: "All",
                      active: true,
                      highlight: true,
                      showOnLanding: true,
                      order: 0,
                    },
                    ...activeFilters,
                  ],
            );
          }
        }
      } catch {
        setHeroProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    void loadModalData();
  }, [heroProducts.length, isLoadingProducts, isProductModalOpen]);

  useEffect(() => {
    if (!isProductModalOpen) return;

    const onEsc = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProductModalOpen(false);
      }
    };

    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isProductModalOpen]);

  const visibleProducts = useMemo(
    () => heroProducts.filter((product) => matchesFilter(product, selectedFilter)),
    [heroProducts, selectedFilter],
  );

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
    <>
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
              <div className="absolute inset-0 bg-gradient-to-r from-white/75 via-white/50 to-white/30" />

              <div className="absolute inset-0 z-20 flex items-center justify-center md:justify-start">
                <div className="flex max-w-[min(90vw,44rem)] flex-col gap-3 px-5 text-center text-black sm:gap-4 sm:px-6 md:px-16 md:text-left">
                  <p className="text-[clamp(0.58rem,1.2vw,0.8rem)] font-medium uppercase tracking-[0.2em] text-black/90">
                    Featured Collection
                  </p>
                  <h2 className="text-[clamp(1.3rem,5vw,3.25rem)] font-bold leading-[1.1] tracking-tight text-black">
                    {slide.title}
                  </h2>
                  <p className="max-w-[44ch] text-[clamp(0.82rem,1.9vw,1.1rem)] leading-[1.45] text-black/85 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                    {slide.subtitle}
                  </p>
                  <div>
                    <button
                      type="button"
                      className="interactive-feedback inline-flex min-h-11 items-center justify-center rounded-full border border-black bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-black hover:text-white hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98] sm:min-h-12 sm:px-7 sm:py-3 sm:text-base"
                      onClick={() => setIsProductModalOpen(true)}
                    >
                      {slide.buttonText || "Shop Now"}
                    </button>
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
              className="absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1/2 hover:scale-105 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
              onClick={goPrev}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next slide"
              className="absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1/2 hover:scale-105 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
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
                "rounded-full border border-white/30 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/55",
                index === currentIndex
                  ? "h-2.5 w-8 bg-white shadow"
                  : "h-2.5 w-2.5 bg-white/70 hover:scale-110 hover:bg-white",
              )}
              onClick={() => goTo(index)}
            />
          ))}
        </div>

        <p className="sr-only" aria-live="polite">
          Slide {currentIndex + 1} of {slides.length}
        </p>
      </div>

      {isProductModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 p-3 backdrop-blur-[1px] sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Featured products"
          onClick={() => setIsProductModalOpen(false)}
        >
          <div
            className="w-full rounded-2xl bg-white shadow-2xl sm:mx-auto sm:max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-4 py-3 sm:px-6 sm:py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/55">Quick Shop</p>
                <h3 className="text-lg font-semibold text-black sm:text-xl">Browse all products</h3>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/20 text-black transition hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                onClick={() => setIsProductModalOpen(false)}
                aria-label="Close quick shop"
              >
                ✕
              </button>
              <div className="w-full overflow-x-auto pt-1 [scrollbar-width:thin]">
                <div className="flex min-w-max items-center gap-2">
                  {(filters.length ? filters : [{
                    id: "all",
                    label: "All",
                    value: "All",
                    active: true,
                    highlight: true,
                    showOnLanding: true,
                    order: 0,
                  }]).map((filter) => {
                    const isActive = selectedFilter.toLowerCase() === filter.value.toLowerCase();
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setSelectedFilter(filter.value)}
                        className={clsx(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                          isActive
                            ? "border-black bg-black text-white"
                            : "border-black/20 bg-white text-black hover:border-black/35 hover:bg-black/5",
                        )}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-4 sm:p-6">
              {isLoadingProducts ? (
                <p className="text-sm text-black/70">Loading products…</p>
              ) : visibleProducts.length === 0 ? (
                <p className="text-sm text-black/70">No products available for this filter.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleProducts.map((product) => (
                    <article
                      key={product.id}
                      className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm"
                    >
                      <div className="relative aspect-[4/5] w-full bg-black/5">
                        <Image
                          src={product.imageUrl || product.image || "/images/product-1.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 20vw"
                        />
                      </div>
                      <div className="space-y-2 bg-white p-3 sm:p-3.5">
                        <p className="line-clamp-2 text-sm font-bold leading-snug text-black sm:text-base">{product.name}</p>
                        <p className="line-clamp-2 text-xs leading-relaxed text-black/75">
                          {product.description?.trim() || "No description yet."}
                        </p>
                        <p className="text-xs font-semibold text-black sm:text-sm">৳{product.price.toLocaleString("en-BD")}</p>
                        <Link
                          href={`/products/${product.id}`}
                          className="inline-flex min-h-9 w-full items-center justify-center rounded-lg border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:text-sm"
                          onClick={() => setIsProductModalOpen(false)}
                        >
                          View product
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
