/*
 * What this file does:
 *   - Exposes public product list from canonical inventory storage.
 */

import { NextResponse } from "next/server";
import { loadInventoryArray, toStorefrontProduct } from "@/lib/server/inventoryStore";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const heroOnly = searchParams.get("hero") === "true";

    const products = await loadInventoryArray();
    const activeProducts = products.filter((p) => p.active);

    if (heroOnly) {
      return NextResponse.json(
        activeProducts
          .filter((p) => p.heroFeatured)
          .slice(0, 3)
          .map(toStorefrontProduct)
      );
    }

    return NextResponse.json(activeProducts.map(toStorefrontProduct));
  } catch {
    return NextResponse.json([]);
  }
}
