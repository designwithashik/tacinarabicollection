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

export async function GET() {
  try {
    return NextResponse.json(await loadCollection());
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, description, category, imageUrl, whatsappNumber } = body;

    const array = await loadCollection();
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

    const updated = [newItem, ...array.filter((item) => item?.id !== productId)];
    await kv.set(PRODUCTS_KEY, updated);

    revalidatePath("/");
    revalidatePath("/admin/inventory");

    return NextResponse.json({ success: true, id: productId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to save product." },
      { status: 500 }
    );
  }
}
