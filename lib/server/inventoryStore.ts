export const INVENTORY_PRODUCTS_KEY = "inventory:products";

type InventoryRecord = Record<string, unknown>;

type KvLike = {
  get: <T = unknown>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<unknown>;
  hgetall: <T = Record<string, unknown>>(key: string) => Promise<T | null>;
};

const memoryStore = new Map<string, unknown>();

const inMemoryKv: KvLike = {
  async get<T = unknown>(key: string) {
    return (memoryStore.get(key) as T | undefined) ?? null;
  },
  async set(key: string, value: unknown) {
    memoryStore.set(key, value);
  },
  async hgetall<T = Record<string, unknown>>(key: string) {
    const value = memoryStore.get(key);
    if (!value || typeof value !== "object") return null;
    return value as T;
  },
};

let cachedKv: Promise<KvLike> | null = null;

const getKv = async (): Promise<KvLike> => {
  if (!cachedKv) {
    const dynamicImport = new Function("m", "return import(m)") as (
      moduleName: string
    ) => Promise<{ kv: KvLike }>;

    cachedKv = dynamicImport("@vercel/kv")
      .then((module) => module.kv as KvLike)
      .catch(() => inMemoryKv);
  }

  return cachedKv;
};

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
    const kv = await getKv();
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
  const kv = await getKv();
  const canonical = await kv.get<InventoryProduct[] | unknown>(INVENTORY_PRODUCTS_KEY);

  if (Array.isArray(canonical)) {
    return normalizeInventoryCollection(canonical);
  }

  const migrated = await tryLegacyMigration();
  if (migrated && migrated.length > 0) {
    await kv.set(INVENTORY_PRODUCTS_KEY, migrated);
    return migrated;
  }

  return [];
}

export async function saveInventoryArray(items: InventoryProduct[]) {
  const kv = await getKv();
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
});
