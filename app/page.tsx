export const dynamic = "force-dynamic";
export const revalidate = 0;

import HomeClient from "./HomeClient";
import type { AdminProduct } from "../lib/inventory";
import { loadInventoryArray, toStorefrontProduct } from "@/lib/server/inventoryStore";

export default async function HomePage() {
  let initialAdminProducts: AdminProduct[] = [];

  try {
    const products = await loadInventoryArray();
    initialAdminProducts = products.map(toStorefrontProduct) as AdminProduct[];
  } catch {
    initialAdminProducts = [];
  }

  return <HomeClient initialAdminProducts={initialAdminProducts} />;
}
