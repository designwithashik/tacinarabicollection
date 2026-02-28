import { kv } from "@vercel/kv";

export const INVENTORY_PRODUCTS_KEY = "inventory:products";

type InventoryRecord = Record<string, unknown>;

export type InventoryProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  active: boolean;
  createdAt: number;
  updatedAt?: number;
  category?: string;
  colors?: string[];
  sizes?: string[];
  description?: string;
  whatsappNumber?: string;
  heroFeatured?: boolean;
  stock?: number;
};

const isRecord = (value: unknown): value is InventoryRecord =>
  Boolean(value && typeof value === "object");

const normalizeImageUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith("http")) return null;
  return trimmed;
};

const toInventoryProduct = (source: unknown): InventoryProduct | null => {
  if (!isRecord(source)) return null;

  const id = typeof source.id === "string" && source.id ? source.id : null;
  const name = typeof source.name === "string" && source.name ? source.name : null;
  const price =
    typeof source.price === "number"
      ? source.price
      : typeof source.price === "string"
        ? Number(source.price)
        : Number.NaN;

  const stock =
    typeof source.stock === "number"
      ? source.stock
      : typeof source.stock === "string"
        ? Number(source.stock)
        : undefined;

  if (!id || !name || !Number.isFinite(price)) return null;

  return {
    id,
    name,
    price,
    imageUrl:
      normalizeImageUrl(source.imageUrl) ?? normalizeImageUrl(source.image) ?? null,
    active: source.active !== false,
    createdAt:
      typeof source.createdAt === "number"
        ? source.createdAt
        : Date.parse(String(source.createdAt ?? "")) || Date.now(),
    updatedAt:
      typeof source.updatedAt === "number"
        ? source.updatedAt
        : Date.parse(String(source.updatedAt ?? "")) || undefined,
    category: typeof source.category === "string" ? source.category : undefined,
    colors: Array.isArray(source.colors)
      ? source.colors.filter((c): c is string => typeof c === "string")
      : undefined,
    sizes: Array.isArray(source.sizes)
      ? source.sizes.filter((s): s is string => typeof s === "string")
      : undefined,
    description: typeof source.description === "string" ? source.description : undefined,
    whatsappNumber:
      typeof source.whatsappNumber === "string" ? source.whatsappNumber : undefined,
    heroFeatured: source.heroFeatured === true,
    stock:
      typeof stock === "number" && Number.isFinite(stock)
        ? Math.max(0, Math.floor(stock))
        : undefined,
  };
};

const normalizeInventoryCollection = (payload: unknown): InventoryProduct[] => {
  if (Array.isArray(payload)) {
    return payload.map(toInventoryProduct).filter((p): p is InventoryProduct => Boolean(p));
  }

  if (isRecord(payload)) {
    if (typeof payload.id === "string") {
      const single = toInventoryProduct(payload);
      return single ? [single] : [];
    }

    return Object.values(payload)
      .map(toInventoryProduct)
      .filter((p): p is InventoryProduct => Boolean(p));
  }

  return [];
};

async function tryLegacyMigration(): Promise<InventoryProduct[] | null> {
  try {
    const legacy = await kv.hgetall<Record<string, unknown>>("tacin_collection_final");
    if (!legacy || Object.keys(legacy).length === 0) return null;

    const normalized = Object.values(legacy)
      .map(toInventoryProduct)
      .filter((item): item is InventoryProduct => Boolean(item));

    return normalized.length ? normalized : null;
  } catch {
    // WRONGTYPE / missing / inaccessible legacy key should never crash runtime.
    return null;
  }
}

export async function loadInventoryArray(): Promise<InventoryProduct[]> {
  const canonical = await kv.get<InventoryProduct[] | unknown>(INVENTORY_PRODUCTS_KEY);
  const normalizedCanonical = normalizeInventoryCollection(canonical);

  if (normalizedCanonical.length > 0) {
    if (!Array.isArray(canonical)) {
      await kv.set(INVENTORY_PRODUCTS_KEY, normalizedCanonical);
    }

    return normalizedCanonical;
  }

  const migrated = await tryLegacyMigration();
  if (migrated && migrated.length > 0) {
    await kv.set(INVENTORY_PRODUCTS_KEY, migrated);
    return migrated;
  }

  return [];
}

export async function saveInventoryArray(items: InventoryProduct[]) {
  await kv.set(INVENTORY_PRODUCTS_KEY, items);
}

export type StorefrontProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  imageUrl: string | null;
  category: "Clothing" | "Ceramic";
  colors: string[];
  sizes: string[];
  active: boolean;
  updatedAt: string;
  createdAt: string;
  heroFeatured?: boolean;
  stock?: number;
};

export const toStorefrontProduct = (item: InventoryProduct): StorefrontProduct => ({
  id: item.id,
  name: item.name,
  price: item.price,
  image: item.imageUrl ?? "",
  imageUrl: item.imageUrl,
  category: item.category === "Ceramic" ? "Ceramic" : "Clothing",
  colors: item.colors?.length ? item.colors : ["Beige"],
  sizes: item.sizes?.length ? item.sizes : ["M", "L", "XL"],
  active: item.active,
  updatedAt: new Date(item.updatedAt ?? item.createdAt).toISOString(),
  createdAt: new Date(item.createdAt).toISOString(),
  heroFeatured: item.heroFeatured === true,
  stock: typeof item.stock === "number" ? item.stock : undefined,
});
