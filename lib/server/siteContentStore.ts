import { kv } from "@vercel/kv";
import type { CarouselItem } from "@/lib/siteContent";

export const SITE_CAROUSEL_KEY = "site:carousel";

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  Boolean(value && typeof value === "object");

const normalizeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toCarouselItem = (value: unknown): CarouselItem | null => {
  if (!isRecord(value)) return null;

  const id = normalizeString(value.id) || crypto.randomUUID();
  const imageUrl = normalizeString(value.imageUrl);
  if (!imageUrl) return null;

  const parsedOrder =
    typeof value.order === "number"
      ? value.order
      : typeof value.order === "string"
        ? Number(value.order)
        : Number.NaN;

  return {
    id,
    imageUrl,
    title: normalizeString(value.title),
    subtitle: normalizeString(value.subtitle),
    buttonText: normalizeString(value.buttonText) || "Shop Now",
    buttonLink: normalizeString(value.buttonLink) || "/",
    active: value.active !== false,
    order: Number.isFinite(parsedOrder) ? parsedOrder : 0,
  };
};

const normalizeCarouselPayload = (payload: unknown): CarouselItem[] => {
  if (!Array.isArray(payload)) return [];

  return payload
    .map(toCarouselItem)
    .filter((item): item is CarouselItem => Boolean(item))
    .sort((a, b) => a.order - b.order);
};

export async function loadCarousel(): Promise<CarouselItem[]> {
  const payload = await kv.get<unknown>(SITE_CAROUSEL_KEY);
  return normalizeCarouselPayload(payload);
}

export async function saveCarousel(items: unknown[]) {
  const normalized = normalizeCarouselPayload(items);
  await kv.set(SITE_CAROUSEL_KEY, normalized);
}
