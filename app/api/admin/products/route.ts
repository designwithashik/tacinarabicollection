import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type StoredProduct = {
  id: string;
  name: string;
  price: number;
  size?: string;
  image: string;
  active: boolean;
  updatedAt: number;
  tags?: string[];
  stockStatus?: "in" | "low" | "out";
};

const getSecret = (request: Request) =>
  request.headers.get("x-admin-secret") ?? "";

const getAdminSecret = () =>
  process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

const isAuthorized = (request: Request) => {
  const secret = getAdminSecret();
  return Boolean(secret) && getSecret(request) === secret;
};

const PRODUCTS_KEY = "products:current";

const getStoredProducts = async () => {
  const current = (await kv.get<{ data: StoredProduct[] }>(PRODUCTS_KEY)) ?? {
    data: [],
  };
  return Array.isArray(current.data) ? current.data : [];
};

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const stored = await getStoredProducts();
  return NextResponse.json(stored);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const payload = (await request.json()) as Partial<StoredProduct>;
    const { name, price, image, size } = payload;

    if (!name || !price || !image) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const stored = await getStoredProducts();
    const newProduct: StoredProduct = {
      id: crypto.randomUUID(),
      name,
      price: Number(price),
      size: size ?? "",
      image,
      active: true,
      updatedAt: Date.now(),
    };

    const updated = [...stored, newProduct];
    await kv.set(PRODUCTS_KEY, { data: updated });

    return NextResponse.json(
      { success: true, product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("PRODUCT INSERT FAILED:", error);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
}
