/*
 * What this file does:
 *   - Exposes public product list from canonical inventory storage.
 */

import { NextResponse } from "next/server";
import { loadInventoryArray, toStorefrontProduct } from "@/lib/server/inventoryStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await loadInventoryArray();
    return NextResponse.json(products.filter((p) => p.active).map(toStorefrontProduct));
  } catch {
    return NextResponse.json([]);
  }
}
