import type { Product } from "./products";

export type AdminProduct = Product & {
  active: boolean;
  updatedAt: string;
};

const INVENTORY_KEY = "tacin-admin-products";

export const getStoredInventory = (): AdminProduct[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(INVENTORY_KEY);
    return stored ? (JSON.parse(stored) as AdminProduct[]) : [];
  } catch {
    return [];
  }
};

export const setStoredInventory = (items: AdminProduct[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors.
  }
};
