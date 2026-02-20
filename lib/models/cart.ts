export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  size: string;
  color: string;
  quantity: number;
  // Backward-compatible legacy field for older localStorage payloads.
  image?: string;
};

const CART_KEY = "tacin-cart";

const toSafeNumber = (value: unknown, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeImageUrl = (raw: unknown): string | null => {
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw;
};

export const normalizeCartItem = (raw: unknown): CartItem | null => {
  // Defensive normalization prevents malformed localStorage or runtime payloads
  // from crashing the cart and keeps all items in one deterministic shape.
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Partial<CartItem> & Record<string, unknown>;

  if (typeof source.id !== "string" || !source.id.trim()) return null;
  if (typeof source.name !== "string" || !source.name.trim()) return null;

  const price = toSafeNumber(source.price);
  if (!Number.isFinite(price) || price < 0) return null;

  const quantity = Math.max(1, Math.floor(toSafeNumber(source.quantity, 1)));
  const imageUrl =
    normalizeImageUrl(source.imageUrl) ?? normalizeImageUrl(source.image) ?? null;

  return {
    id: source.id,
    name: source.name,
    price,
    quantity,
    imageUrl,
    size: typeof source.size === "string" ? source.size : "M",
    color: typeof source.color === "string" ? source.color : "",
    image: typeof source.image === "string" ? source.image : undefined,
  };
};

export const normalizeCartItems = (raw: unknown): CartItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeCartItem(item))
    .filter((item): item is CartItem => item !== null);
};

export const getStoredCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(CART_KEY);
    if (!stored) return [];
    // Defensive parse: corrupted JSON must fall back to empty deterministic cart.
    const parsed: unknown = JSON.parse(stored);
    return normalizeCartItems(parsed);
  } catch {
    return [];
  }
};

export const setStoredCart = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  try {
    // Persist normalized shape only so refresh/navigation always hydrate safely.
    window.localStorage.setItem(CART_KEY, JSON.stringify(normalizeCartItems(items)));
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
};

export const getSafeCartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => {
    const lineTotal = toSafeNumber(item.price) * Math.max(1, Math.floor(toSafeNumber(item.quantity, 1)));
    return sum + (Number.isFinite(lineTotal) ? lineTotal : 0);
  }, 0);
