/*
 * What this file does:
 *   - Updates a single admin product in KV collection storage.
 */

import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const PRODUCTS_KEY = "tacin_collection_final";

type ProductRecord = Record<string, unknown>;

const normalizeCollection = (payload: unknown): ProductRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is ProductRecord => Boolean(item && typeof item === "object")
    );
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as ProductRecord;

    if (typeof objectPayload.id === "string") {
      return [objectPayload];
    }

    return Object.values(objectPayload).filter(
      (item): item is ProductRecord => Boolean(item && typeof item === "object")
    );
  }

  return [];
};

const loadCollection = async (): Promise<ProductRecord[]> => {
  const stored = await kv.get<unknown>(PRODUCTS_KEY);
  const normalized = normalizeCollection(stored);
  if (normalized.length > 0) return normalized;

  const legacy = (await kv.hgetall<Record<string, unknown>>(PRODUCTS_KEY)) ?? {};
  return normalizeCollection(legacy);
};

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await req.json()) as ProductRecord & { imageUrl?: string };
    const { id } = params;

    const array = await loadCollection();
    const current = array.find((item) => item.id === id) ?? {};

    const patch: ProductRecord = {
      ...body,
      ...(body.imageUrl ? { image: body.imageUrl } : {}),
      updatedAt: new Date().toISOString(),
      id,
    };

    const updatedItem = { ...current, ...patch };
    const updated = [updatedItem, ...array.filter((item) => item.id !== id)];

    await kv.set(PRODUCTS_KEY, updated);

    revalidatePath("/");
    revalidatePath("/admin/inventory");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
