export const dynamic = "force-dynamic";
export const revalidate = 0;

import { kv } from "@vercel/kv";
import HomeClient from "./HomeClient";
import type { AdminProduct } from "../lib/inventory";

const PRODUCTS_KEY = "tacin_collection_final";

const isAdminProduct = (value: unknown): value is AdminProduct => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AdminProduct>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.price === "number" &&
    typeof candidate.image === "string"
  );
};

const normalizeCollection = (payload: unknown): AdminProduct[] => {
  if (Array.isArray(payload)) {
    return payload.flat().filter(isAdminProduct);
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;

    if (isAdminProduct(objectPayload)) {
      return [objectPayload];
    }

    return Object.values(objectPayload).filter(isAdminProduct);
  }

  return [];
};

export default async function HomePage() {
  let initialAdminProducts: AdminProduct[] = [];

  try {
    const stored = await kv.get<unknown>(PRODUCTS_KEY);
    initialAdminProducts = normalizeCollection(stored);

    if (initialAdminProducts.length === 0) {
      const hashStored = (await kv.hgetall<Record<string, unknown>>(PRODUCTS_KEY)) ?? {};
      initialAdminProducts = normalizeCollection(hashStored);
    }
  } catch {
    initialAdminProducts = [];
  }

  return <HomeClient initialAdminProducts={initialAdminProducts} />;
}
