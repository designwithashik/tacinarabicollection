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

const isAuthorized = (request: Request) =>
  Boolean(process.env.ADMIN_SECRET) &&
  getSecret(request) === process.env.ADMIN_SECRET;

const PRODUCTS_KEY = "products:current";

const getStoredProducts = async () => {
  const current = (await kv.get<{ data: StoredProduct[] }>(PRODUCTS_KEY)) ?? {
    data: [],
  };
  return Array.isArray(current.data) ? current.data : [];
};

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const payload = (await request.json()) as Partial<StoredProduct>;
  const stored = await getStoredProducts();
  const next = stored.map((item) => {
    if (item.id !== params.id) return item;
    return {
      ...item,
      ...payload,
      price: payload.price !== undefined ? Number(payload.price) : item.price,
      updatedAt: Date.now(),
    };
  });
  await kv.set(PRODUCTS_KEY, { data: next });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const stored = await getStoredProducts();
  const next = stored.map((item) =>
    item.id === params.id ? { ...item, active: false, updatedAt: Date.now() } : item
  );
  await kv.set(PRODUCTS_KEY, { data: next });
  return NextResponse.json({ ok: true });
}
