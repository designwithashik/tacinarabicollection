/*
 * What this file does:
 *   - Creates admin products and persists them to KV.
 * Why it exists:
 *   - Persistent inventory without redeploy.
 * Notes:
 *   - Cloudinary unsigned upload provides imageUrl from admin client.
 */

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { AdminProduct } from "../../../../lib/inventory";
import { getKVProducts, setKVProducts } from "../../../../lib/kvProducts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<AdminProduct>;
  const { name, price, image } = body;

  if (!name || typeof price !== "number" || !image) {
    return NextResponse.json({ error: "Incomplete data" }, { status: 400 });
  }

  const existing = await getKVProducts();

  const newProduct: AdminProduct = {
    id: randomUUID(),
    name,
    price: Number(price),
    image,
    category: body.category === "Ceramic" ? "Ceramic" : "Clothing",
    colors: Array.isArray(body.colors) && body.colors.length ? body.colors : ["Beige"],
    sizes: Array.isArray(body.sizes) && body.sizes.length ? body.sizes : ["M", "L", "XL"],
    active: body.active !== false,
    updatedAt: new Date().toISOString(),
  };

  const updated = [newProduct, ...existing];
  await setKVProducts(updated);

  return NextResponse.json({ success: true, product: newProduct });
}
