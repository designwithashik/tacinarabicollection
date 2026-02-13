"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import clsx from "clsx";
import ProductCard from "../components/ProductCard";
import Toast from "../components/Toast";
import SkeletonCard from "../components/ui/SkeletonCard";
import SectionLoader from "../components/SectionLoader";
import CartSkeleton from "../components/CartSkeleton";
import SummaryPlaceholder from "../components/SummaryPlaceholder";
import { AnimatedWrapper } from "../components/AnimatedWrapper";
import HeroCarousel, { type HeroProduct } from "./components/HeroCarousel";
import LanguageToggle from "./components/LanguageToggle";
import FilterDrawer, { type DrawerTab } from "../components/ui/FilterDrawer";
import { SlidersHorizontal } from "lucide-react";
import type { Product } from "../lib/products";
import type { CartItem } from "../lib/cart";
import {
  getSafeCartSubtotal,
  normalizeCartItem,
} from "../lib/cart";
import type { CustomerInfo } from "../lib/orders";
import { addOrder } from "../lib/orders";
import { buildWhatsAppMessage } from "../lib/whatsapp";
import type { AdminProduct } from "../lib/inventory";
import useCart from "../hooks/useCart";

// Contact numbers
const whatsappNumber = "+8801522119189";
const paymentNumber = "+8801701019292";

// Filter presets
const priceRanges = [
  { id: "under-500", label: "Under ৳500" },
  { id: "500-800", label: "৳500 - ৳800" },
  { id: "800-plus", label: "৳800+" },
];

const sortOptions = [
  { id: "newest", label: "Newest" },
  { id: "low-high", label: "Price Low-High" },
  { id: "high-low", label: "Price High-Low" },
];

const categories: CategoryFilter[] = ["All", "Clothing", "Ceramic"];

// Delivery fees by zone (BDT)
const deliveryFees = {
  inside: 60,
  outside: 120,
};

type Filters = {
  size: string[];
  colors: string[];
  price: string | null;
  sort: string | null;
};

type CategoryFilter = "All" | AdminProduct["category"];

type AddState = "idle" | "loading" | "success";

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
  onRetry?: () => void;
};

type Language = "en" | "bn";

const defaultFilters: Filters = {
  size: [],
  colors: [],
  price: null,
  sort: "newest",
};

// Local storage keys
const storageKeys = {
  viewed: "tacin-recently-viewed",
  language: "tacin-lang",
};

const statusLabels = ["New", "Hot", "Limited"] as const;

const INVENTORY_UPDATED_STORAGE_KEY = "tacin:inventory-updated-at";
const INVENTORY_UPDATED_EVENTS = ["tacin:inventory-updated", "product-added", "product-deleted"] as const;

const normalizeInventoryResponse = (payload: unknown): AdminProduct[] => {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is AdminProduct => Boolean(item && typeof item === "object")
    );
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;

    if ("id" in objectPayload) {
      return [objectPayload as AdminProduct];
    }

    return Object.values(objectPayload).filter(
      (item): item is AdminProduct => Boolean(item && typeof item === "object")
    );
  }

  return [];
};

// Minimal EN/BN labels used for critical UI only
const copy = {
  en: {
    buyNow: "Buy Now",
    addToCart: "Add to Cart",
    adding: "Adding...",
    added: "Added",
    checkout: "Checkout",
    orderCod: "Order via WhatsApp (COD)",
    payNow: "Pay Now (bKash / Nagad)",
    confirmWhatsapp: "Confirm & Send on WhatsApp",
    applyFilters: "Apply Filters",
    clear: "Clear",
    priceLabel: "Price",
    subtotal: "Subtotal",
    deliveryCharge: "Delivery Charge",
    totalPayable: "Total Payable",
    deliveryZone: "Delivery Zone",
    insideDhaka: "Inside Dhaka",
    outsideDhaka: "Outside Dhaka",
  },
  bn: {
    buyNow: "এখনই কিনুন",
    addToCart: "কার্টে যোগ করুন",
    adding: "যোগ হচ্ছে...",
    added: "যোগ হয়েছে",
    checkout: "চেকআউট",
    orderCod: "হোয়াটসঅ্যাপে অর্ডার (COD)",
    payNow: "পে নাও (বিকাশ / নগদ)",
    confirmWhatsapp: "নিশ্চিত করে হোয়াটসঅ্যাপে পাঠান",
    applyFilters: "ফিল্টার প্রয়োগ করুন",
    clear: "পরিষ্কার করুন",
    priceLabel: "দাম",
    subtotal: "পণ্যের মূল্য",
    deliveryCharge: "ডেলিভারি চার্জ",
    totalPayable: "মোট পরিশোধ",
    deliveryZone: "ডেলিভারি এরিয়া",
    insideDhaka: "ঢাকার ভিতরে",
    outsideDhaka: "ঢাকার বাইরে",
  },
};

const qtyUpdatedMessage = "Qty updated";
const formatPrice = (price: number) => `৳${price.toLocaleString("en-BD")}`;

const getStatusLabel = (index: number) =>
  statusLabels[index % statusLabels.length];
const getStockLabel = (index: number) =>
  index % 3 === 2 ? "Limited stock" : "In stock";

type HomeClientProps = {
  initialAdminProducts?: AdminProduct[];
};

export default function HomePage({
  initialAdminProducts = [],
}: HomeClientProps) {
  // ------------------------------
  // State
  // ------------------------------
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { cartItems, setCartItems, isCartHydrating, clearCart } = useCart();
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<Filters>(defaultFilters);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [activeSheet, setActiveSheet] = useState<DrawerTab | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<"inside" | "outside">("inside");
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: "",
  });
  const [addStates, setAddStates] = useState<Record<string, AddState>>({});
  const [quantityFeedback, setQuantityFeedback] = useState<Record<string, string>>({});
  const [cartQuantityFeedback, setCartQuantityFeedback] = useState<Record<number, string>>({});
  const [language, setLanguage] = useState<Language>("en");
  const [cartBump, setCartBump] = useState(false);
  const prevCartCount = useRef(cartItems.length);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>(initialAdminProducts);
  const [cartActionLoading, setCartActionLoading] = useState<Record<number, boolean>>({});
  const cartHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const checkoutHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast);
  };

  const text = copy[language];

  // Lightweight analytics hook (optional dataLayer)
  const logEvent = (eventName: string, payload: Record<string, unknown>) => {
    if (typeof window === "undefined") return;
    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
    if (Array.isArray(dataLayer)) {
      dataLayer.push({ event: eventName, ...payload });
    }
  };

  // Initial hydration: storage, language, inventory
  useEffect(() => {
    setHasMounted(true);

    const storedViewed = localStorage.getItem(storageKeys.viewed);
    const storedLanguage = localStorage.getItem(storageKeys.language) as Language | null;

    if (storedViewed) {
      try {
        setRecentlyViewed(JSON.parse(storedViewed));
      } catch {
        setRecentlyViewed([]);
      }
    }

    if (storedLanguage === "en" || storedLanguage === "bn") {
      setLanguage(storedLanguage);
    }
  }, []);

  const loadPublicInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/products", {
        cache: "no-store",
        next: { revalidate: 0 },
      });
      if (!res.ok) return;
      const data = (await res.json()) as unknown;
      const shaped = Array.isArray(data) ? data.flat() : (data ? [data] : []);
      setAdminProducts(normalizeInventoryResponse(shaped));
    } catch {
      // Keep existing state if live inventory fetch fails.
      setAdminProducts((current) => current);
    }
  }, []);

  useEffect(() => {
    void loadPublicInventory();
  }, [loadPublicInventory]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void loadPublicInventory();
      }
    };

    const onInventoryUpdated = () => {
      void loadPublicInventory();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === INVENTORY_UPDATED_STORAGE_KEY) {
        void loadPublicInventory();
      }
    };

    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    INVENTORY_UPDATED_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, onInventoryUpdated);
    });
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      INVENTORY_UPDATED_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, onInventoryUpdated);
      });
      window.removeEventListener("storage", onStorage);
    };
  }, [loadPublicInventory]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReducedMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!showCart && !showCheckout && !showPaymentInfo) return;

    const scrollY = window.scrollY;
    const previousBodyStyle = document.body.style.cssText;
    // Keep page position stable while bottom sheets are open.
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      document.body.style.cssText = previousBodyStyle;
      window.scrollTo(0, scrollY);
    };
  }, [showCart, showCheckout, showPaymentInfo]);

  useEffect(() => {
    if (showCart) {
      cartHeadingRef.current?.focus();
    }
  }, [showCart]);

  useEffect(() => {
    if (showCheckout) {
      checkoutHeadingRef.current?.focus();
    }
  }, [showCheckout]);


  // Persist recently viewed
  useEffect(() => {
    localStorage.setItem(storageKeys.viewed, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Persist language toggle
  useEffect(() => {
    localStorage.setItem(storageKeys.language, language);
  }, [language]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Online/offline state
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Skeleton shimmer delay
  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 220);
    return () => window.clearTimeout(timer);
  }, []);

  // Cart bump animation
  useEffect(() => {
    if (cartItems.length > prevCartCount.current) {
      setCartBump(true);
      const timer = window.setTimeout(() => setCartBump(false), 450);
      return () => window.clearTimeout(timer);
    }
    prevCartCount.current = cartItems.length;
  }, [cartItems.length]);

  // ------------------------------
  // Actions
  // ------------------------------
  const updateSize = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    // Clamp to keep quantity math deterministic and avoid invalid checkout totals.
    const safeQuantity = Math.max(1, Math.floor(quantity || 1));
    setQuantities((prev) => ({ ...prev, [productId]: safeQuantity }));
    setQuantityFeedback((prev) => ({ ...prev, [productId]: qtyUpdatedMessage }));
    window.setTimeout(() => {
      setQuantityFeedback((prev) => ({ ...prev, [productId]: "" }));
    }, 1000);
  };

  const markRecentlyViewed = (product: Product) => {
    setRecentlyViewed((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const updated = existing
        ? [product, ...prev.filter((item) => item.id !== product.id)]
        : [product, ...prev];
      return updated.slice(0, 2);
    });
  };

  const buildNormalizedCartItem = (product: Product, selectedSize: string, quantity: number) =>
    normalizeCartItem({
      id: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: product.colors[0] ?? "",
      quantity: Math.max(1, Math.floor(quantity || 1)),
      imageUrl: product.image || null,
      // Legacy key retained for compatibility with older payloads.
      image: product.image,
    });

  const handleAddToCart = (product: Product, sizeOverride?: string) => {
    markRecentlyViewed(product);
    const selectedSize = sizeOverride ?? selectedSizes[product.id];
    if (!selectedSize) return;

    setAddStates((prev) => ({ ...prev, [product.id]: "loading" }));
    const requestedQuantity = quantities[product.id] ?? 1;
    const normalized = buildNormalizedCartItem(product, selectedSize, requestedQuantity);
    // Defensive guard: skip malformed entries instead of polluting cart state.
    if (!normalized) {
      showToast({ type: "error", message: "Failed to add item." });
      setAddStates((prev) => ({ ...prev, [product.id]: "idle" }));
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.id === normalized.id && item.size === normalized.size
      );
      if (existing) {
        return prev.map((item) =>
          item.id === normalized.id && item.size === normalized.size
            ? {
                ...item,
                quantity: Math.max(
                  1,
                  Math.floor((item.quantity || 1) + normalized.quantity)
                ),
              }
            : item
        );
      }
      return [normalized, ...prev];
    });

    showToast({ type: "success", message: "Added to cart!" });
    logEvent("add_to_cart", {
      productId: product.id,
      quantity: normalized.quantity,
      price: normalized.price,
    });
    window.setTimeout(() => {
      setAddStates((prev) => ({ ...prev, [product.id]: "success" }));
      window.setTimeout(() => {
        setAddStates((prev) => ({ ...prev, [product.id]: "idle" }));
      }, 1500);
    }, 400);
  };

  const handleBuyNow = (product: Product) => {
    markRecentlyViewed(product);
    const selectedSize = selectedSizes[product.id];
    if (!selectedSize) return;

    const normalized = buildNormalizedCartItem(
      product,
      selectedSize,
      quantities[product.id] ?? 1
    );
    // Defensive guard: keep checkout deterministic even if product payload is malformed.
    if (!normalized) {
      showToast({ type: "error", message: "Unable to start checkout." });
      return;
    }

    setCheckoutItems([normalized]);
    logEvent("begin_checkout", { productId: product.id, quantity: normalized.quantity });
    setShowCheckout(true);
  };

  const handleCartCheckout = () => {
    if (cartItems.length === 0) {
      showToast({ type: "info", message: "Your cart is empty." });
      return;
    }
    const safeSubtotal = getSafeCartSubtotal(cartItems);
    if (!Number.isFinite(safeSubtotal) || safeSubtotal <= 0) {
      showToast({ type: "error", message: "Unable to checkout. Please review your cart." });
      return;
    }
    setCheckoutItems(cartItems);
    setShowCheckout(true);
    setShowCart(false);
    logEvent("begin_checkout", { items: cartItems.length });
  };

  const handleWhatsappRedirect = (paymentMethod: string) => {
    // Fail-safe guard: never attempt checkout with empty or invalid totals.
    if (checkoutItems.length === 0) {
      showToast({ type: "info", message: "Your cart is empty." });
      return;
    }

    const deliveryFee = deliveryFees[deliveryZone];
    const safeSubtotal = getSafeCartSubtotal(checkoutItems);
    const total = safeSubtotal + deliveryFee;
    if (!Number.isFinite(total) || total <= 0) {
      showToast({ type: "error", message: "Unable to complete checkout. Please try again." });
      return;
    }

    const deliveryZoneLabel =
      deliveryZone === "inside" ? text.insideDhaka : text.outsideDhaka;
    const message = buildWhatsAppMessage({
      customer,
      items: checkoutItems,
      paymentMethod,
      deliveryZone: deliveryZoneLabel,
      deliveryFee,
      transactionId: transactionId.trim() || undefined,
      total,
    });
    const url = `https://wa.me/${whatsappNumber.replace(
      /\D/g,
      ""
    )}?text=${message}`;
    window.location.href = url;
    addOrder({
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: checkoutItems,
      total,
      paymentMethod,
      deliveryZone,
      customer,
      status: "pending",
    });
    logEvent("purchase", {
      total,
      paymentMethod,
      items: checkoutItems.length,
    });
    clearCart();
    setCheckoutItems([]);
    setShowCheckout(false);
    setShowPaymentInfo(false);
  };

  // ------------------------------
  // Derived data
  // ------------------------------
  const productSource = adminProducts.filter((item) => item.active !== false);

  const filteredProducts = useMemo(() => {
    let result = [...productSource];

    if (selectedCategory !== "All") {
      result = result.filter((product) => product.category === selectedCategory);
    }

    if (filters.size.length) {
      result = result.filter((product) =>
        filters.size.some((size) => product.sizes.includes(size))
      );
    }

    if (filters.colors.length) {
      result = result.filter((product) =>
        filters.colors.some((color) => product.colors.includes(color))
      );
    }

    if (filters.price) {
      result = result.filter((product) => {
        if (filters.price === "under-500") return product.price < 500;
        if (filters.price === "500-800")
          return product.price >= 500 && product.price <= 800;
        return product.price > 800;
      });
    }

    if (filters.sort) {
      if (filters.sort === "low-high") {
        result.sort((a, b) => a.price - b.price);
      }
      if (filters.sort === "high-low") {
        result.sort((a, b) => b.price - a.price);
      }
    }

    return result;
  }, [filters, productSource, selectedCategory]);

  const visibleProducts = hasMounted && Array.isArray(filteredProducts) ? filteredProducts : [];
  const productBatchKey = useMemo(
    () => visibleProducts.map((product) => product.id).join("|"),
    [visibleProducts]
  );

  const activeChips = [
    ...filters.size.map((size) => ({ type: "size", value: size })),
    ...filters.colors.map((color) => ({ type: "color", value: color })),
    ...(filters.price ? [{ type: "price", value: filters.price }] : []),
    ...(filters.sort ? [{ type: "sort", value: filters.sort }] : []),
  ];

  const removeChip = (chip: { type: string; value: string }) => {
    setFilters((prev) => {
      if (chip.type === "size") {
        return { ...prev, size: prev.size.filter((s) => s !== chip.value) };
      }
      if (chip.type === "color") {
        return {
          ...prev,
          colors: prev.colors.filter((c) => c !== chip.value),
        };
      }
      if (chip.type === "price") {
        return { ...prev, price: null };
      }
      if (chip.type === "sort") {
        return { ...prev, sort: "newest" };
      }
      return prev;
    });
  };

  const openSheet = (sheet: DrawerTab) => {
    setDraftFilters(filters);
    setActiveSheet(sheet);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setActiveSheet(null);
  };

  const clearFilters = () => {
    setDraftFilters(defaultFilters);
    setSelectedCategory("All");
  };

  const updateCartQuantity = async (index: number, quantity: number) => {
    showToast({ type: "info", message: "Updating cart..." });
    setCartActionLoading((prev) => ({ ...prev, [index]: true }));
    const safeQuantity = Math.max(0, Math.floor(quantity || 0));
    try {
      // Keep feedback local to the touched row while applying optimistic update.
      setCartItems((prev) => {
        // Quantity 0 is treated as remove to avoid stale zero-quantity rows.
        if (safeQuantity === 0) return prev.filter((_, idx) => idx !== index);
        return prev.map((item, idx) =>
          idx === index ? { ...item, quantity: safeQuantity } : item
        );
      });
      showToast({ type: "success", message: "Cart updated." });
    } catch {
      showToast({
        type: "error",
        message: "Failed to update quantity.",
        onRetry: () => {
          void updateCartQuantity(index, quantity);
        },
      });
    } finally {
      setCartActionLoading((prev) => ({ ...prev, [index]: false }));
    }

    setCartQuantityFeedback((prev) => ({
      ...prev,
      [index]: qtyUpdatedMessage,
    }));
    window.setTimeout(() => {
      setCartQuantityFeedback((prev) => ({ ...prev, [index]: "" }));
    }, 1000);
  };

  const removeCartItem = async (index: number) => {
    showToast({ type: "info", message: "Updating cart..." });
    setCartActionLoading((prev) => ({ ...prev, [index]: true }));
    try {
      setCartItems((prev) => prev.filter((_, idx) => idx !== index));
      showToast({ type: "success", message: "Item removed." });
    } catch {
      showToast({
        type: "error",
        message: "Failed to remove item.",
        onRetry: () => {
          void removeCartItem(index);
        },
      });
    } finally {
      setCartActionLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const isCustomerInfoValid =
    customer.name.trim() && customer.phone.trim() && customer.address.trim();

  const checkoutSubtotal = getSafeCartSubtotal(checkoutItems);
  const deliveryFee = Number.isFinite(deliveryFees[deliveryZone])
    ? deliveryFees[deliveryZone]
    : 0;
  const checkoutTotal = checkoutSubtotal + deliveryFee;
  const isSummaryLoading = !hasMounted || isCartHydrating;
  const hasPaymentProof = Boolean(transactionId.trim());


  // Phase1.8: Add-to-cart bridge from hero slides to existing product/cart flow.
  const handleHeroAddToCart = (heroProduct: HeroProduct) => {
    const matchedProduct = adminProducts.find((item) => item.id === heroProduct.id);

    if (!matchedProduct) {
      showToast({ type: "error", message: "Product is unavailable right now." });
      return;
    }

    const defaultSize = selectedSizes[matchedProduct.id] ?? matchedProduct.sizes[0] ?? "M";
    setSelectedSizes((prev) => ({ ...prev, [matchedProduct.id]: defaultSize }));
    handleAddToCart(matchedProduct, defaultSize);
  };

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div className="min-h-screen bg-white pb-24">
      {!isOnline ? (
        <div className="sticky top-0 z-50 bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          ⚠️ You are offline — checkout is disabled.
        </div>
      ) : null}
      <header className="sticky top-0 z-50 bg-[var(--brand-surface)]/80 backdrop-blur-md border-b border-[var(--brand-secondary)]/20">
        <div className="mx-auto max-w-6xl px-4 md:px-10 py-5 md:py-6">
          <div className="flex items-center justify-between gap-6">
            <p className="text-lg md:text-xl font-medium tracking-[0.15em] transition-opacity duration-300 hover:opacity-80">
              TACIN ARABI
            </p>
            <div className="flex items-center gap-3">
              <LanguageToggle language={language} setLanguage={setLanguage} />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 md:px-10 pb-6 pt-4">
          {/* Phase1.8: Componentized dynamic hero carousel with direct add-to-cart action. */}
          <HeroCarousel
            addToCart={handleHeroAddToCart}
            initialProducts={initialAdminProducts.filter((item) => item.heroFeatured).slice(0, 3)}
          />
      </section>

      <section className="px-6 py-12 md:px-12">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-[var(--brand-secondary)]/20 bg-[var(--brand-surface)] shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4">
            <div className="flex items-center gap-4 border-b border-[var(--brand-secondary)]/15 px-8 py-8 md:border-b-0 md:border-r md:py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-secondary)]/10 text-[var(--brand-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a5 5 0 10-10 0v2m-2 0h14v10H5V9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">Cash on Delivery</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Available nationwide</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-b border-[var(--brand-secondary)]/15 px-8 py-8 md:border-b-0 md:border-r md:py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-secondary)]/10 text-[var(--brand-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m4 0h1" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">Free Pick-Up</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">DU • Shahbag • Mirpur 10</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-b border-[var(--brand-secondary)]/15 px-8 py-8 md:border-b-0 md:border-r md:py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-secondary)]/10 text-[var(--brand-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">Thoughtfully Selected</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Quality over quantity</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-[var(--brand-secondary)]/15 px-8 py-8 md:py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-secondary)]/10 text-[var(--brand-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v6h6M20 20v-6h-6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">7-Day Exchange</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Easy &amp; hassle-free</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Phase1.5: Retail Intro Before Product Grid */}
      <section className="mx-auto my-6 max-w-3xl px-4 text-center">
        <h2 className="text-2xl font-bold text-primary-heading">
          Shop Trendy Kurti & Women's Fashion Online in Bangladesh
        </h2>
        <p className="mt-2 text-base text-secondary">
          Discover bestselling cotton kurtis, elegant embroidered designs, and everyday modest fashion at competitive online prices. Buy now via WhatsApp with quick order confirmation and fast nationwide delivery across Bangladesh.
        </p>
      </section>

      {/* Phase1: Place categories above product grid for faster discovery */}
      <section className="sticky top-0 z-20 bg-white/95">
        <AnimatedWrapper className="retail-section-enter" variant="section">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={clsx(
                    "interactive-feedback min-h-[42px] whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold",
                    selectedCategory === category
                      ? "border-accent bg-accent text-white"
                      : "border-[#e6d8ce] bg-white text-ink"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => openSheet("size")}
              className="interactive-feedback flex min-h-[44px] items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-red-800"
            >
              Filters
              {(filters.size.length || filters.colors.length || filters.price) ? (
                <span className="rounded-full bg-gold px-2 text-xs text-charcoal">
                  {filters.size.length + filters.colors.length + (filters.price ? 1 : 0)}
                </span>
              ) : null}
            </button>
          </div>
        </AnimatedWrapper>
      </section>

      {/* Phase1.5: Retail Divider */}
      <hr className="my-6 border-gray-200" />

      <main id="product-grid" className="mx-auto max-w-6xl px-4 pb-12 pt-4">
        {activeChips.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <button
                key={`${chip.type}-${chip.value}`}
                type="button"
                onClick={() => removeChip(chip)}
                className="interactive-feedback rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink shadow-soft"
              >
                {chip.type === "price"
                  ? priceRanges.find((range) => range.id === chip.value)?.label
                  : chip.type === "sort"
                  ? sortOptions.find((option) => option.id === chip.value)?.label
                  : chip.value}
                <span className="ml-2 text-accent">✕</span>
              </button>
            ))}
          </div>
        ) : null}

        <SectionLoader
          loading={!hasMounted || isLoading}
          loader={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Product placeholders prevent blank state flashes during hydration. */}
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={`skeleton-${index}`} />
              ))}
            </div>
          }
        >
          {visibleProducts.length === 0 ? (
          <div className="rounded-3xl bg-card p-6 text-center shadow-soft">
            <p className="text-lg font-semibold text-ink">No products found.</p>
            <p className="mt-2 text-sm text-muted">
              Adjust filters or check back soon.
            </p>
          </div>
          ) : (
          <motion.div
            key={productBatchKey}
            className={clsx(
              "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
              !prefersReducedMotion && "retail-batch-enter"
            )}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {visibleProducts.map((product, index) => (
              <AnimatedWrapper
                key={product.id}
                variant="product-card"
                delay={prefersReducedMotion ? 0 : Math.min(index * 0.02, 0.12)}
              >
                <ProductCard
                product={product}
                selectedSize={selectedSizes[product.id]}
                quantity={quantities[product.id] ?? 1}
                onSizeChange={(size) => updateSize(product.id, size)}
                onQuantityChange={(quantity) =>
                  updateQuantity(product.id, quantity)
                }
                onBuyNow={() => handleBuyNow(product)}
                onAddToCart={() => handleAddToCart(product)}
                onOpenDetails={() => {
                  markRecentlyViewed(product);
                  setDetailsProduct(product);
                }}
                priceLabel={text.priceLabel}
                buyNowLabel={text.buyNow}
                addToCartLabel={text.addToCart}
                addingLabel={text.adding}
                addedLabel={text.added}
                addState={addStates[product.id] ?? "idle"}
                quantityFeedback={quantityFeedback[product.id]}
                statusLabel={getStatusLabel(index)}
                stockLabel={getStockLabel(index)}
              />
              </AnimatedWrapper>
            ))}
          </motion.div>
          )}
        </SectionLoader>

        {/* Phase1: Defer large info blocks below product grid */}
        <section className="mt-8 hidden md:block">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-card p-5 shadow-soft">
              <h3 className="font-heading text-xl font-semibold">
                How ordering works
              </h3>
              <p className="mt-2 text-sm text-muted">
                Choose your size, add to cart, and place your fashion order on WhatsApp in minutes. Get instant confirmation and delivery updates before dispatch.
              </p>
            </div>
            <div className="rounded-3xl bg-card p-5 shadow-soft">
              <h3 className="font-heading text-xl font-semibold">
                Why customers choose us
              </h3>
              <p className="mt-2 text-sm text-muted">
                Trusted quality, transparent Bangladesh pricing, and responsive support to help you buy fashion essentials with confidence.
              </p>
            </div>
          </div>
        </section>

        {recentlyViewed.length > 0 ? (
          <section className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold">
                Recently Viewed
              </h2>
              <span className="text-xs font-semibold text-muted">
                Last 2 items
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {recentlyViewed.map((product, index) => (
                <AnimatedWrapper key={product.id} variant="product-card" delay={prefersReducedMotion ? 0 : Math.min(index * 0.02, 0.1)}>
                  <ProductCard
                  product={product}
                  selectedSize={selectedSizes[product.id]}
                  quantity={quantities[product.id] ?? 1}
                  onSizeChange={(size) => updateSize(product.id, size)}
                  onQuantityChange={(quantity) =>
                    updateQuantity(product.id, quantity)
                  }
                  onBuyNow={() => handleBuyNow(product)}
                  onAddToCart={() => handleAddToCart(product)}
                  onOpenDetails={() => setDetailsProduct(product)}
                  showBadge="Recently Viewed"
                  priceLabel={text.priceLabel}
                  buyNowLabel={text.buyNow}
                  addToCartLabel={text.addToCart}
                  addingLabel={text.adding}
                  addedLabel={text.added}
                  addState={addStates[product.id] ?? "idle"}
                  quantityFeedback={quantityFeedback[product.id]}
                  statusLabel={getStatusLabel(index)}
                  stockLabel={getStockLabel(index)}
                />
                </AnimatedWrapper>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-[#e6d8ce] bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-3">
          <div>
            <h3 className="font-heading text-lg font-semibold">
              Tacin Arabi Collection
            </h3>
            <p className="mt-2 text-sm text-muted">
              Your trusted online fashion shop in Bangladesh for kurti, modest wear, and ceramic lifestyle picks—powered by WhatsApp-first ordering.
            </p>
            <p className="mt-3 text-sm font-semibold text-ink">
              WhatsApp: +8801522119189
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink">Store Policies</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>Cash on Delivery available nationwide</li>
              <li>Delivery confirmation before dispatch</li>
              <li>Support available 10am–10pm daily</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink">Social Proof</h4>
            <p className="mt-3 text-sm text-muted">
              Thousands of Bangladesh fashion shoppers trust our WhatsApp checkout for fast confirmation, secure payment guidance, and reliable delivery updates.
            </p>
            <p className="mt-3 text-sm font-semibold text-ink">
              “Fast replies, quality products, safe delivery.”
            </p>
          </div>
        </div>
      </footer>

      {toast ? (
        <Toast
          type={toast.type}
          message={toast.message}
          onRetry={toast.onRetry}
          onClose={() => setToast(null)}
        />
      ) : null}

      <button
        type="button"
        onClick={() => openSheet("size")}
        className="floating-action interactive-feedback fixed bottom-42 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-white shadow-soft"
        aria-label="Open filters"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => setShowCart(true)}
        className="floating-action interactive-feedback group fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-soft"
        aria-label="Open cart"
      >
        <span
          className={clsx(
            "relative flex h-14 w-14 items-center justify-center text-xl text-ink",
            cartBump && "animate-cart-bounce"
          )}
        >
          🛍️
          {hasMounted && cartItems.length > 0 ? (
            <span className="absolute -top-1 -right-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
              {cartItems.length}
            </span>
          ) : !hasMounted ? (
            // Keeps button badge area visually stable before client cart hydration completes.
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#eadad0]" />
          ) : null}
        </span>
      </button>

      <a
        href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
        target="_blank"
        rel="noreferrer"
        aria-disabled={!isOnline}
        className={clsx(
          "floating-action interactive-feedback group fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-soft",
          !isOnline && "pointer-events-none opacity-60"
        )}
      >
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
            alt="WhatsApp"
            className="h-7 w-7"
          />
          <span
            className={clsx(
              "absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500",
              !prefersReducedMotion && "animate-ping"
            )}
          />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
        </div>
      </a>

      <FilterDrawer
        open={Boolean(activeSheet)}
        activeTab={activeSheet ?? "size"}
        draftFilters={draftFilters}
        priceRanges={priceRanges}
        sortOptions={sortOptions}
        onClose={() => setActiveSheet(null)}
        onTabChange={setActiveSheet}
        onDraftChange={setDraftFilters}
        onApply={applyFilters}
        onClear={clearFilters}
        clearLabel={text.clear}
        applyLabel={text.applyFilters}
      />

      {detailsProduct ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40">
          <div className="panel-enter w-full rounded-t-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted">Quick View</p>
                <h3 className="text-lg font-semibold text-ink">
                  {detailsProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsProduct(null)}
                className="text-sm font-semibold text-accent"
              >
                Close
              </button>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="h-28 w-28 overflow-hidden rounded-2xl bg-base">
                <Image
                  src={detailsProduct.image}
                  alt={detailsProduct.name}
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 text-sm text-muted">
                <p>
                  Category:{" "}
                  <span className="font-semibold text-ink">
                    {detailsProduct.category}
                  </span>
                </p>
                <p>
                  Colors:{" "}
                  <span className="font-semibold text-ink">
                    {detailsProduct.colors.join(", ")}
                  </span>
                </p>
                <p>
                  {text.priceLabel}:{" "}
                  <span className="font-semibold text-ink">
                    {formatPrice(detailsProduct.price)}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {detailsProduct.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateSize(detailsProduct.id, size)}
                  className={clsx(
                    "rounded-full border px-4 py-2 text-sm font-semibold",
                    selectedSizes[detailsProduct.id] === size
                      ? "border-accent bg-accent text-white"
                      : "border-[#e6d8ce]"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full border border-[#e6d8ce] px-3 py-1">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(
                      detailsProduct.id,
                      Math.max(1, (quantities[detailsProduct.id] ?? 1) - 1)
                    )
                  }
                >
                  -
                </button>
                <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                  {quantities[detailsProduct.id] ?? 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(
                      detailsProduct.id,
                      (quantities[detailsProduct.id] ?? 1) + 1
                    )
                  }
                >
                  +
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleBuyNow(detailsProduct)}
                  disabled={!selectedSizes[detailsProduct.id]}
                  className={clsx(
                    "min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold",
                    selectedSizes[detailsProduct.id]
                      ? "bg-accent text-white"
                      : "cursor-not-allowed bg-[#e6d8ce] text-muted"
                  )}
                >
                  {text.buyNow}
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCart(detailsProduct)}
                  disabled={!selectedSizes[detailsProduct.id]}
                  className={clsx(
                    "min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold",
                    selectedSizes[detailsProduct.id]
                      ? "border-accent text-accent"
                      : "cursor-not-allowed border-[#e6d8ce] text-muted"
                  )}
                >
                  {text.addToCart}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCart ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40">
          <div className="w-full rounded-t-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h3
                ref={cartHeadingRef}
                tabIndex={-1}
                className="text-lg font-semibold text-ink"
              >
                Your Cart
              </h3>
              <button
                type="button"
                onClick={() => setShowCart(false)}
                className="interactive-feedback text-sm font-semibold text-accent"
              >
                Close
              </button>
            </div>
            {isCartHydrating ? (
              <CartSkeleton />
            ) : cartItems.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-[#f0e4da] bg-base p-4 text-center">
                <p className="text-lg">🛍️</p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  Your cart is empty.
                </p>
                <p className="mt-1 text-xs text-muted">
                  Start shopping to add items.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCart(false)}
                  className="interactive-feedback mt-3 rounded-full border border-[#e6d8ce] px-4 py-2 text-xs font-semibold text-ink"
                >
                  Browse products
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.id}-${item.size}-${index}`}
                    className={clsx(
                      "flex items-center gap-4 rounded-2xl border border-[#f0e4da] p-3 transition duration-200",
                      cartActionLoading[index] && "scale-[0.98] opacity-70"
                    )}
                  >
                    <Image
                      src={item.imageUrl ?? item.image ?? "/images/product-1.svg"}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted">
                        Size: {item.size} · Color: {item.color}
                      </p>
                      <p className="text-sm font-semibold text-ink">
                        {formatPrice(item.price)}
                      </p>
                      {cartQuantityFeedback[index] ? (
                        <p className="mt-1 text-xs font-semibold text-accent">
                          {cartQuantityFeedback[index]}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 rounded-full border border-[#e6d8ce] px-2 py-1">
                        <button
                          type="button"
                          disabled={cartActionLoading[index]}
                          onClick={() =>
                            void updateCartQuantity(index, item.quantity - 1)
                          }
                          className="interactive-feedback"
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={cartActionLoading[index]}
                          onClick={() =>
                            void updateCartQuantity(index, item.quantity + 1)
                          }
                          className="interactive-feedback"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={cartActionLoading[index]}
                        onClick={() => void removeCartItem(index)}
                        className="interactive-feedback text-xs font-semibold text-accent"
                      >
                        {cartActionLoading[index] ? "Updating..." : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{text.subtotal}</span>
                  <span>
                    {isCartHydrating ? (
                      <SummaryPlaceholder />
                    ) : (
                      formatPrice(getSafeCartSubtotal(cartItems))
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCartCheckout}
                  className="interactive-feedback min-h-[44px] w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white"
                >
                  {text.checkout}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {showCheckout ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40">
          <div className="panel-enter w-full rounded-t-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted">
                  Universal Checkout
                </p>
                <h3
                  ref={checkoutHeadingRef}
                  tabIndex={-1}
                  className="text-lg font-semibold text-ink"
                >
                  Confirm your order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="interactive-feedback text-sm font-semibold text-accent"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {checkoutItems.map((item, index) => (
                <div
                  key={`${item.id}-${item.size}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-[#f0e4da] p-3"
                >
                  <div>
                    <p className="font-semibold text-ink">{item.name}</p>
                    <p className="text-xs text-muted">
                      Size: {item.size} · Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-ink">
                {text.deliveryZone}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryZone("inside")}
                  className={clsx(
                    "interactive-feedback min-h-[44px] flex-1 rounded-full border px-4 py-2 text-sm font-semibold",
                    deliveryZone === "inside"
                      ? "border-accent bg-accent text-white"
                      : "border-[#e6d8ce]"
                  )}
                >
                  {text.insideDhaka}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryZone("outside")}
                  className={clsx(
                    "interactive-feedback min-h-[44px] flex-1 rounded-full border px-4 py-2 text-sm font-semibold",
                    deliveryZone === "outside"
                      ? "border-accent bg-accent text-white"
                      : "border-[#e6d8ce]"
                  )}
                >
                  {text.outsideDhaka}
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2 rounded-2xl border border-[#f0e4da] p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>{text.subtotal}</span>
                <span className="font-semibold">
                  {isSummaryLoading ? <SummaryPlaceholder /> : formatPrice(checkoutSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{text.deliveryCharge}</span>
                <span className="font-semibold">
                  {isSummaryLoading ? <SummaryPlaceholder widthClass="w-12" /> : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold">
                <span>{text.totalPayable}</span>
                <span>{isSummaryLoading ? <SummaryPlaceholder /> : formatPrice(checkoutTotal)}</span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <label htmlFor="checkout-name" className="sr-only">
                Name
              </label>
              <input
                id="checkout-name"
                type="text"
                placeholder="Name"
                value={customer.name}
                onChange={(event) =>
                  setCustomer((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[#e6d8ce] px-4 py-3 text-sm"
              />
              <label htmlFor="checkout-phone" className="sr-only">
                Phone
              </label>
              <input
                id="checkout-phone"
                type="tel"
                placeholder="Phone"
                value={customer.phone}
                onChange={(event) =>
                  setCustomer((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[#e6d8ce] px-4 py-3 text-sm"
              />
              <label htmlFor="checkout-address" className="sr-only">
                Address
              </label>
              <textarea
                id="checkout-address"
                placeholder="Address"
                rows={3}
                value={customer.address}
                onChange={(event) =>
                  setCustomer((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[#e6d8ce] px-4 py-3 text-sm"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-full bg-base px-4 py-2 text-xs font-semibold text-ink">
                Cash on Delivery
              </span>
              <span className="rounded-full bg-base px-4 py-2 text-xs font-semibold text-ink">
                Nationwide Delivery
              </span>
              <span className="rounded-full bg-base px-4 py-2 text-xs font-semibold text-ink">
                WhatsApp Support
              </span>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleWhatsappRedirect("COD")}
                disabled={!isCustomerInfoValid || !isOnline || checkoutItems.length === 0 || checkoutTotal <= 0 || !Number.isFinite(checkoutTotal)}
                className={clsx(
                  "interactive-feedback min-h-[48px] rounded-full px-4 py-3 text-sm font-semibold",
                  isCustomerInfoValid && isOnline
                    ? "bg-accent text-white"
                    : "cursor-not-allowed bg-[#e6d8ce] text-muted"
                )}
              >
                {text.orderCod}
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentInfo(true)}
                disabled={!isCustomerInfoValid || !isOnline || checkoutItems.length === 0 || checkoutTotal <= 0 || !Number.isFinite(checkoutTotal)}
                className={clsx(
                  "interactive-feedback min-h-[48px] rounded-full border px-4 py-3 text-sm font-semibold",
                  isCustomerInfoValid && isOnline
                    ? "border-accent text-accent"
                    : "cursor-not-allowed border-[#e6d8ce] text-muted"
                )}
              >
                {text.payNow}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPaymentInfo ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40">
          <div className="panel-enter w-full rounded-t-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted">Payment Info</p>
                <h3 className="text-lg font-semibold text-ink">
                  bKash / Nagad Transfer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentInfo(false)}
                className="interactive-feedback text-sm font-semibold text-accent"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                bKash: <span className="font-semibold">{paymentNumber}</span>
              </p>
              <p>
                Nagad: <span className="font-semibold">{paymentNumber}</span>
              </p>
              <p className="text-xs text-muted">
                Please pay first, then paste your Transaction ID below.
              </p>
              <label htmlFor="transaction-id" className="sr-only">
                Transaction ID
              </label>
              <input
                id="transaction-id"
                type="text"
                placeholder="Transaction ID"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                className="w-full rounded-2xl border border-[#e6d8ce] px-4 py-3 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={!hasPaymentProof || !isOnline || checkoutItems.length === 0 || checkoutTotal <= 0 || !Number.isFinite(checkoutTotal)}
              onClick={() => handleWhatsappRedirect("bKash/Nagad")}
              className={clsx(
                "interactive-feedback mt-6 min-h-[48px] w-full rounded-full px-4 py-3 text-sm font-semibold",
                hasPaymentProof && isOnline
                  ? "bg-accent text-white"
                  : "cursor-not-allowed bg-[#e6d8ce] text-muted"
              )}
            >
              {text.confirmWhatsapp}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
