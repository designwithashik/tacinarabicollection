/*
 * What this file does:
 *   - Exposes public product list from KV-backed inventory.
 * Why it exists:
 *   - Persistent inventory without redeploy for storefront rendering.
 * Notes:
 *   - Returns [] gracefully when KV is unavailable.
 */

import { NextResponse } from "next/server";
import { getKVProducts } from "../../../lib/kvProducts";

export const runtime = "nodejs";

export async function GET() {
  try {
    const current = await getKVProducts();
    return NextResponse.json(current);
  } catch {
    return NextResponse.json([]);
  }
}
