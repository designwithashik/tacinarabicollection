/*
 * What this file does:
 *   - Deletes a product from KV collection storage.
 */

import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const PRODUCTS_KEY = "tacin_collection_final";

type ProductRecord = Record<string, unknown>;

const toArray = (payload: unknown): ProductRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is ProductRecord => Boolean(item && typeof item === "object")
    );
  }

  if (payload && typeof payload === "object") {
    return [payload as ProductRecord];
  }

  return [];
};

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // CRITICAL: Fetch existing and force array before filtering.
    const existing = (await kv.get<unknown>(PRODUCTS_KEY)) ?? [];
    const array = toArray(existing);
    const updated = array.filter((item) => item.id !== params.id);

    // CRITICAL: Save WHOLE array back.
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
