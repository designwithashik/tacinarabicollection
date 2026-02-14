/*
 * What this file does:
 *   - Deletes a product from KV collection storage.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { loadInventoryArray, saveInventoryArray } from "@/lib/server/inventoryStore";

export const runtime = "edge";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await loadInventoryArray();
    const updated = existing.filter((item) => item.id !== params.id);

    await saveInventoryArray(updated);

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
