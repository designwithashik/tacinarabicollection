"use client";

import { useEffect, useState } from "react";
import { getStoredCart, setStoredCart, type CartItem } from "../lib/models/cart";

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartHydrating, setIsCartHydrating] = useState(true);

  useEffect(() => {
    setCartItems(getStoredCart());
    setIsCartHydrating(false);
  }, []);

  useEffect(() => {
    setStoredCart(cartItems);
  }, [cartItems]);

  return {
    cartItems,
    setCartItems,
    isCartHydrating,
    clearCart: () => setCartItems([]),
  };
}

export default useCart;
