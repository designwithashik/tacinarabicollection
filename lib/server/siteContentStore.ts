import { kv } from "@vercel/kv";
import type {
  AnnouncementContent,
  CarouselItem,
  FilterPanelItem,
} from "@/lib/siteContent";

export const SITE_CAROUSEL_KEY = "site:carousel";
export const SITE_ANNOUNCEMENT_KEY = "site:announcement";
export const SITE_FILTERS_KEY = "site:filters";

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

const defaultFilters: FilterPanelItem[] = [
  {
    id: "all",
    label: "All",
    value: "All",
    active: true,
    highlight: true,
    order: 1,
  },
  {
    id: "clothing",
    label: "Clothing",
    value: "Clothing",
    active: true,
    highlight: false,
    order: 2,
  },
  {
    id: "ceramic",
    label: "Ceramic",
    value: "Ceramic",
    active: true,
    highlight: false,
    order: 3,
  },
];

const toFilterPanelItem = (value: unknown): FilterPanelItem | null => {
  if (!isRecord(value)) return null;

  const label = normalizeString(value.label);
  const mappedValue = normalizeString(value.value);
  if (!label || !mappedValue) return null;

  const parsedOrder =
    typeof value.order === "number"
      ? value.order
      : typeof value.order === "string"
        ? Number(value.order)
        : Number.NaN;

  const normalizedValue = mappedValue === "All" ? "All" : mappedValue;
  const id =
    normalizeString(value.id) ||
    `${normalizedValue.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    label,
    value: normalizedValue,
    active: value.active !== false,
    highlight: value.highlight === true,
    order: Number.isFinite(parsedOrder) ? parsedOrder : 0,
  };
};

const normalizeFiltersPayload = (payload: unknown): FilterPanelItem[] => {
  if (!Array.isArray(payload)) return defaultFilters;

  const normalized = payload
    .map(toFilterPanelItem)
    .filter((item): item is FilterPanelItem => Boolean(item))
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }));

  return normalized.length ? normalized : defaultFilters;
};

const normalizeAnnouncement = (payload: unknown): AnnouncementContent => {
  if (!isRecord(payload)) {
    return {
      text: "Free nationwide delivery updates • WhatsApp-first support • Elegant modest fashion curated for Bangladesh",
      active: true,
    };
  }

  return {
    text:
      normalizeString(payload.text) ||
      "Free nationwide delivery updates • WhatsApp-first support • Elegant modest fashion curated for Bangladesh",
    active: payload.active !== false,
  };
};

export async function loadCarousel(): Promise<CarouselItem[]> {
  const payload = await kv.get<unknown>(SITE_CAROUSEL_KEY);
  return normalizeCarouselPayload(payload);
}

export async function saveCarousel(items: unknown[]) {
  const normalized = normalizeCarouselPayload(items);
  await kv.set(SITE_CAROUSEL_KEY, normalized);
}

export async function loadAnnouncement(): Promise<AnnouncementContent> {
  const payload = await kv.get<unknown>(SITE_ANNOUNCEMENT_KEY);
  return normalizeAnnouncement(payload);
}

export async function saveAnnouncement(input: unknown) {
  const normalized = normalizeAnnouncement(input);
  await kv.set(SITE_ANNOUNCEMENT_KEY, normalized);
}

export async function loadFilters(): Promise<FilterPanelItem[]> {
  const payload = await kv.get<unknown>(SITE_FILTERS_KEY);
  return normalizeFiltersPayload(payload);
}

export async function saveFilters(input: unknown) {
  const normalized = normalizeFiltersPayload(input);
  await kv.set(SITE_FILTERS_KEY, normalized);
}
