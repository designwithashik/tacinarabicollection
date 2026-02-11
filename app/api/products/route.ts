/*
 * What this file does:
 *   - Exposes public product list from KV hash storage.
 * Why it exists:
 *   - Keeps storefront inventory in sync with admin product writes.
 */

import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PRODUCTS_KEY = "tacin_collection_final";

const normalizeCollection = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter(
      (value): value is Record<string, unknown> => Boolean(value && typeof value === "object")
    );
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;

    if ("id" in objectPayload) {
      return [objectPayload];
    }

    return Object.values(objectPayload).filter(
      (value): value is Record<string, unknown> => Boolean(value && typeof value === "object")
    );
  }

  return [];
};

export async function GET() {
  try {
    const hashCollection = (await kv.hgetall<Record<string, unknown>>(PRODUCTS_KEY)) ?? {};
    const hashItems = normalizeCollection(hashCollection);

    if (hashItems.length > 0) {
      return NextResponse.json(hashItems);
    }

    // Legacy fallback in case older deployments stored this key with kv.set().
    const rawCollection = await kv.get<unknown>(PRODUCTS_KEY);
    return NextResponse.json(normalizeCollection(rawCollection));
  } catch {
    return NextResponse.json([]);
  }
}
