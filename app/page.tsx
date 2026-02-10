export const dynamic = "force-dynamic";
export const revalidate = 0;

import { kv } from "@vercel/kv";
import HomeClient from "./HomeClient";
import type { AdminProduct } from "../lib/inventory";

const PRODUCTS_HASH_KEY = "tacin_products";

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

export default async function HomePage() {
  let initialAdminProducts: AdminProduct[] = [];

  try {
    const stored = (await kv.hgetall<Record<string, unknown>>(PRODUCTS_HASH_KEY)) ?? {};
    initialAdminProducts = Object.values(stored).filter(isAdminProduct);
  } catch {
    initialAdminProducts = [];
  }

  return <HomeClient initialAdminProducts={initialAdminProducts} />;
}
