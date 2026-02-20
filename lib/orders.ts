import type { CartItem } from "./cart";

export type CustomerInfo = {
  name: string;
  phone: string;
  address: string;
};

export type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  deliveryZone: string;
  customer: CustomerInfo;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "failed";
};

const ORDERS_KEY = "tacin-orders";

export const getStoredOrders = (): Order[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(ORDERS_KEY);
    return stored ? (JSON.parse(stored) as Order[]) : [];
  } catch {
    return [];
  }
};

export const setStoredOrders = (orders: Order[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage errors.
  }
};

export const addOrder = (order: Order) => {
  const existing = getStoredOrders();
  setStoredOrders([order, ...existing]);
};
