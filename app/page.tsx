"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import ProductCard from "../components/ProductCard";
import { products, type Product } from "../lib/products";

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

type CartItem = {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
};

type Filters = {
  size: string[];
  colors: string[];
  price: string | null;
  sort: string | null;
};

type CustomerInfo = {
  name: string;
  phone: string;
  address: string;
};

type AddState = "idle" | "loading" | "success";

type Language = "en" | "bn";

const defaultFilters: Filters = {
  size: [],
  colors: [],
  price: null,
  sort: "newest",
};

const storageKeys = {
  cart: "tacin-cart",
  viewed: "tacin-recently-viewed",
  language: "tacin-lang",
};

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
const addedToCartNotice = "Added to cart";

const formatPrice = (price: number) => `৳${price.toLocaleString("en-BD")}`;

const getOrderSubtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const buildWhatsAppMessage = (options: {
  customer: CustomerInfo;
  items: CartItem[];
  paymentMethod: string;
  deliveryZone: string;
  deliveryFee: number;
  transactionId?: string;
  paymentScreenshot?: string;
}) => {
  const subtotal = getOrderSubtotal(options.items);
  const total = subtotal + options.deliveryFee;
  const lines = [
    `Assalamualaikum! New order from Tacin Arabi Collection`,
    `Name: ${options.customer.name}`,
    `Phone: ${options.customer.phone}`,
    `Address: ${options.customer.address}`,
    ``,
    `Order Details:`,
    ...options.items.map(
      (item, index) =>
        `${index + 1}. ${item.name} | Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity} | ${formatPrice(
          item.price * item.quantity
        )}`
    ),
    ``,
    `Subtotal: ${formatPrice(subtotal)}`,
    `Delivery Zone: ${options.deliveryZone}`,
    `Delivery Charge: ${formatPrice(options.deliveryFee)}`,
    `Total Payable: ${formatPrice(total)}`,
    `Payment Method: ${options.paymentMethod}`,
  ];

  if (options.transactionId) {
    lines.push(`Transaction ID: ${options.transactionId}`);
  }

  if (options.paymentScreenshot) {
    lines.push(`Payment Screenshot: ${options.paymentScreenshot}`);
  }

  return encodeURIComponent(lines.join("\n"));
};

export default function HomePage() {
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<Filters>(defaultFilters);
  const [activeSheet, setActiveSheet] = useState<
    "size" | "color" | "price" | "sort" | null
  >(null);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
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

  const text = copy[language];

  useEffect(() => {
    const storedCart = localStorage.getItem(storageKeys.cart);
    const storedViewed = localStorage.getItem(storageKeys.viewed);
    const storedLanguage = localStorage.getItem(storageKeys.language) as Language | null;

    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch {
        setCartItems([]);
      }
    }

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

  useEffect(() => {
    localStorage.setItem(storageKeys.cart, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(storageKeys.viewed, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    localStorage.setItem(storageKeys.language, language);
  }, [language]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

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
    setQuantities((prev) => ({ ...prev, [productId]: quantity }));
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

  const handleAddToCart = (product: Product) => {
    markRecentlyViewed(product);
    const selectedSize = selectedSizes[product.id];
    if (!selectedSize) return;

    setAddStates((prev) => ({ ...prev, [product.id]: "loading" }));
    const quantity = quantities[product.id] ?? 1;
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.size === selectedSize
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.size === selectedSize
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        {
          id: product.id,
          name: product.name,
          price: product.price,
          size: selectedSize,
          color: product.colors[0],
          quantity,
          image: product.image,
        },
        ...prev,
      ];
    });
    setToast(addedToCartNotice);
    setCartNotice(`${product.name} ${addedToCartNotice}`);
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
    const quantity = quantities[product.id] ?? 1;
    setCheckoutItems([
      {
        id: product.id,
        name: product.name,
        price: product.price,
        size: selectedSize,
        color: product.colors[0],
        quantity,
        image: product.image,
      },
    ]);
    setShowCheckout(true);
  };

  const handleCartCheckout = () => {
    if (cartItems.length === 0) return;
    setCheckoutItems(cartItems);
    setShowCheckout(true);
    setShowCart(false);
  };

  const handleWhatsappRedirect = (paymentMethod: string) => {
    const deliveryFee = deliveryFees[deliveryZone];
    const message = buildWhatsAppMessage({
      customer,
      items: checkoutItems,
      paymentMethod,
      deliveryZone: deliveryZone === "inside" ? text.insideDhaka : text.outsideDhaka,
      deliveryFee,
      transactionId: transactionId.trim() || undefined,
      paymentScreenshot: paymentScreenshot || undefined,
    });
    const url = `https://wa.me/${whatsappNumber.replace(
      /\D/g,
      ""
    )}?text=${message}`;
    window.location.href = url;
    setCartItems([]);
    setCheckoutItems([]);
    setShowCheckout(false);
    setShowPaymentInfo(false);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

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
  }, [filters]);

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

  const openSheet = (sheet: "size" | "color" | "price" | "sort") => {
    setDraftFilters(filters);
    setActiveSheet(sheet);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setActiveSheet(null);
  };

  const clearFilters = () => {
    setDraftFilters(defaultFilters);
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
    setCartQuantityFeedback((prev) => ({
      ...prev,
      [index]: qtyUpdatedMessage,
    }));
    window.setTimeout(() => {
      setCartQuantityFeedback((prev) => ({ ...prev, [index]: "" }));
    }, 1000);
  };

  const removeCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const isCustomerInfoValid =
    customer.name.trim() && customer.phone.trim() && customer.address.trim();

  const checkoutSubtotal = getOrderSubtotal(checkoutItems);
  const deliveryFee = deliveryFees[deliveryZone];
  const checkoutTotal = checkoutSubtotal + deliveryFee;
  const hasPaymentProof = Boolean(transactionId.trim() || paymentScreenshot);

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-base">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-accent">
                WhatsApp-first shopping
              </p>
              <button
                type="button"
                onClick={() =>
                  setLanguage((prev) => (prev === "en" ? "bn" : "en"))
                }
                className="rounded-full border border-[#e6d8ce] bg-white px-3 py-1 text-xs font-semibold text-ink"
              >
                {language === "en" ? "বাংলা" : "EN"}
              </button>
            </div>
            <h1 className="mt-3 font-heading text-3xl font-bold text-ink md:text-4xl">
              WhatsApp checkout in minutes, shipped anywhere in Bangladesh.
            </h1>
            <p className="mt-3 text-sm text-muted md:text-base">
              Tacin Arabi Collection curates fashion and ceramics with fast COD
              fulfillment and real-time WhatsApp ordering for busy customers.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink shadow-soft opacity-0 animate-[fadeUp_0.9s_ease-out_forwards]">
                COD Nationwide
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink shadow-soft opacity-0 animate-[fadeUp_0.9s_ease-out_forwards] [animation-delay:120ms]">
                WhatsApp Ordering
              </span>
            </div>
          </div>
          <div className="rounded-3xl bg-card p-6 shadow-soft opacity-0 animate-[fadeUp_0.8s_ease-out_forwards]">
            <h2 className="font-heading text-xl font-semibold">
              Quick Order Promise
            </h2>
            <p className="mt-2 text-sm text-muted">
              Select your size, tap buy now, and finish checkout in seconds. No
              account needed.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span>Fast checkout popup</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span>Cart saved in your device</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span>Secure WhatsApp confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="sticky top-0 z-20 bg-base/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => openSheet("size")}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft"
            >
              Filters
              {(filters.size.length ||
                filters.colors.length ||
                filters.price) && (
                <span className="rounded-full bg-accent px-2 text-xs text-white">
                  {filters.size.length +
                    filters.colors.length +
                    (filters.price ? 1 : 0)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => openSheet("sort")}
              className="rounded-full border border-[#e6d8ce] bg-white px-4 py-2 text-sm font-semibold text-ink"
            >
              Sort
            </button>
            <button
              type="button"
              onClick={() => openSheet("price")}
              className="rounded-full border border-[#e6d8ce] bg-white px-4 py-2 text-sm font-semibold text-ink"
            >
              Price
            </button>
            <button
              type="button"
              onClick={() => openSheet("color")}
              className="rounded-full border border-[#e6d8ce] bg-white px-4 py-2 text-sm font-semibold text-ink"
            >
              Color
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6">
        {activeChips.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <button
                key={`${chip.type}-${chip.value}`}
                type="button"
                onClick={() => removeChip(chip)}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink shadow-soft"
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              selectedSize={selectedSizes[product.id]}
              quantity={quantities[product.id] ?? 1}
              onSizeChange={(size) => updateSize(product.id, size)}
              onQuantityChange={(quantity) => updateQuantity(product.id, quantity)}
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
            />
          ))}
        </div>

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
              {recentlyViewed.map((product) => (
                <ProductCard
                  key={product.id}
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
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      ) : null}

      {cartNotice ? (
        <div className="fixed bottom-32 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink shadow-soft">
          <span>{cartNotice}</span>
          <button
            type="button"
            onClick={() => setCartNotice(null)}
            className="text-accent"
          >
            ✕
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowCart(true)}
        className="group fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center overflow-hidden rounded-full bg-white shadow-soft transition-all duration-300 hover:w-32"
        aria-label="Open cart"
      >
        <span
          className={clsx(
            "relative flex h-14 w-14 items-center justify-center text-xl text-ink",
            cartBump && "animate-cart-bounce"
          )}
        >
          🛍️
          {cartItems.length > 0 ? (
            <span className="absolute -top-1 -right-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
              {cartItems.length}
            </span>
          ) : null}
        </span>
        <span className="whitespace-nowrap pr-4 text-sm font-semibold text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Cart
        </span>
      </button>

      <a
        href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
        target="_blank"
        rel="noreferrer"
        className="group fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center overflow-hidden rounded-full bg-[#25D366] shadow-soft transition-all duration-500 ease-out hover:w-56"
      >
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
            alt="WhatsApp"
            className="h-7 w-7"
          />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 animate-ping rounded-full bg-red-500" />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
        </div>
        <span className="whitespace-nowrap pr-5 text-sm font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Order via WhatsApp
        </span>
      </a>

      {activeSheet ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40">
          <div className="w-full rounded-t-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink">
                {activeSheet === "size"
                  ? "Filter by Size"
                  : activeSheet === "color"
                  ? "Filter by Color"
                  : activeSheet === "price"
                  ? "Filter by Price"
                  : "Sort Products"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="text-sm font-semibold text-accent"
              >
                Close
              </button>
            </div>

            {activeSheet === "size" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {["M", "L", "XL"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        size: prev.size.includes(size)
                          ? prev.size.filter((item) => item !== size)
                          : [...prev.size, size],
                      }))
                    }
                    className={clsx(
                      "rounded-full border px-4 py-2 text-sm font-semibold",
                      draftFilters.size.includes(size)
                        ? "border-accent bg-accent text-white"
                        : "border-[#e6d8ce]"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            ) : null}

            {activeSheet === "color" ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {[
                  "Beige",
                  "Olive",
                  "Maroon",
                  "Black",
                  "Ivory",
                  "Sand",
                  "Terracotta",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        colors: prev.colors.includes(color)
                          ? prev.colors.filter((item) => item !== color)
                          : [...prev.colors, color],
                      }))
                    }
                    className={clsx(
                      "rounded-full border px-4 py-2 text-sm font-semibold",
                      draftFilters.colors.includes(color)
                        ? "border-accent bg-accent text-white"
                        : "border-[#e6d8ce]"
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            ) : null}

            {activeSheet === "price" ? (
              <div className="mt-4 flex flex-col gap-2">
                {priceRanges.map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        price: prev.price === range.id ? null : range.id,
                      }))
                    }
                    className={clsx(
                      "rounded-2xl border px-4 py-3 text-left text-sm font-semibold",
                      draftFilters.price === range.id
                        ? "border-accent bg-accent text-white"
                        : "border-[#e6d8ce]"
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            ) : null}

            {activeSheet === "sort" ? (
              <div className="mt-4 flex flex-col gap-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        sort: option.id,
                      }))
                    }
                    className={clsx(
                      "rounded-2xl border px-4 py-3 text-left text-sm font-semibold",
                      draftFilters.sort === option.id
                        ? "border-accent bg-accent text-white"
                        : "border-[#e6d8ce]"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-[44px] rounded-full border border-[#e6d8ce] px-4 py-2 text-sm font-semibold text-ink"
              >
                {text.clear}
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="min-h-[44px] rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
              >
                {text.applyFilters}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detailsProduct ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40">
          <div className="w-full rounded-t-3xl bg-white p-6">
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
              <h3 className="text-lg font-semibold text-ink">Your Cart</h3>
              <button
                type="button"
                onClick={() => setShowCart(false)}
                className="text-sm font-semibold text-accent"
              >
                Close
              </button>
            </div>
            {cartItems.length === 0 ? (
              <p className="mt-6 text-sm text-muted">Your cart is empty.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.id}-${item.size}-${index}`}
                    className="flex items-center gap-4 rounded-2xl border border-[#f0e4da] p-3"
                  >
                    <Image
                      src={item.image}
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
                          onClick={() =>
                            updateCartQuantity(index, item.quantity - 1)
                          }
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(index, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCartItem(index)}
                        className="text-xs font-semibold text-accent"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{text.subtotal}</span>
                  <span>{formatPrice(getOrderSubtotal(cartItems))}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCartCheckout}
                  className="min-h-[44px] w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white"
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
          <div className="w-full rounded-t-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted">
                  Universal Checkout
                </p>
                <h3 className="text-lg font-semibold text-ink">
                  Confirm your order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="text-sm font-semibold text-accent"
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
                    "min-h-[44px] flex-1 rounded-full border px-4 py-2 text-sm font-semibold",
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
                    "min-h-[44px] flex-1 rounded-full border px-4 py-2 text-sm font-semibold",
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
                  {formatPrice(checkoutSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{text.deliveryCharge}</span>
                <span className="font-semibold">
                  {formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold">
                <span>{text.totalPayable}</span>
                <span>{formatPrice(checkoutTotal)}</span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <input
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
              <input
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
              <textarea
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
                disabled={!isCustomerInfoValid}
                className={clsx(
                  "min-h-[48px] rounded-full px-4 py-3 text-sm font-semibold",
                  isCustomerInfoValid
                    ? "bg-accent text-white"
                    : "cursor-not-allowed bg-[#e6d8ce] text-muted"
                )}
              >
                {text.orderCod}
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentInfo(true)}
                disabled={!isCustomerInfoValid}
                className={clsx(
                  "min-h-[48px] rounded-full border px-4 py-3 text-sm font-semibold",
                  isCustomerInfoValid
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
          <div className="w-full rounded-t-3xl bg-white p-6">
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
                className="text-sm font-semibold text-accent"
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
                Please pay first, then paste your Transaction ID or upload a
                screenshot.
              </p>
              <input
                type="text"
                placeholder="Transaction ID"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                className="w-full rounded-2xl border border-[#e6d8ce] px-4 py-3 text-sm"
              />
              <div className="rounded-2xl border border-dashed border-[#e6d8ce] px-4 py-3">
                <label className="block text-xs font-semibold text-muted">
                  Upload payment screenshot
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setPaymentScreenshot(
                      event.target.files?.[0]?.name ?? null
                    )
                  }
                  className="mt-2 w-full text-xs"
                />
                {paymentScreenshot ? (
                  <p className="mt-2 text-xs font-semibold text-ink">
                    {paymentScreenshot}
                  </p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              disabled={!hasPaymentProof}
              onClick={() => handleWhatsappRedirect("bKash/Nagad")}
              className={clsx(
                "mt-6 min-h-[48px] w-full rounded-full px-4 py-3 text-sm font-semibold",
                hasPaymentProof
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
