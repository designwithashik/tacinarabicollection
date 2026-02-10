/*
 * What this file does:
 *   - Deletes a product from KV hash storage.
 * Why it exists:
 *   - Keeps admin delete flow consistent with GET/POST key.
 */

import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await kv.hdel("tacin_collection_final", params.id);

    revalidatePath("/");
    revalidatePath("/admin/inventory");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
