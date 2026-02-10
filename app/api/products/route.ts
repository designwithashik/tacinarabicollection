/*
 * What this file does:
 *   - Exposes public product list from KV hash storage.
 * Why it exists:
 *   - Keeps storefront inventory in sync with admin product writes.
 */

import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stored = (await kv.hgetall<Record<string, unknown>>("tacin_collection_final")) ?? {};
    const items = Object.values(stored).filter(
      (value): value is Record<string, unknown> => Boolean(value && typeof value === "object")
    );
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}
