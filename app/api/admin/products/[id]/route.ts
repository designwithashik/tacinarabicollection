/*
 * What this file does:
 *   - Updates a single admin product in KV collection storage.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { loadInventoryArray, saveInventoryArray } from "@/lib/server/inventoryStore";

export const runtime = "edge";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await req.json()) as Record<string, unknown> & { imageUrl?: string };
    const { id } = params;

    const existing = await loadInventoryArray();
    const current = existing.find((item) => item.id === id);
    if (!current) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const updatedProduct = {
      ...current,
      ...body,
      imageUrl:
        typeof body.imageUrl === "string" && body.imageUrl.startsWith("http")
          ? body.imageUrl
          : current.imageUrl,
      price: typeof body.price === "number" ? body.price : current.price,
      updatedAt: Date.now(),
      heroFeatured: body.heroFeatured === true,
      title:
        typeof body.title === "string" && body.title.trim().length > 0
          ? body.title.trim()
          : current.name,
      subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() : "",
      id,
    };

    const updated = existing.map((item) => (item.id === id ? updatedProduct : item));
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
