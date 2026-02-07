export type CartItem = {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
};

const CART_KEY = "tacin-cart";

export const getStoredCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(CART_KEY);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
};

export const setStoredCart = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
};
