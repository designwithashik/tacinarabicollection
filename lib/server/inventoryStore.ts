type RedisScalar = string | number | boolean | null;

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
  title?: string;
  subtitle?: string;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const callRedis = async <T>(command: string, ...args: RedisScalar[]): Promise<T | null> => {
  if (!redisUrl || !redisToken) return null;

  const response = await fetch(`${redisUrl}/${command}/${args.map((arg) => encodeURIComponent(String(arg ?? ""))).join("/")}`, {
    headers: {
      Authorization: `Bearer ${redisToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as { result?: T };
  return payload.result ?? null;
};

const redisGet = <T>(key: string) => callRedis<T>("get", key);
const redisSet = async (key: string, value: unknown) => {
  await callRedis("set", key, JSON.stringify(value));
};
const redisHGetAll = <T>(key: string) => callRedis<T>("hgetall", key);

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
    title: typeof source.title === "string" ? source.title : undefined,
    subtitle: typeof source.subtitle === "string" ? source.subtitle : undefined,
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
    const legacy = await redisHGetAll<Record<string, unknown>>("tacin_collection_final");
    if (!legacy || Object.keys(legacy).length === 0) return null;

    const normalized = Object.values(legacy)
      .map((value) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return value as unknown;
          }
        }
        return value;
      })
      .map(toInventoryProduct)
      .filter((item): item is InventoryProduct => Boolean(item));

    return normalized.length ? normalized : null;
  } catch {
    return null;
  }
}

export async function loadInventoryArray(): Promise<InventoryProduct[]> {
  const canonicalRaw = await redisGet<InventoryProduct[] | string | unknown>(INVENTORY_PRODUCTS_KEY);

  if (typeof canonicalRaw === "string") {
    try {
      const parsed = JSON.parse(canonicalRaw) as unknown;
      return normalizeInventoryCollection(parsed);
    } catch {
      return [];
    }
  }

  if (Array.isArray(canonicalRaw)) {
    return normalizeInventoryCollection(canonicalRaw);
  }

  const migrated = await tryLegacyMigration();
  if (migrated && migrated.length > 0) {
    await redisSet(INVENTORY_PRODUCTS_KEY, migrated);
    return migrated;
  }

  return [];
}

export async function saveInventoryArray(items: InventoryProduct[]) {
  await redisSet(INVENTORY_PRODUCTS_KEY, items);
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
  title?: string;
  subtitle?: string;
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
  title: item.title ?? item.name,
  subtitle: item.subtitle ?? "",
});
