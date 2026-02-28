"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import clsx from "clsx";
import ProductCard from "../components/ProductCard";
import Toast from "../components/Toast";
import SkeletonCard from "../components/ui/SkeletonCard";
import SectionLoader from "../components/SectionLoader";
import CartSkeleton from "../components/CartSkeleton";
import SummaryPlaceholder from "../components/SummaryPlaceholder";
import { AnimatedWrapper } from "../components/AnimatedWrapper";
import HeroCarousel from "./components/HeroCarousel";
import LanguageToggle from "./components/LanguageToggle";
import FilterDrawer, { type DrawerTab } from "../components/ui/FilterDrawer";
import { Facebook, Instagram, SlidersHorizontal } from "lucide-react";
import type { Product } from "../lib/products";
import type { CartItem } from "../lib/cart";
import { getSafeCartSubtotal, normalizeCartItem } from "../lib/cart";
import type { CustomerInfo } from "../lib/orders";
import { buildWhatsAppMessage } from "../lib/whatsapp";
import type { AdminProduct } from "../lib/inventory";
import type {
  AnnouncementContent,
  CarouselItem,
  FilterPanelItem,
} from "../lib/siteContent";
import useCart from "../hooks/useCart";

const whatsappNumber = "+8801522119189";
const paymentNumber = "+8801701019292";

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

type CategoryFilter = string;

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

const storageKeys = {
  viewed: "tacin-recently-viewed",
  language: "tacin-lang",
};

const statusLabels = ["New", "Popular", "Low Stock"] as const;

const defaultAnnouncement: AnnouncementContent = {
  text: "Free nationwide delivery updates • WhatsApp-first support • Elegant modest fashion curated for Bangladesh",
  active: true,
};

const defaultFilterConfig: FilterPanelItem[] = [
  {
    id: "all",
    label: "All",
    value: "All",
    active: true,
    highlight: true,
    showOnLanding: true,
    order: 1,
  },
  {
    id: "clothing",
    label: "Clothing",
    value: "Clothing",
    active: true,
    highlight: false,
    showOnLanding: true,
    order: 2,
  },
  {
    id: "ceramic",
    label: "Ceramic",
    value: "Ceramic",
    active: true,
    highlight: false,
    showOnLanding: true,
    order: 3,
  },
];

const INVENTORY_UPDATED_STORAGE_KEY = "tacin:inventory-updated-at";
const INVENTORY_UPDATED_EVENTS = [
  "tacin:inventory-updated",
  "product-added",
  "product-deleted",
] as const;

const normalizeInventoryResponse = (payload: unknown): AdminProduct[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is AdminProduct =>
      Boolean(item && typeof item === "object"),
    );
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;

    if ("id" in objectPayload) {
      return [objectPayload as AdminProduct];
    }

    return Object.values(objectPayload).filter((item): item is AdminProduct =>
      Boolean(item && typeof item === "object"),
    );
  }

  return [];
};

const copy = {
  en: {
    buyNow: "Buy Now",
    addToCart: "Add to Cart",
    adding: "Adding...",
    added: "Added",
    checkout: "Checkout",
    orderCod: "Order via WhatsApp (Cash on Delivery)",
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
    sizeError: "Please select a size first",
  },
  bn: {
    buyNow: "এখনই কিনুন",
    addToCart: "কার্টে যোগ করুন",
    adding: "যোগ হচ্ছে...",
    added: "যোগ হয়েছে",
    checkout: "চেকআউট",
    orderCod: "হোয়াটসঅ্যাপে অর্ডার (ক্যাশ অন ডেলিভারি)",
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
    sizeError: "অনুগ্রহ করে আগে একটি সাইজ নির্বাচন করুন",
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
  initialAnnouncement?: AnnouncementContent;
  initialCarouselSlides?: CarouselItem[];
  initialFilters?: FilterPanelItem[];
};

export default function HomePage({
  initialAdminProducts = [],
  initialAnnouncement = defaultAnnouncement,
  initialCarouselSlides = [],
  initialFilters = defaultFilterConfig,
}: HomeClientProps) {
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>(
    {},
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { cartItems, setCartItems, isCartHydrating, clearCart } = useCart();
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<Filters>(defaultFilters);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter | null>(null);
  const [activeSheet, setActiveSheet] = useState<DrawerTab | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [isFieldShake, setIsFieldShake] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<"inside" | "outside">(
    "inside",
  );
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: "",
  });
  const [addStates, setAddStates] = useState<Record<string, AddState>>({});
  const [quantityFeedback, setQuantityFeedback] = useState<
    Record<string, string>
  >({});
  const [cartQuantityFeedback, setCartQuantityFeedback] = useState<
    Record<number, string>
  >({});
  const [language, setLanguage] = useState<Language>("en");
  const [cartBump, setCartBump] = useState(false);
  const prevCartCount = useRef(cartItems.length);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [adminProducts, setAdminProducts] =
    useState<AdminProduct[]>(initialAdminProducts);
  const [cartActionLoading, setCartActionLoading] = useState<
    Record<number, boolean>
  >({});
  const [announcement, setAnnouncement] =
    useState<AnnouncementContent>(initialAnnouncement);
  const [filterConfig, setFilterConfig] = useState<FilterPanelItem[]>(
    Array.isArray(initialFilters) && initialFilters.length
      ? initialFilters
      : defaultFilterConfig,
  );
  const cartHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const checkoutHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const checkoutRef = useRef<HTMLDivElement | null>(null);
  const trustBarRef = useRef<HTMLDivElement | null>(null);
  const isTrustBarInView = useInView(trustBarRef, { once: true, amount: 0.35 });

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast);
  };

  const text = copy[language];

  const scrollToCheckout = () => {
    if (typeof window === "undefined") return;

    window.requestAnimationFrame(() => {
      checkoutRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const logEvent = (eventName: string, payload: Record<string, unknown>) => {
    if (typeof window === "undefined") return;
    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
    if (Array.isArray(dataLayer)) {
      dataLayer.push({ event: eventName, ...payload });
    }
  };

  useEffect(() => {
    setHasMounted(true);

    const storedViewed = localStorage.getItem(storageKeys.viewed);
    const storedLanguage = localStorage.getItem(
      storageKeys.language,
    ) as Language | null;

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

  const refreshCatalogData = useCallback(async () => {
    try {
      const [productsResponse, filtersResponse] = await Promise.all([
        fetch("/api/products", {
          cache: "no-store",
          next: { revalidate: 0 },
        }),
        fetch("/api/content/filters", { cache: "no-store" }),
      ]);

      if (productsResponse.ok) {
        const data = (await productsResponse.json()) as unknown;
        const shaped = Array.isArray(data) ? data.flat() : data ? [data] : [];
        setAdminProducts(normalizeInventoryResponse(shaped));
      }

      if (filtersResponse.ok) {
        const data = (await filtersResponse.json()) as FilterPanelItem[];
        if (Array.isArray(data)) {
          setFilterConfig(data);
        }
      }
    } catch {
      setAdminProducts((current) => current);
      setFilterConfig((current) => current);
    }
  }, []);

  useEffect(() => {
    void refreshCatalogData();
  }, [refreshCatalogData]);

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const res = await fetch("/api/content/announcement", {
          cache: "no-store",
          next: { revalidate: 0 },
        });
        if (!res.ok) return;

        const data = (await res.json()) as AnnouncementContent;
        if (!data || typeof data !== "object") return;

        setAnnouncement({
          text:
            typeof data.text === "string"
              ? data.text
              : defaultAnnouncement.text,
          active: data.active !== false,
        });
      } catch {
        setAnnouncement(defaultAnnouncement);
      }
    };

    void loadAnnouncement();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const refresh = () => {
      void refreshCatalogData();
    };

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === INVENTORY_UPDATED_STORAGE_KEY ||
        event.key === "inventory-updated" ||
        event.key === "site-content-updated"
      ) {
        refresh();
      }
    };

    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener("site-content-updated", refresh);
    window.addEventListener("inventory-updated", refresh);
    INVENTORY_UPDATED_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, refresh);
    });

    return () => {
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("site-content-updated", refresh);
      window.removeEventListener("inventory-updated", refresh);
      INVENTORY_UPDATED_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, refresh);
      });
    };
  }, [refreshCatalogData]);

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
    document.body.style.overflow = showCart || showCheckout ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCart, showCheckout]);

  useEffect(() => {
    if (!isFieldShake) return;
    const timer = window.setTimeout(() => setIsFieldShake(false), 380);
    return () => window.clearTimeout(timer);
  }, [isFieldShake]);

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

  useEffect(() => {
    if (typeof window === "undefined" || (!showCart && !showCheckout)) return;
    window.history.pushState({ overlay: true }, "");
  }, [showCart, showCheckout]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBack = () => {
      if (showCheckout) {
        setShowCheckout(false);
        return;
      }
      if (showCart) {
        setShowCart(false);
      }
    };

    window.addEventListener("popstate", handleBack);
    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, [showCart, showCheckout]);

  useEffect(() => {
    localStorage.setItem(storageKeys.viewed, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    localStorage.setItem(storageKeys.language, language);
  }, [language]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

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

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 220);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (cartItems.length > prevCartCount.current) {
      setCartBump(true);
      const timer = window.setTimeout(() => setCartBump(false), 450);
      return () => window.clearTimeout(timer);
    }
    prevCartCount.current = cartItems.length;
  }, [cartItems.length]);

  const updateSize = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const safeQuantity = Math.max(1, Math.floor(quantity || 1));
    setQuantities((prev) => ({ ...prev, [productId]: safeQuantity }));
    setQuantityFeedback((prev) => ({
      ...prev,
      [productId]: qtyUpdatedMessage,
    }));
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

  const buildNormalizedCartItem = (
    product: Product,
    selectedSize: string,
    quantity: number,
  ) =>
    normalizeCartItem({
      id: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: product.colors[0] ?? "",
      quantity: Math.max(1, Math.floor(quantity || 1)),
      imageUrl: product.image || null,
      image: product.image,
    });

  const handleAddToCart = (
    product: Product,
    sizeOverride: string | null = null,
  ) => {
    if (!product.id) return;
    markRecentlyViewed(product);
    const selectedSize = sizeOverride ?? selectedSizes[product.id];
    if (!selectedSize) return;

    setAddStates((prev) => ({ ...prev, [product.id]: "loading" }));
    const requestedQuantity = quantities[product.id] ?? 1;
    const normalized = buildNormalizedCartItem(
      product,
      selectedSize,
      requestedQuantity,
    );
    if (!normalized) {
      showToast({ type: "error", message: "Failed to add item." });
      setAddStates((prev) => ({ ...prev, [product.id]: "idle" }));
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.id === normalized.id && item.size === normalized.size,
      );
      if (existing) {
        return prev.map((item) =>
          item.id === normalized.id && item.size === normalized.size
            ? {
                ...item,
                quantity: Math.max(
                  1,
                  Math.floor((item.quantity || 1) + normalized.quantity),
                ),
              }
            : item,
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

  const handleBuyNow = (
    product: Product,
    sizeOverride: string | null = null,
  ) => {
    if (isRouting || !product.id) return;
    markRecentlyViewed(product);
    const selectedSize = sizeOverride ?? selectedSizes[product.id];
    if (!selectedSize) return;

    const normalized = buildNormalizedCartItem(
      product,
      selectedSize,
      quantities[product.id] ?? 1,
    );
    if (!normalized) {
      showToast({ type: "error", message: "Unable to start checkout." });
      return;
    }

    setIsRouting(true);
    window.setTimeout(() => {
      setCheckoutItems([normalized]);
      setIsOrderConfirmed(false);
      setIsSubmitting(false);
      logEvent("begin_checkout", {
        productId: product.id,
        quantity: normalized.quantity,
      });
      setShowCheckout(true);
      scrollToCheckout();
      setIsRouting(false);
    }, 180);
  };

  const handleCartCheckout = () => {
    if (isRouting) return;
    if (cartItems.length === 0) {
      showToast({ type: "info", message: "Your cart is empty." });
      return;
    }
    const safeSubtotal = getSafeCartSubtotal(cartItems);
    if (!Number.isFinite(safeSubtotal) || safeSubtotal <= 0) {
      showToast({
        type: "error",
        message: "Unable to checkout. Please review your cart.",
      });
      return;
    }
    setIsRouting(true);
    window.setTimeout(() => {
      setCheckoutItems(cartItems);
      setIsOrderConfirmed(false);
      setIsSubmitting(false);
      setShowCart(false);
      window.setTimeout(() => {
        setShowCheckout(true);
        scrollToCheckout();
        logEvent("begin_checkout", { items: cartItems.length });
        setIsRouting(false);
      }, 150);
    }, 180);
  };

  const handleWhatsappRedirect = async (paymentMethod: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (checkoutItems.length === 0) {
      showToast({ type: "info", message: "Your cart is empty." });
      setIsSubmitting(false);
      return;
    }

    const deliveryFee = deliveryFees[deliveryZone];
    const safeSubtotal = getSafeCartSubtotal(checkoutItems);
    const total = safeSubtotal + deliveryFee;
    if (!Number.isFinite(total) || total <= 0) {
      showToast({
        type: "error",
        message: "Unable to complete checkout. Please try again.",
      });
      setIsSubmitting(false);
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
    const url = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${message}`;
    window.open(url, "_blank", "noopener,noreferrer");
    await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: checkoutItems,
        customerName: customer.name,
        phone: customer.phone,
        address: customer.address,
        total,
      }),
    });
    localStorage.setItem("orders-updated", Date.now().toString());
    window.dispatchEvent(new Event("orders-updated"));
    logEvent("purchase", {
      total,
      paymentMethod,
      items: checkoutItems.length,
    });
    clearCart();
    setCheckoutItems([]);
    setIsOrderConfirmed(true);
    setShowPaymentInfo(false);
    setIsSubmitting(false);
  };

  const productSource = adminProducts.filter((item) => item.active !== false);

  const announcementText = announcement.text.trim() || defaultAnnouncement.text;
  const announcementDuration =
    announcementText.length < 90
      ? "15s"
      : announcementText.length > 180
        ? "28s"
        : "20s";

  const categoryFilteredProducts = useMemo(() => {
    if (!activeFilter) return productSource;
    return productSource.filter((product) => product.category === activeFilter);
  }, [productSource, activeFilter]);

  const filteredProducts = useMemo(() => {
    let result = [...categoryFilteredProducts];

    if (filters.size.length) {
      result = result.filter((product) =>
        filters.size.some((size) => product.sizes.includes(size)),
      );
    }

    if (filters.colors.length) {
      result = result.filter((product) =>
        filters.colors.some((color) => product.colors.includes(color)),
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
  }, [filters, categoryFilteredProducts]);

  const visibleProducts =
    hasMounted && Array.isArray(filteredProducts) ? filteredProducts : [];
  const productBatchKey = useMemo(
    () => visibleProducts.map((product) => product.id).join("|"),
    [visibleProducts],
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
    setActiveFilter(null);
  };

  const updateCartQuantity = async (index: number, quantity: number) => {
    showToast({ type: "info", message: "Updating cart..." });
    setCartActionLoading((prev) => ({ ...prev, [index]: true }));
    const safeQuantity = Math.max(0, Math.floor(quantity || 0));
    try {
      setCartItems((prev) => {
        if (safeQuantity === 0) return prev.filter((_, idx) => idx !== index);
        return prev.map((item, idx) =>
          idx === index ? { ...item, quantity: safeQuantity } : item,
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

  const handlePaymentInfoOpen = () => {
    if (!isCustomerInfoValid) {
      setIsFieldShake(true);
      showToast({
        type: "info",
        message: "Please fill in all required fields.",
      });
      return;
    }
    setShowPaymentInfo(true);
  };

  const checkoutSubtotal = getSafeCartSubtotal(checkoutItems);
  const deliveryFee = Number.isFinite(deliveryFees[deliveryZone])
    ? deliveryFees[deliveryZone]
    : 0;
  const checkoutTotal = checkoutSubtotal + deliveryFee;
  const isCheckoutBlocked =
    isSubmitting ||
    !isCustomerInfoValid ||
    !isOnline ||
    checkoutItems.length === 0 ||
    checkoutTotal <= 0 ||
    !Number.isFinite(checkoutTotal);
  const isSummaryLoading = !hasMounted || isCartHydrating;
  const hasPaymentProof = Boolean(transactionId.trim());

  const visibleFilters = useMemo(() => {
    if (!filterConfig?.length) return [];

    return filterConfig
      .filter((filterItem) => filterItem.active)
      .filter((filterItem) => filterItem.showOnLanding !== false)
      .sort((a, b) => a.order - b.order);
  }, [filterConfig]);

  useEffect(() => {
    if (!activeFilter) return;

    const stillExists = visibleFilters.some(
      (filterItem) => filterItem.value === activeFilter,
    );

    if (!stillExists) {
      setActiveFilter(null);
    }
  }, [visibleFilters, activeFilter]);

  return (
    <div
      className={clsx(
        "min-h-[100dvh] bg-white pb-24 transition-opacity duration-300 ease-in-out",
        isRouting && "opacity-80",
      )}
    >
      {!isOnline ? (
        <div className="sticky top-0 z-50 bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          ⚠️ You are offline — checkout is disabled.
        </div>
      ) : null}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border-soft)] border-t-[3px] border-t-[var(--bar-maroon)] bg-white">
        <nav className="relative mx-auto h-16 w-full max-w-6xl px-4 md:h-20">
          <div className="flex h-full items-center justify-center gap-3">
            <div className="absolute left-4 flex min-h-10 min-w-[104px] items-center justify-start">
              <LanguageToggle language={language} setLanguage={setLanguage} />
            </div>

            <div className="flex items-center justify-center">
              <Image
                src="/images/tacin-logo.svg"
                alt="Tacin Arabi Collection logo"
                width={64}
                height={64}
                className="h-10 w-auto object-contain sm:h-12 md:h-14 lg:h-16"
                priority
              />
            </div>

            <button
              type="button"
              onClick={() => setShowCart(true)}
              className="interactive-feedback absolute right-4 flex h-10 w-10 items-center justify-center rounded-full text-xl text-ink"
              aria-label="Open cart"
            >
              <span className={clsx(cartBump && "animate-cart-bounce")}>
                🛍️
              </span>
              {hasMounted && cartItems.length > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white">
                  {cartItems.length}
                </span>
              ) : !hasMounted ? (
                <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[#eadad0]" />
              ) : null}
            </button>
          </div>
        </nav>
      </header>

      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pt-4 md:px-10">
          <HeroCarousel initialSlides={initialCarouselSlides} />
        </div>
        <div className="h-6 bg-white" />
      </section>

      {announcement.active ? (
        <section className="border-y border-[var(--border-soft)] bg-[var(--bar-maroon-soft)] py-2">
          <div
            ref={trustBarRef}
            className={clsx(
              "mx-auto max-w-6xl px-4 transition-all duration-700 ease-out",
              isTrustBarInView
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0",
            )}
          >
            <div className="relative w-full overflow-hidden text-black">
              <div
                className="inline-flex min-w-max whitespace-nowrap animate-announcement-scroll text-[13px] font-medium tracking-wide text-black"
                style={
                  { "--announcement-duration": announcementDuration } as Record<
                    string,
                    string
                  >
                }
              >
                <span className="px-8 flex-none">{announcementText}</span>
                <span className="px-8 flex-none">{announcementText}</span>
                <span className="px-8 flex-none" aria-hidden="true">
                  {announcementText}
                </span>
              </div>
              
              
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white">
        <AnimatedWrapper className="retail-section-enter" variant="section">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveFilter(null)}
                className={clsx(
                  "whitespace-nowrap rounded-full border border-[var(--border-soft)] px-3 py-1.5 text-[12px] transition hover:bg-[var(--bar-maroon-soft)]",
                  activeFilter === null
                    ? "border-[var(--bar-maroon)] bg-[var(--bar-maroon)] text-white"
                    : "text-ink",
                )}
              >
                All
              </button>
              {visibleFilters.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveFilter(category.value)}
                  className={clsx(
                    "whitespace-nowrap rounded-full border border-[var(--border-soft)] px-3 py-1.5 text-[12px] transition hover:bg-[var(--bar-maroon-soft)]",
                    activeFilter === category.value
                      ? "border-[var(--bar-maroon)] bg-[var(--bar-maroon)] text-white"
                      : category.highlight
                        ? "border-accent/70 text-ink"
                        : "text-ink",
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[13px] text-[var(--text-secondary)]">
                {sortOptions.find(
                  (option) => option.id === (filters.sort ?? "newest"),
                )?.label ?? "Newest"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openSheet("sort")}
                  className="rounded-full border border-[var(--border-soft)] px-3 py-1 text-[13px]"
                >
                  Sort
                </button>
                <button
                  type="button"
                  onClick={() => openSheet("size")}
                  className="flex items-center gap-2 rounded-full border border-[var(--border-soft)] px-3 py-1 text-[13px]"
                >
                  Filter
                  {filters.size.length ||
                  filters.colors.length ||
                  filters.price ? (
                    <span className="rounded-full bg-gold px-2 text-xs text-charcoal">
                      {filters.size.length +
                        filters.colors.length +
                        (filters.price ? 1 : 0)}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          </div>
        </AnimatedWrapper>
      </section>

      <section id="product-grid" className="mx-auto mt-6 max-w-6xl px-4 pb-24">
        <h2 className="mb-3 text-[18px] font-semibold">Our Collection</h2>
        {activeChips.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <button
                key={`${chip.type}-${chip.value}`}
                type="button"
                onClick={() => removeChip(chip)}
                className="interactive-feedback rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-ink shadow-soft"
              >
                {chip.type === "price"
                  ? priceRanges.find((range) => range.id === chip.value)?.label
                  : chip.type === "sort"
                    ? sortOptions.find((option) => option.id === chip.value)
                        ?.label
                    : chip.value}
                <span className="ml-2 text-accent">✕</span>
              </button>
            ))}
          </div>
        ) : null}

        <SectionLoader
          loading={!hasMounted || isLoading}
          loader={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={`skeleton-${index}`} />
              ))}
            </div>
          }
        >
          {visibleProducts.length === 0 ? (
            <div className="rounded-3xl bg-card p-6 text-center shadow-soft">
              <p className="text-base font-semibold text-ink">
                No products found.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                Adjust filters or check back soon.
              </p>
            </div>
          ) : (
            <motion.div
              key={productBatchKey}
              className={clsx(
                "grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                !prefersReducedMotion && "retail-batch-enter",
              )}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.22,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {visibleProducts.map((product, index) => (
                <AnimatedWrapper
                  key={product.id}
                  variant="product-card"
                  delay={
                    prefersReducedMotion ? 0 : Math.min(index * 0.02, 0.12)
                  }
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
                    sizeErrorLabel={text.sizeError}
                    isRouting={isRouting}
                  />
                </AnimatedWrapper>
              ))}
            </motion.div>
          )}
        </SectionLoader>

        <section className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="space-y-1">
            <p className="text-[13px] font-semibold leading-[1.5] text-black">
              🚚 Fast Nationwide Delivery
            </p>
            <p className="text-[12px] leading-[1.4] text-[var(--text-secondary)]">
              Reliable delivery across Bangladesh.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[13px] font-semibold leading-[1.5] text-black">
              🔒 Secure Order Handling
            </p>
            <p className="text-[12px] leading-[1.4] text-[var(--text-secondary)]">
              Safe data and verified order process.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[13px] font-semibold leading-[1.5] text-black">
              💬 WhatsApp Order Support
            </p>
            <p className="text-[12px] leading-[1.4] text-[var(--text-secondary)]">
              Quick support from real agents.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[13px] font-semibold leading-[1.5] text-black">
              💵 Cash on Delivery
            </p>
            <p className="text-[12px] leading-[1.4] text-[var(--text-secondary)]">
              Pay after delivery confirmation.
            </p>
          </div>
        </section>

        {recentlyViewed.length > 0 ? (
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold">
                Recently Viewed
              </h2>
              <span className="text-[12px] font-semibold text-muted">
                Last 2 items
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {recentlyViewed.map((product, index) => (
                <AnimatedWrapper
                  key={product.id}
                  variant="product-card"
                  delay={prefersReducedMotion ? 0 : Math.min(index * 0.02, 0.1)}
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
                    sizeErrorLabel={text.sizeError}
                    isRouting={isRouting}
                  />
                </AnimatedWrapper>
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <footer className="mt-16 border-t border-[var(--border-soft)] bg-[var(--bar-maroon-soft)]">
        <div className="mx-auto grid max-w-6xl gap-8 space-y-0 px-4 pb-20 pt-14 md:grid-cols-3">
          <div>
            <h3 className="font-heading text-[20px] font-semibold">
              Tacin Arabi Collection
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Your trusted online fashion shop in Bangladesh for kurti, modest
              wear, and ceramic lifestyle picks—powered by WhatsApp-first
              ordering.
            </p>
            <p className="mt-3 text-[13px] font-semibold text-ink">
              WhatsApp: +8801522119189
            </p>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-ink">
              Store Policies
            </h4>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              <li>Cash on Delivery available nationwide</li>
              <li>Delivery confirmation before dispatch</li>
              <li>Support available 10am–10pm daily</li>
            </ul>
          </div>
          <div className="mt-8 space-y-4">
            <h3 className="text-[15px] font-semibold leading-[1.4] text-black">
              Connect With Us
            </h3>
            <div className="flex items-center gap-4 text-black">
              <a
                href="https://www.facebook.com/tacinarabicollection"
                target="_blank"
                rel="noreferrer"
                className="interactive-feedback hover:opacity-80"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/tacinarabi"
                target="_blank"
                rel="noreferrer"
                className="interactive-feedback hover:opacity-80"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://pin.it/5Om9YG8GY"
                target="_blank"
                rel="noreferrer"
                className="interactive-feedback hover:opacity-80"
                aria-label="Pinterest"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-800 text-[11px] font-semibold leading-none">
                  P
                </span>
              </a>
            </div>
            <div className="text-[14px] font-medium leading-[1.6] text-black">
              📞 +8801522119189
            </div>
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

      <a
        href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
        target="_blank"
        rel="noreferrer"
        aria-disabled={!isOnline}
        className={clsx(
          "floating-action interactive-feedback group fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-xl ring-2 ring-white",
          !isOnline && "pointer-events-none opacity-60",
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
              !prefersReducedMotion && "animate-ping",
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
                <p className="text-[12px] font-semibold text-muted">
                  Quick View
                </p>
                <h3 className="text-base font-semibold text-ink">
                  {detailsProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsProduct(null)}
                className="text-[13px] font-semibold text-accent"
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
              <div className="flex-1 text-[13px] text-muted leading-relaxed">
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
                    "rounded-lg border px-4 py-2 text-[13px] font-semibold",
                    selectedSizes[detailsProduct.id] === size
                      ? "border-accent bg-accent text-white"
                      : "border-[#e6d8ce]",
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
                      Math.max(1, (quantities[detailsProduct.id] ?? 1) - 1),
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
                      (quantities[detailsProduct.id] ?? 1) + 1,
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
                  disabled={!selectedSizes[detailsProduct.id] || isRouting}
                  className={clsx(
                    "min-h-[44px] rounded-lg px-4 py-2 text-[13px] font-semibold",
                    selectedSizes[detailsProduct.id]
                      ? "bg-accent text-white"
                      : "cursor-not-allowed bg-[#e6d8ce] text-muted",
                  )}
                >
                  {text.buyNow}
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCart(detailsProduct)}
                  disabled={!selectedSizes[detailsProduct.id] || isRouting}
                  className={clsx(
                    "min-h-[44px] rounded-lg border px-4 py-2 text-[13px] font-semibold",
                    selectedSizes[detailsProduct.id]
                      ? "border-accent text-accent"
                      : "cursor-not-allowed border-[#e6d8ce] text-muted",
                  )}
                >
                  {text.addToCart}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCart || showCheckout ? (
        <div className="pointer-events-none fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
      ) : null}

      {showCart ? (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-[fadeSlideUp_0.25s_ease]">
          <div className="flex items-center justify-between border-b border-[#f0e4da] p-4">
            <button
              type="button"
              aria-label="Back"
              onClick={() => setShowCart(false)}
              className="interactive-feedback min-h-12 rounded-xl px-2 text-xl text-ink"
            >
              ←
            </button>
            <h3 ref={cartHeadingRef} tabIndex={-1} className="text-lg font-semibold text-ink">
              Your Cart
            </h3>
            <button
              type="button"
              onClick={() => setShowCart(false)}
              className="interactive-feedback min-h-12 rounded-xl px-2 text-[13px] font-semibold text-accent"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isCartHydrating ? (
              <CartSkeleton />
            ) : cartItems.length === 0 ? (
              <div className="rounded-2xl border border-[#f0e4da] bg-base p-4 text-center">
                <p className="text-lg">🛍️</p>
                <p className="mt-2 text-sm font-semibold text-ink">Your cart is empty.</p>
                <p className="mt-1 text-[12px] text-muted">Start shopping to add items.</p>
                <button
                  type="button"
                  onClick={() => setShowCart(false)}
                  className="interactive-feedback mt-3 min-h-12 rounded-xl border border-[#e6d8ce] px-4 py-2 text-[12px] font-semibold text-ink"
                >
                  Browse products
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div
                      key={`${item.id}-${item.size}-${index}`}
                      className={clsx(
                        "flex gap-4 rounded-xl border border-[#f0e4da] bg-white p-4 shadow-sm transition duration-200",
                        cartActionLoading[index] && "scale-[0.98] opacity-70",
                      )}
                    >
                      <Image
                        src={item.imageUrl ?? item.image ?? "/images/product-1.svg"}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <div className="flex flex-1 items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-base font-medium text-ink">{item.name}</p>
                          <p className="text-[12px] text-muted">Size: {item.size} · Color: {item.color}</p>
                          <p className="mt-1 font-semibold text-ink">{formatPrice(item.price)}</p>
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
                              onClick={() => void updateCartQuantity(index, item.quantity - 1)}
                              className="rounded-full px-2 transition-transform duration-200 hover:scale-105 active:scale-95"
                            >
                              -
                            </button>
                            <span className="text-[13px] font-semibold">{item.quantity}</span>
                            <button
                              type="button"
                              disabled={cartActionLoading[index]}
                              onClick={() => void updateCartQuantity(index, item.quantity + 1)}
                              className="rounded-full px-2 transition-transform duration-200 hover:scale-105 active:scale-95"
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
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{text.subtotal}</span>
                  <motion.span
                    key={getSafeCartSubtotal(cartItems)}
                    initial={{ opacity: 0.45, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isCartHydrating ? <SummaryPlaceholder /> : formatPrice(getSafeCartSubtotal(cartItems))}
                  </motion.span>
                </div>
              </>
            )}
          </div>
          {cartItems.length > 0 ? (
            <div className="sticky bottom-0 bg-white border-t border-[#f0e4da] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={handleCartCheckout}
                className="interactive-feedback min-h-14 h-14 w-full rounded-xl bg-[var(--bar-maroon)] px-4 text-[14px] font-semibold text-white shadow-md transition-all duration-300 hover:opacity-90 active:scale-95"
              >
                {isRouting ? "Redirecting..." : text.checkout}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}


      {showCheckout ? (
        <div
          ref={checkoutRef}
          className="fixed inset-0 z-50 bg-white flex flex-col animate-[fadeSlideUp_0.25s_ease]"
        >
            <div className="flex items-center justify-between border-b border-[#f0e4da] p-4">
            <button
              type="button"
              aria-label="Back"
              onClick={() => {
                setShowCheckout(false);
                setIsOrderConfirmed(false);
                setIsSubmitting(false);
              }}
              className="interactive-feedback min-h-12 rounded-xl px-2 text-xl text-ink"
            >
              ←
            </button>
            <h3 ref={checkoutHeadingRef} tabIndex={-1} className="text-lg font-semibold text-ink">
              Checkout
            </h3>
            <button
                  type="button"
                  onClick={() => {
                    setShowCheckout(false);
                    setIsOrderConfirmed(false);
                    setIsSubmitting(false);
                  }}
                  className="interactive-feedback min-h-12 rounded-xl px-2 text-[13px] font-semibold text-accent"
                >
                  Close
                </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
              {isOrderConfirmed ? (
                <div className="mx-auto w-full max-w-4xl">
                  <div className="text-center py-16 transition-opacity duration-300 animate-fadeIn">
                    <h2 className="text-2xl font-semibold mb-4">
                      Order Confirmed
                    </h2>
                    <p className="text-[var(--text-secondary)]">
                      We will contact you shortly via phone or WhatsApp.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-4xl">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="max-w-[680px] space-y-4">
                      <h2 className="text-base font-semibold mb-4">
                        Order Summary
                      </h2>
                      <div className="rounded-2xl border border-[#f0e4da] p-3">
                        <div className="space-y-3 text-[13px]">
                          {checkoutItems.map((item, index) => (
                            <div
                              key={`${item.id}-${item.size}-${index}`}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0e4da] p-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Image
                                  src={
                                    item.imageUrl ||
                                    item.image ||
                                    "/images/product-1.svg"
                                  }
                                  alt={item.name}
                                  width={60}
                                  height={86}
                                  className="rounded-lg object-cover w-[60px] h-[86px] shrink-0"
                                  unoptimized={false}
                                />
                                <div className="min-w-0">
                                  <p className="font-semibold text-ink break-words">
                                    {item.name}
                                  </p>
                                  <p className="text-[12px] text-muted">
                                    Size: {item.size} · Qty: {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <p className="font-semibold text-ink whitespace-nowrap">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#f0e4da] p-3">
                        <p className="text-[12px] font-semibold text-ink">
                          {text.deliveryZone}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDeliveryZone("inside")}
                            className={clsx(
                              "interactive-feedback min-h-[40px] flex-1 rounded-lg border px-3 py-1.5 text-[12px] font-semibold",
                              deliveryZone === "inside"
                                ? "border-accent bg-accent text-white"
                                : "border-[#e6d8ce]",
                            )}
                          >
                            {text.insideDhaka}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeliveryZone("outside")}
                            className={clsx(
                              "interactive-feedback min-h-[40px] flex-1 rounded-lg border px-3 py-1.5 text-[12px] font-semibold",
                              deliveryZone === "outside"
                                ? "border-accent bg-accent text-white"
                                : "border-[#e6d8ce]",
                            )}
                          >
                            {text.outsideDhaka}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 rounded-2xl border border-[#f0e4da] p-3 text-xs text-black">
                        <div className="flex items-center justify-between">
                          <span>{text.subtotal}</span>
                          <span className="text-black font-medium">
                            {isSummaryLoading ? (
                              <SummaryPlaceholder />
                            ) : (
                              formatPrice(checkoutSubtotal)
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{text.deliveryCharge}</span>
                          <span className="text-black font-medium">
                            {isSummaryLoading ? (
                              <SummaryPlaceholder widthClass="w-12" />
                            ) : (
                              formatPrice(deliveryFee)
                            )}
                          </span>
                        </div>
                        <div className="mt-3 flex justify-between border-t pt-3 text-[16px] font-semibold">
                          <span>{text.totalPayable}</span>
                          <span className="text-black">
                            {isSummaryLoading ? (
                              <SummaryPlaceholder />
                            ) : (
                              formatPrice(checkoutTotal)
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-[var(--text-secondary)] mt-3 space-y-1">
                        <p>✓ Cash on Delivery Available</p>
                        <p>✓ Nationwide Delivery</p>
                        <p>✓ WhatsApp Confirmation</p>
                      </div>
                    </div>

                    <div>
                      <h2 className="mb-4 text-base font-semibold">
                        Shipping Information
                      </h2>
                      <div
                        className={clsx(
                          "grid gap-4",
                          isFieldShake && "animate-checkout-shake",
                        )}
                      >
                        <label
                          htmlFor="checkout-name"
                          className="text-xs font-semibold text-[var(--text-secondary)]"
                        >
                          Full Name <span className="text-red-500">*</span>
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
                          aria-required="true"
                          className="w-full rounded-lg border border-[var(--border-soft)] p-3 text-[14px] transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <label
                          htmlFor="checkout-phone"
                          className="text-xs font-semibold text-[var(--text-secondary)]"
                        >
                          Phone <span className="text-red-500">*</span>
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
                          aria-required="true"
                          className="w-full rounded-lg border border-[var(--border-soft)] p-3 text-[14px] transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <label
                          htmlFor="checkout-address"
                          className="text-xs font-semibold text-[var(--text-secondary)]"
                        >
                          Address <span className="text-red-500">*</span>
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
                          aria-required="true"
                          className="w-full rounded-lg border border-[var(--border-soft)] p-3 text-[14px] transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>

                      <div className="text-xs text-[var(--text-secondary)] mt-4">
                        🔒 Your information is secure and will not be shared.
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isOrderConfirmed ? (
              <div className="sticky bottom-0 bg-white border-t border-[#f0e4da] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="mx-auto w-full max-w-4xl">
                  <button
                    type="button"
                    onClick={handlePaymentInfoOpen}
                    disabled={isCheckoutBlocked}
                    className={clsx(
                      "interactive-feedback min-h-14 h-14 w-full rounded-xl bg-[var(--bar-maroon)] px-4 text-[14px] font-semibold text-white shadow-md transition-all duration-300 hover:opacity-90 active:scale-95",
                      isCheckoutBlocked && "cursor-not-allowed opacity-60",
                    )}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                        Processing...
                      </span>
                    ) : (
                      "Pay Now"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWhatsappRedirect("Cash on Delivery")}
                    disabled={isCheckoutBlocked}
                    className={clsx(
                      "interactive-feedback mt-3 min-h-14 h-14 w-full rounded-xl bg-green-600 px-4 text-[14px] font-semibold text-white shadow-md transition-all duration-300 active:scale-95",
                      isCheckoutBlocked && "cursor-not-allowed opacity-60",
                    )}
                  >
                    {isSubmitting ? "Processing..." : text.orderCod}
                  </button>
                  <p className="mt-3 text-[12px] text-[var(--text-secondary)]">
                    Cash on Delivery available nationwide. You will receive
                    confirmation before dispatch.
                  </p>
                </div>
              </div>
            ) : null}
        </div>
      ) : null}

      {showPaymentInfo ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40">
          <div className="panel-enter w-full rounded-t-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-muted">
                  Payment Info
                </p>
                <h3 className="text-base font-semibold text-ink">
                  bKash / Nagad Transfer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentInfo(false);
                  setIsSubmitting(false);
                }}
                className="interactive-feedback text-[13px] font-semibold text-accent"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-1 text-[13px]">
              <p>
                bKash: <span className="font-semibold">{paymentNumber}</span>
              </p>
              <p>
                Nagad: <span className="font-semibold">{paymentNumber}</span>
              </p>
              <p className="text-[12px] text-muted">
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
                className="w-full rounded-xl border border-[#e6d8ce] px-4 py-2.5 text-[14px]"
              />
            </div>
            <button
              type="button"
              disabled={
                isSubmitting ||
                !hasPaymentProof ||
                !isOnline ||
                checkoutItems.length === 0 ||
                checkoutTotal <= 0 ||
                !Number.isFinite(checkoutTotal)
              }
              onClick={() => handleWhatsappRedirect("bKash/Nagad")}
              className={clsx(
                "interactive-feedback mt-6 min-h-[44px] w-full rounded-lg px-4 py-2.5 text-[14px] font-semibold",
                hasPaymentProof && isOnline && !isSubmitting
                  ? "bg-accent text-white"
                  : "opacity-60 cursor-not-allowed bg-[#e6d8ce] text-muted",
              )}
            >
              {isSubmitting ? "Processing..." : text.confirmWhatsapp}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
