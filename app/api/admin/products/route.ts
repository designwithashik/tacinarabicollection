import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const PRODUCTS_KEY = "tacin_collection_final";

const hasKvConnection = Boolean(
  (process.env.KV_URL || process.env.KV_REST_API_URL) && process.env.KV_REST_API_TOKEN
);

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

export async function GET() {
  if (!hasKvConnection) {
    return NextResponse.json([]);
  }

  try {
    const existing = await kv.get<unknown>(PRODUCTS_KEY);
    return NextResponse.json(toArray(existing));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, description, category, imageUrl, whatsappNumber } = body;

    if (!hasKvConnection) {
      return NextResponse.json([]);
    }

    // CRITICAL: Always read collection first and force array shape.
    const existing = (await kv.get<unknown>(PRODUCTS_KEY)) ?? [];
    const array = toArray(existing);

    const productId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const newItem: ProductRecord = {
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
    };

    // CRITICAL: Save whole array back, never single object overwrite.
    const updated = [newItem, ...array.filter((item) => item?.id !== productId)];
    await kv.set(PRODUCTS_KEY, updated);

    revalidatePath("/");
    revalidatePath("/admin/inventory");

    return NextResponse.json({ success: true, id: productId });
  } catch {
    return NextResponse.json([]);
  }
}
