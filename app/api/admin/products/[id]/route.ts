/*
 * What this file does:
 *   - Updates a single admin product in KV hash storage.
 * Why it exists:
 *   - Keeps admin edit flow consistent with POST/GET storage key.
 */

import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await req.json()) as Record<string, unknown> & { imageUrl?: string };
    const { id } = params;

    const existing = (await kv.hget<Record<string, unknown>>("tacin_collection_final", id)) ?? {};
    const patch = {
      ...body,
      ...(body.imageUrl ? { image: body.imageUrl } : {}),
      updatedAt: new Date().toISOString(),
      id,
    };

    await kv.hset("tacin_collection_final", { [id]: { ...existing, ...patch } });

    revalidatePath("/");
    revalidatePath("/admin/inventory");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
