/*
 * What this file does:
 *   - Exposes public product list from canonical inventory storage.
 */

import { NextResponse } from "next/server";
import { loadInventoryArray, toStorefrontProduct } from "@/lib/server/inventoryStore";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const jsonNoStore = (payload: unknown) =>
  NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    },
  });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const heroOnly = searchParams.get("hero") === "true";

    const products = await loadInventoryArray();
    const activeProducts = products.filter((p) => p.active);

    if (heroOnly) {
      return jsonNoStore(
        activeProducts
          .filter((p) => p.heroFeatured)
          .slice(0, 3)
          .map(toStorefrontProduct)
      );
    }

    return jsonNoStore(activeProducts.map(toStorefrontProduct));
  } catch {
    return jsonNoStore([]);
  }
}
