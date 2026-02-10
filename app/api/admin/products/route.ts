import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

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
    const productId = `prod_${Date.now()}`;

    // 3. Save to KV (We store products in a 'products' hash for easy listing)
    await kv.hset("tacin_products", {
      [productId]: {
        id: productId,
        name,
        price,
        description,
        category,
        imageUrl,
        whatsappNumber,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, id: productId });
  } catch (error: any) {
    console.error("KV SAVE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
