import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const PRODUCTS_HASH_KEY = "tacin_products";

export async function GET() {
  try {
    if (!process.env.KV_REST_API_URL) {
      return NextResponse.json(
        { error: "Vercel KV is not linked to this project." },
        { status: 500 }
      );
    }

    const stored = (await kv.hgetall<Record<string, unknown>>(PRODUCTS_HASH_KEY)) ?? {};
    const items = Object.values(stored).filter(
      (value): value is Record<string, unknown> => Boolean(value && typeof value === "object")
    );

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("KV READ ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, description, category, imageUrl, whatsappNumber } = body;

    // 1. Check if KV is connected
    if (!process.env.KV_REST_API_URL) {
      return NextResponse.json(
        { error: "Vercel KV is not linked to this project." },
        { status: 500 }
      );
    }

    // 2. Generate a unique ID (Product Name + Timestamp)
    const productId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 3. Append to KV hash (adds one field; does not replace the whole collection)
    await kv.hset(PRODUCTS_HASH_KEY, {
      [productId]: {
        id: productId,
        name,
        price,
        description,
        category,
        imageUrl,
        image: imageUrl,
        whatsappNumber,
        active: true,
        colors: ["Beige"],
        sizes: ["M", "L", "XL"],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    });

    // Force fresh data on storefront and admin inventory after write.
    revalidatePath("/");
    revalidatePath("/admin/inventory");

    return NextResponse.json({ success: true, id: productId });
  } catch (error: any) {
    console.error("KV SAVE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
