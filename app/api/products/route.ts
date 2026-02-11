/*
 * What this file does:
 *   - Exposes public product list from KV collection storage.
 */

import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PRODUCTS_KEY = "tacin_collection_final";

type ProductRecord = Record<string, unknown>;

const normalizeCollection = (payload: unknown): ProductRecord[] => {
  if (Array.isArray(payload)) {
    return payload
      .flat()
      .filter((value): value is ProductRecord => Boolean(value && typeof value === "object"));
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as ProductRecord;

    if ("id" in objectPayload) {
      return [objectPayload];
    }

    return Object.values(objectPayload).filter(
      (value): value is ProductRecord => Boolean(value && typeof value === "object")
    );
  }

  return [];
};

export async function GET() {
  try {
    const rawCollection = await kv.get<unknown>(PRODUCTS_KEY);
    const normalized = normalizeCollection(rawCollection);

    if (normalized.length > 0) {
      return NextResponse.json(normalized);
    }

    // Backward-compatibility for older hash-based writes.
    const hashCollection = (await kv.hgetall<ProductRecord>(PRODUCTS_KEY)) ?? {};
    return NextResponse.json(normalizeCollection(hashCollection));
  } catch {
    return NextResponse.json([]);
  }
}
